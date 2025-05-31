import { NextRequest, NextResponse } from "next/server";
import { getEmailTemplate } from "@/lib/email/templates";
import nodemailer from "nodemailer";
import ScheduledEmail from '@/models/ScheduledEmail';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface Recipient {
  email: string;
  firstName?: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  const { recipients, subject, body, greeting, scheduledDate, templateId } = await req.json();
  if (scheduledDate) {
    await ScheduledEmail.create({
      recipients,
      subject,
      body,
      greeting,
      templateId,
      scheduledDate,
      sent: false
    });
    return NextResponse.json({ scheduled: true });
  }
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  await Promise.all(
    recipients.map(async (r: Recipient) => {
      const html = getEmailTemplate({ name: r.firstName || r.name || "User", body, greeting });
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: r.email,
          subject,
          html,
        });
        sent.push(r.email);
      } catch (err: unknown) {
        failed.push({ email: r.email, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    })
  );

  return NextResponse.json({ success: failed.length === 0, sent, failed });
} 