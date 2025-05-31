import dbConnect from '@/lib/dbConnect';
import ScheduledEmail from '@/models/ScheduledEmail';
import { getEmailTemplate } from '@/lib/email/templates';
import nodemailer from 'nodemailer';

async function sendScheduledEmails() {
  await dbConnect();
  const now = new Date();
  const emails = await ScheduledEmail.find({ sent: false, scheduledDate: { $lte: now } });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  for (const email of emails) {
    for (const r of email.recipients) {
      const html = getEmailTemplate({
        name: r.firstName || r.name || "User",
        body: email.body,
        greeting: email.greeting,
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: r.email,
        subject: email.subject,
        html,
      });
    }
    email.sent = true;
    email.sentAt = new Date();
    await email.save();
  }
  console.log(`Sent ${emails.length} scheduled emails.`);
}

sendScheduledEmails().then(() => process.exit()); 