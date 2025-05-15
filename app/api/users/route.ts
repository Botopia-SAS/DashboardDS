import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import User from "@/lib/modals/user.modal";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const users = await User.find({ role: "user" });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
