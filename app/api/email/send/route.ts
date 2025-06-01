import { NextRequest, NextResponse } from "next/server";
import { getEmailTemplate } from "@/lib/email/templates";
import nodemailer from "nodemailer";
import ScheduledEmail from '@/lib/models/ScheduledEmail';

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

  // Permitir recipients como string[] o Recipient[] para compatibilidad
  let recipientsList: Recipient[] = [];
  if (Array.isArray(recipients) && recipients.length > 0) {
    if (typeof recipients[0] === 'string') {
      recipientsList = recipients.map((email: string) => ({ email }));
    } else {
      recipientsList = recipients;
    }
  }

  if (!recipientsList.length || !subject || !body || (scheduledDate && !Date.parse(scheduledDate))) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  if (scheduledDate) {
    await ScheduledEmail.create({
      recipients: recipientsList.map(r => r.email),
      subject,
      body,
      scheduledDate,
      sent: false,
    });
    return NextResponse.json({ scheduled: true }, { status: 201 });
  }

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  await Promise.all(
    recipientsList.map(async (r: Recipient) => {
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