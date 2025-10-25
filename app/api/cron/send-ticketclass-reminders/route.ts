import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TicketClass from "@/lib/models/TicketClass";
import User from "@/lib/models/User";
import sendEmail from "@/lib/sendEmail";
import Settings from "@/lib/models/Settings";

function getTicketClassReminderTemplate(studentName: string, className: string, date: string, hour: string, endHour: string) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f7f8fa; padding: 32px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: #10b981; color: #fff; padding: 24px 0; text-align: center; font-size: 2rem; font-weight: bold;">
          📋 Ticket Class Reminder 📋
        </div>
        <div style="padding: 32px; color: #222;">
          <p>Hi, <b>${studentName}</b>!</p>
          <p>
            This is a friendly reminder that your ticket class <b>"${className}"</b> will start at <b>${hour}</b> and end at <b>${endHour}</b> on <b>${date}</b>.<br>
            Please be ready 5 minutes before the scheduled time.<br>
            Don't forget to bring any required materials!
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

function logWithColor(message: string, color: string = "\x1b[36m") {
  console.log(`${color}%s\x1b[0m`, message);
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

  // Obtener todas las ticket classes
  const ticketClasses = await TicketClass.find({});

  logWithColor(`[TICKET CLASS REMINDER] Consulta recibida (${req.method}) - ${new Date().toISOString()}`, "\x1b[35m");

  for (const ticketClass of ticketClasses) {
    // Verificar si la ticket class tiene estudiantes
    if (Array.isArray(ticketClass.students) && ticketClass.students.length > 0) {
      // Obtener la hora actual en UTC y en Miami
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const miamiOffset = -4; // UTC-4
      const nowMiami = new Date(utc + miamiOffset * 60 * 60 * 1000);

      // Crear la fecha de la clase en Miami
      const classDate = new Date(ticketClass.date);
      const [hour, minute] = (ticketClass.hour || "00:00").split(':').map(Number);
      const classDateMiami = new Date(classDate.getFullYear(), classDate.getMonth(), classDate.getDate(), hour, minute);

      // Diferencia en minutos en la zona de Miami
      const diffMinutes = (classDateMiami.getTime() - nowMiami.getTime()) / 60000;
      
      logWithColor(`[TICKET CLASS REMINDER] Clase: ${ticketClass.type || 'Unknown'} | ${ticketClass.date} ${ticketClass.hour || '00:00'} (Miami) | diff: ${diffMinutes.toFixed(2)} min`, "\x1b[33m");
      
      if (diffMinutes > 0 && diffMinutes <= 30) {
        // Ensure students is an array before iterating
        const studentsArray = Array.isArray(ticketClass.students) ? ticketClass.students : [];
        
        // Iterar sobre cada estudiante en la ticket class
        for (const studentId of studentsArray) {
          const student = await User.findById(studentId);
          
          if (student && (student as any).classReminder === true) {
            reminders.push(`- ${student.firstName} ${student.lastName} | ${student.email} | ${ticketClass.type || 'Unknown'} | ${ticketClass.date} ${ticketClass.hour || '00:00'} | In ${Math.round(diffMinutes)} min`);
            
            const html = getTicketClassReminderTemplate(
              `${student.firstName} ${student.lastName}`.trim(),
              ticketClass.type || 'Unknown Class',
              new Date(ticketClass.date).toLocaleDateString(),
              ticketClass.hour || '00:00',
              ticketClass.endHour || '00:00'
            );
            
            await sendEmail(
              [student.email],
              `Ticket Class Reminder: ${ticketClass.type || 'Class'} on ${new Date(ticketClass.date).toLocaleDateString()}`,
              `Your ticket class "${ticketClass.type || 'Class'}" starts at ${ticketClass.hour || '00:00'} on ${new Date(ticketClass.date).toLocaleDateString()}.`,
              html
            );
            
            sentCount++;
          } else if (student && (student as any).classReminder === false) {
            logWithColor(`[TICKET CLASS REMINDER] Skipped ${student.firstName} ${student.lastName} - classReminder is false`, "\x1b[31m");
          }
        }
      }
    }
  }

  if (reminders.length > 0) {
    reminders.forEach(r => console.log(r));
  } else {
    logWithColor(`[TICKET CLASS REMINDER] No upcoming ticket classes within 30 minutes.`, "\x1b[36m");
  }

  return NextResponse.json({ sent: sentCount });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
