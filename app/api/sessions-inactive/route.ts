import { connectToDB } from "@/lib/mongoDB";
import Session from "@/lib/modals/Session";
import { NextResponse } from "next/server";

export async function GET() {
  await connectToDB();
  const inactiveSessions = await Session.find({ sessionActive: false })
    .sort({ lastActive: -1 })
    .limit(20);
  return NextResponse.json({ inactiveSessions });
} 