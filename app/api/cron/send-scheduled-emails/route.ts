import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ScheduledEmail from "@/lib/models/ScheduledEmail";
import sendEmail from "@/lib/sendEmail";
import { getEmailTemplate } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  // Protección con secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const now = new Date();
  const emails = await ScheduledEmail.find({
    scheduledDate: { $lte: now }
  });

  let sentCount = 0;
  for (const email of emails) {
    try {
      const name = email.recipients[0] || "User";
      const html = getEmailTemplate({ name, body: email.body });
      await sendEmail(email.recipients, email.subject, email.body, html);
      await email.deleteOne();
      sentCount++;
    } catch (err) {
      // Puedes loguear el error si quieres
    }
  }
  return NextResponse.json({ sent: sentCount });
} 