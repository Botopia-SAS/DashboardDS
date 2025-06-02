import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Settings from "@/lib/models/Settings";

export async function GET() {
  await dbConnect();
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  if (typeof body.sendBirthdayEmails === "boolean") settings.sendBirthdayEmails = body.sendBirthdayEmails;
  if (typeof body.sendClassReminders === "boolean") settings.sendClassReminders = body.sendClassReminders;
  await settings.save();
  return NextResponse.json({ settings });
} 