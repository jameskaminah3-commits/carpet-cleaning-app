import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Sparkle n' Glee <onboarding@resend.dev>";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (amount: string | number | null | undefined) => {
  const numeric = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0));
  return `KES ${Number.isFinite(numeric) ? numeric.toLocaleString() : "0"}`;
};

const getOrderCode = (orderId: string) => `ORDER-${orderId.slice(0, 8).toUpperCase()}`;

async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return;
  if (!resend) {
    console.warn(`[email] Skipping "${subject}" because RESEND_API_KEY is not configured.`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendOtpEmail(email: string, otp: string, type: "verify" | "reset") {
  const subject =
    type === "verify"
      ? "Verify your Sparkle n' Glee account"
      : "Your Sparkle n' Glee password reset code";

  const title = type === "verify" ? "Email Verification" : "Password Reset";

  await sendEmail(
    email,
    subject,
    `
      <h2>${title}</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:4px">${escapeHtml(otp)}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  );
}

export async function sendCustomerOrderReceivedEmail(args: {
  email: string;
  name: string;
  orderId: string;
  totalAmount: string;
  itemsCount: number;
  pickupOption: string;
  returnOption: string;
  locationName?: string | null;
  pickupAddress?: string | null;
}) {
  const location = args.locationName || args.pickupAddress || "your selected location";
  await sendEmail(
    args.email,
    `We received your order ${getOrderCode(args.orderId)}`,
    `
      <h2>Order received</h2>
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>We have received your carpet cleaning order and our team will review it shortly.</p>
      <p><strong>Order:</strong> ${escapeHtml(getOrderCode(args.orderId))}</p>
      <p><strong>Total:</strong> ${escapeHtml(formatMoney(args.totalAmount))}</p>
      <p><strong>Items:</strong> ${args.itemsCount}</p>
      <p><strong>Pickup:</strong> ${escapeHtml(args.pickupOption)}</p>
      <p><strong>Return:</strong> ${escapeHtml(args.returnOption)}</p>
      <p><strong>Location:</strong> ${escapeHtml(location)}</p>
      <p>We will keep you updated as your order moves through pickup, cleaning, and delivery.</p>
    `,
  );
}

export async function sendAdminNewOrderEmail(args: {
  email: string;
  orderId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  totalAmount: string;
  itemsCount: number;
  pickupOption: string;
  returnOption: string;
  locationName?: string | null;
  pickupAddress?: string | null;
}) {
  const location = args.locationName || args.pickupAddress || "No pickup address provided";
  await sendEmail(
    args.email,
    `New order received: ${getOrderCode(args.orderId)}`,
    `
      <h2>New customer order</h2>
      <p>A new order has just been placed.</p>
      <p><strong>Order:</strong> ${escapeHtml(getOrderCode(args.orderId))}</p>
      <p><strong>Customer:</strong> ${escapeHtml(args.customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(args.customerEmail || "Not provided")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(args.customerPhone)}</p>
      <p><strong>Total:</strong> ${escapeHtml(formatMoney(args.totalAmount))}</p>
      <p><strong>Items:</strong> ${args.itemsCount}</p>
      <p><strong>Pickup:</strong> ${escapeHtml(args.pickupOption)}</p>
      <p><strong>Return:</strong> ${escapeHtml(args.returnOption)}</p>
      <p><strong>Location:</strong> ${escapeHtml(location)}</p>
    `,
  );
}

export async function sendOrderStatusEmail(args: {
  email: string;
  name: string;
  orderId: string;
  statusLabel: string;
  locationName?: string | null;
  pickupAddress?: string | null;
}) {
  const location = args.locationName || args.pickupAddress || "your selected location";
  await sendEmail(
    args.email,
    `${args.statusLabel}: ${getOrderCode(args.orderId)}`,
    `
      <h2>Order update</h2>
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>Your order <strong>${escapeHtml(getOrderCode(args.orderId))}</strong> is now <strong>${escapeHtml(args.statusLabel)}</strong>.</p>
      <p><strong>Location:</strong> ${escapeHtml(location)}</p>
      <p>We will continue updating you as your order progresses.</p>
    `,
  );
}

export async function sendPaymentRequestEmail(args: {
  email: string;
  name: string;
  orderId: string;
  amount: string;
  locationName?: string | null;
  pickupAddress?: string | null;
}) {
  const location = args.locationName || args.pickupAddress || "your selected location";
  await sendEmail(
    args.email,
    `Payment needed for ${getOrderCode(args.orderId)}`,
    `
      <h2>Payment needed</h2>
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>Your order <strong>${escapeHtml(getOrderCode(args.orderId))}</strong> is ready for the next step.</p>
      <p>Please make payment of <strong>${escapeHtml(formatMoney(args.amount))}</strong> so we can proceed.</p>
      <p><strong>Location:</strong> ${escapeHtml(location)}</p>
      <p>Once payment is confirmed, we will continue with pickup and cleaning updates.</p>
    `,
  );
}

export async function sendPaymentReceivedEmail(args: {
  email: string;
  name: string;
  orderId: string;
  amount: string;
  method?: string;
}) {
  await sendEmail(
    args.email,
    `Payment received for ${getOrderCode(args.orderId)}`,
    `
      <h2>Payment received</h2>
      <p>Hi ${escapeHtml(args.name)},</p>
      <p>We have recorded payment of <strong>${escapeHtml(formatMoney(args.amount))}</strong> for your order <strong>${escapeHtml(getOrderCode(args.orderId))}</strong>.</p>
      <p><strong>Method:</strong> ${escapeHtml(args.method || "Payment confirmed by admin")}</p>
      <p>Your balance has been updated and your order can now move to the next step.</p>
    `,
  );
}

export async function sendAdminPaymentRecordedEmail(args: {
  email: string;
  orderId: string;
  customerName: string;
  amount: string;
  method: string;
  receiptNumber?: string;
}) {
  await sendEmail(
    args.email,
    `Payment recorded for ${getOrderCode(args.orderId)}`,
    `
      <h2>Payment recorded</h2>
      <p>A payment has been recorded for <strong>${escapeHtml(getOrderCode(args.orderId))}</strong>.</p>
      <p><strong>Customer:</strong> ${escapeHtml(args.customerName)}</p>
      <p><strong>Amount:</strong> ${escapeHtml(formatMoney(args.amount))}</p>
      <p><strong>Method:</strong> ${escapeHtml(args.method)}</p>
      <p><strong>Receipt:</strong> ${escapeHtml(args.receiptNumber || "Not provided")}</p>
    `,
  );
}
