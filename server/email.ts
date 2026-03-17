import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, otp: string, type: "verify" | "reset") {

  const subject =
    type === "verify"
      ? "Verify your Sparkle n' Glee account"
      : "Your Sparkle n' Glee password reset code";

  const title =
    type === "verify"
      ? "Email Verification"
      : "Password Reset";

  await resend.emails.send({
    from: "Sparkle n' Glee <onboarding@resend.dev>",
    to: email,
    subject,
    html: `
      <h2>${title}</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}