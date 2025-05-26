import { NextRequest, NextResponse } from "next/server";
import { getEmailTemplate } from "@/lib/email/templates";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  const { recipients, subject, body, templateId } = await req.json();
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  await Promise.all(
    recipients.map(async (r: any) => {
      const html = getEmailTemplate({ name: r.firstName || r.name || "User", body });
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: r.email,
          subject,
          html,
        });
        sent.push(r.email);
      } catch (err: any) {
        failed.push({ email: r.email, error: err.message });
      }
    })
  );

  return NextResponse.json({ success: failed.length === 0, sent, failed });
} 