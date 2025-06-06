import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function sendEmail(
  recipients: string[],
  subject: string,
  body: string,
  html?: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: recipients,
    subject,
    text: body,
    ...(html ? { html } : {}),
  });
} 