const SANDBOX_URL = "https://sandbox.safaricom.co.ke";
const PRODUCTION_URL = "https://api.safaricom.co.ke";

function getBaseUrl(): string {
  return process.env.MPESA_ENV === "production" ? PRODUCTION_URL : SANDBOX_URL;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function generateAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa consumer key and secret are required");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${response.status} ${responseText}`);
  }

  let data: { access_token: string; expires_in: string };
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`M-Pesa auth returned invalid response: ${responseText.slice(0, 200)}`);
  }
  const expiresInMs = (parseInt(data.expires_in) - 60) * 1000;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  return cachedToken.token;
}

export function formatPhoneForMpesa(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface STKCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

export async function initiateSTKPush(
  phone: string,
  amount: number,
  accountReference: string,
  description: string,
  callbackUrl: string
): Promise<STKPushResponse> {
  const token = await generateAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "";
  const timestamp = generateTimestamp();
  const password = generatePassword(shortcode, passkey, timestamp);
  const formattedPhone = formatPhoneForMpesa(phone);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(amount),
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: description,
  };

  const url = `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`;

  console.log(`[M-Pesa] Initiating STK Push to ${formattedPhone} for KES ${amount}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error("[M-Pesa] STK Push returned non-JSON response:", responseText.slice(0, 300));
    throw new Error("M-Pesa service is temporarily unavailable. Please try again in a moment.");
  }

  if (!response.ok || data.errorCode) {
    console.error("[M-Pesa] STK Push failed:", data);
    throw new Error(data.errorMessage || data.ResponseDescription || "STK Push failed");
  }

  console.log(`[M-Pesa] STK Push sent. CheckoutRequestID: ${data.CheckoutRequestID}`);
  return data as STKPushResponse;
}

export async function querySTKPushStatus(checkoutRequestId: string): Promise<{
  ResultCode: string;
  ResultDesc: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
}> {
  const token = await generateAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "";
  const timestamp = generateTimestamp();
  const password = generatePassword(shortcode, passkey, timestamp);

  const url = `${getBaseUrl()}/mpesa/stkpushquery/v1/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await response.json() as any;
  return data;
}

export function extractCallbackMetadata(callback: STKCallbackBody["Body"]["stkCallback"]): {
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  amount?: number;
} {
  const metadata: Record<string, any> = {};
  if (callback.CallbackMetadata?.Item) {
    for (const item of callback.CallbackMetadata.Item) {
      if (item.Name === "MpesaReceiptNumber") metadata.mpesaReceiptNumber = String(item.Value);
      if (item.Name === "TransactionDate") metadata.transactionDate = String(item.Value);
      if (item.Name === "PhoneNumber") metadata.phoneNumber = String(item.Value);
      if (item.Name === "Amount") metadata.amount = Number(item.Value);
    }
  }
  return metadata;
}
