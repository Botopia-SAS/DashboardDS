import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Instructor from "@/lib/models/Instructor";
import User from "@/lib/models/User";
import sendEmail from "@/lib/sendEmail";
import Settings from "@/lib/models/Settings";

function getReminderTemplate(studentName: string, instructorName: string, date: string, start: string) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f7f8fa; padding: 32px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: #3b82f6; color: #fff; padding: 24px 0; text-align: center; font-size: 2rem; font-weight: bold;">
          🚗 Driving Class Reminder 🚗
        </div>
        <div style="padding: 32px; color: #222;">
          <p>Hi, <b>${studentName}</b>!</p>
          <p>
            This is a friendly reminder that your driving class with instructor <b>${instructorName}</b> will start at <b>${start}</b> on <b>${date}</b>.<br>
            Please be ready 5 minutes before the scheduled time.<br>
            Good luck and enjoy your lesson!
          </p>
        </div>
        <div style="background: #111827; color: #fff; padding: 24px; text-align: center;">
          <b>Affordable Driving<br>Traffic School</b><br>
          West Palm Beach, FL | <a href="mailto:info@drivingschoolpalmbeach.com" style="color: #60a5fa;">info@drivingschoolpalmbeach.com</a> | 561 330 7007<br>
          <span style="font-size: 0.9rem;">© 2025 Powered By Botopia Technology S.A.S</span>
        </div>
      </div>
    </div>
  `;
}

// Log de consulta recibida
function logWithColor(message: string, color: string = "\x1b[36m") {
  // cyan por defecto

}

export async function POST(req: NextRequest) {
  await dbConnect();
  // Protección con secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Consultar settings
  const settings = await Settings.findOne();
  if (settings && settings.sendClassReminders === false) {
    return NextResponse.json({ sent: 0, disabled: true });
  }
  
  let sentCount = 0;
  const reminders: string[] = [];

  const instructors = await Instructor.find({});

  // Log de consulta recibida
  logWithColor(`[CLASS REMINDER] Consulta recibida (${req.method}) - ${new Date().toISOString()}`, "\x1b[35m");

  for (const instructor of instructors) {
    const schedule = instructor.schedule_driving_lesson || [];
    for (const slot of schedule) {
      if (slot.status === 'booked' && slot.studentId) {
        // Obtener la hora actual en UTC y en Miami
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const miamiOffset = -4; // UTC-4 (ajusta a -5 si es invierno)
        const nowMiami = new Date(utc + miamiOffset * 60 * 60 * 1000);

        // Crear la fecha de la clase en Miami
        const [year, month, day] = slot.date.split('-').map(Number);
        const [hour, minute] = slot.start.split(':').map(Number);
        const classDateMiami = new Date(year, month - 1, day, hour, minute);

        // Diferencia en minutos en la zona de Miami
        const diffMinutes = (classDateMiami.getTime() - nowMiami.getTime()) / 60000;
        logWithColor(`[CLASS REMINDER] Clase: ${slot.date} ${slot.start} (Miami) | classDateMiami: ${classDateMiami.toISOString()} | nowMiami: ${nowMiami.toISOString()} | diff: ${diffMinutes.toFixed(2)} min`, "\x1b[33m");
        if (diffMinutes > 0 && diffMinutes <= 30) {
          // Buscar estudiante
          const student = await User.findById(slot.studentId);
          if (student && (student as any).drivingTestReminder === true) {
            reminders.push(`- ${student.firstName} ${student.lastName} | ${student.email} | ${slot.date} ${slot.start} | Instructor: ${instructor.name} | In ${Math.round(diffMinutes)} min`);
            const html = getReminderTemplate(
              `${student.firstName} ${student.lastName}`.trim(),
              instructor.name,
              slot.date,
              slot.start
            );
            await sendEmail(
              [student.email],
              `Driving Class Reminder: ${slot.date} at ${slot.start}`,
              `Your driving class with instructor ${instructor.name} starts at ${slot.start} on ${slot.date}.`,
              html
            );
            sentCount++;
          } else if (student && (student as any).drivingTestReminder === false) {
            logWithColor(`[CLASS REMINDER] Skipped ${student.firstName} ${student.lastName} - drivingTestReminder is false`, "\x1b[31m");
          }
        }
      }
    }
  }

  if (reminders.length > 0) {
    //console.log(`[CLASS REMINDER] Sent ${sentCount} reminders:`);
    reminders.forEach(r => console.log(r));
  } else {
    //console.log(`[CLASS REMINDER] No upcoming classes within 30 minutes.`);
  }

  return NextResponse.json({ sent: sentCount });
}

export async function GET(req: NextRequest) {
  return POST(req);
} 