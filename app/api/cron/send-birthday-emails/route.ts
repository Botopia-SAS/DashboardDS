import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/users";  
import sendEmail from "@/lib/sendEmail";

function getBirthdayTemplate(name: string, age: number) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f7f8fa; padding: 32px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: #3b82f6; color: #fff; padding: 24px 0; text-align: center; font-size: 2rem; font-weight: bold;">
          🎉 Happy Birthday from Driving School! 🎉
        </div>
        <div style="padding: 32px; color: #222;">
          <p>Hello, <b>${name}</b>!</p>
          <p>
            Congratulations on turning <b>${age}</b>!<br>
            Wishing you a fantastic birthday filled with joy and success.<br>
            As a valued member of our Driving School family, we hope your special day is as amazing as you are.<br>
            Enjoy your day and remember, we're here to help you reach your driving goals!
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

export async function POST(req: NextRequest) {
  // Protección con secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear();

  // Traer todos los usuarios con birthDate
  const users = await User.find({ birthDate: { $exists: true } });

  // Filtrar en JS para soportar string o Date y comparar usando UTC
  const birthdayUsers = users.filter(user => {
    if (!user.birthDate) return false;
    const date = new Date(user.birthDate);
    return (
      date.getUTCDate() === today.getUTCDate() &&
      date.getUTCMonth() === today.getUTCMonth()
    );
  });

  // LOG: cuántos cumplen años hoy
  //console.log(`[BIRTHDAY] Users with birthday today: ${birthdayUsers.length}`);
  birthdayUsers.forEach(user => {
    const date = new Date(user.birthDate);
    const age = year - date.getFullYear();
    //console.log(`- ${user.firstName} ${user.lastName} | ${user.email} | Birth: ${date.toISOString().slice(0,10)} | Age: ${age}`);
  });

  let sentCount = 0;
  for (const user of birthdayUsers) {
    const date = new Date(user.birthDate);
    const age = year - date.getFullYear();
    const html = getBirthdayTemplate(`${user.firstName} ${user.lastName}`.trim() || "Student", age);
    await sendEmail(
      [user.email],
      `Happy Birthday from Driving School!`,
      `Congratulations on turning ${age}! Wishing you a fantastic birthday filled with joy and success.`,
      html
    );
    sentCount++;
  }

  return NextResponse.json({ sent: sentCount });
}

export async function GET(req: NextRequest) {
  return POST(req);
} 