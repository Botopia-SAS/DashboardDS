import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextResponse } from "next/server";

export async function GET() {
  await connectToDB();

  const now = new Date();
  const THRESHOLD = 30 * 1000; // 30 segundos

  // Encuentra todas las sesiones activas
  const sessions = await Session.find({ sessionActive: true });

  // Marca como inactivas las que no han tenido actividad reciente
  await Promise.all(
    sessions.map(async (session) => {
      if (
        session.lastActive &&
        now.getTime() - new Date(session.lastActive).getTime() > THRESHOLD
      ) {
        session.sessionActive = false;
        session.endTimestamp = session.lastActive;
        await session.save();
      }
    })
  );

  // Devuelve solo las sesiones realmente activas
  const activeSessions = await Session.find({ sessionActive: true });

  return NextResponse.json({ activeSessions });
} 