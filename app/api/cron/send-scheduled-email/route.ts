import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ScheduledEmail from "@/lib/models/ScheduledEmail";
import sendEmail from "@/lib/sendEmail";
import { getEmailTemplate } from "@/lib/email/templates";

function logWithColor(message: string, color: string = "\x1b[36m") {
  // cyan por defecto
  console.log(`${color}%s\x1b[0m`, message);
}

export async function POST(req: NextRequest) {
  const now = new Date();
  //logWithColor(`[CRON] Consulta recibida (${req.method}) - ${now.toISOString()}`, "\x1b[35m");
  // Protección con secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    //logWithColor(`[CRON] Acceso denegado por secret incorrecto`, "\x1b[31m");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  // Hora actual en Miami
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const miamiOffset = -4; // UTC-4 (ajusta a -5 si es invierno)
  const nowMiami = new Date(utc + miamiOffset * 60 * 60 * 1000);

  const emails = await ScheduledEmail.find({});
  //logWithColor(`[CRON] Correos agendados encontrados: ${emails.length}`, emails.length > 0 ? "\x1b[33m" : "\x1b[32m");

  let sentCount = 0;
  for (const email of emails) {
    try {
      // Convertir la hora agendada a Miami
      const scheduled = new Date(email.scheduledDate);
      const scheduledMiami = new Date(scheduled.getTime() + miamiOffset * 60 * 60 * 1000);
      const diffMinutes = (scheduledMiami.getTime() - nowMiami.getTime()) / 60000;
      //logWithColor(`[CRON] Email: ${email.subject} | scheduledMiami: ${scheduledMiami.toISOString()} | nowMiami: ${nowMiami.toISOString()} | diff: ${diffMinutes.toFixed(2)} min`, "\x1b[36m");
      if (diffMinutes > 0) continue; // Solo enviar si la hora ya pasó en Miami
      const name = email.recipients[0] || "User";
      const html = getEmailTemplate({ name, body: email.body });
      await sendEmail(email.recipients, email.subject, email.body, html);
      await email.deleteOne();
      sentCount++;
    } catch (err) {
      // Puedes loguear el error si quieres
    }
  }
  //logWithColor(`[CRON] Correos enviados y eliminados: ${sentCount}`, sentCount > 0 ? "\x1b[32m" : "\x1b[36m");
  return NextResponse.json({ sent: sentCount });
}

export async function GET(req: NextRequest) {
  return POST(req);
} 