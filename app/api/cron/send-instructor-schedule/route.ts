import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Instructor from "@/lib/models/Instructor";
import sendEmail from "@/lib/sendEmail";
import { getEmailTemplate } from "@/lib/email/templates";

function logWithColor(message: string, color: string = "\x1b[36m") {
  console.log(`${color}%s\x1b[0m`, message);
}

export async function POST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const miamiOffset = -4; // UTC-4
  const nowMiami = new Date(utc + miamiOffset * 60 * 60 * 1000);

  // Ajustar la hora actual a 8:00 PM Miami
  nowMiami.setHours(20, 0, 0, 0);

  await dbConnect();

  const instructors = await Instructor.find({});
  let sentCount = 0;

  for (const instructor of instructors) {
    try {
      // Debido al desfase en las fechas guardadas, buscamos las clases del día anterior
      // que en realidad corresponden al día siguiente real
      const yesterday = new Date(nowMiami);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = yesterday.toISOString().split("T")[0]; // Formato YYYY-MM-DD

      // Filtrar las clases programadas (que están guardadas con desfase)
      const tomorrowSchedule = instructor.schedule.filter((entry: { date: string; start: string; end: string; classType?: string }) => {
        const entryDateStr = new Date(entry.date).toISOString().split("T")[0];
        return entryDateStr === yesterdayDateStr;
      });

      if (tomorrowSchedule.length > 0) {
        // Ordenar las clases por hora de inicio
        tomorrowSchedule.sort((a: { start: string }, b: { start: string }) => a.start.localeCompare(b.start));

        // Crear el detalle de las clases organizadas
        const scheduleDetails = tomorrowSchedule.map((entry: { classType?: string; start: string; end: string }) => {
          return `• Class Type: ${entry.classType}\n  Start Time: ${entry.start}\n  End Time: ${entry.end}`;
        }).join("\n\n");

        const emailBody = `Here are your classes scheduled for tomorrow:\n\n${scheduleDetails}\n\nBest regards,\nDriving School Team`;
        const html = getEmailTemplate({ name: instructor.name, body: emailBody.replace(/\n/g, '<br>') });

        await sendEmail(instructor.email, "Tomorrow's Classes", emailBody, html);
        sentCount++;
        
        logWithColor(`[CRON] Email sent to ${instructor.name} - Classes: ${tomorrowSchedule.length}`, "\x1b[32m");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logWithColor(`[CRON] Error sending email to ${instructor.name}: ${errorMessage}`, "\x1b[31m");
    }
  }

  logWithColor(`[CRON] Emails sent: ${sentCount}`, sentCount > 0 ? "\x1b[32m" : "\x1b[36m");
  return NextResponse.json({ sent: sentCount });
}

export async function GET() {
  return POST();
}
