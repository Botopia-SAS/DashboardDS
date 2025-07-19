import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/modals/user.modal";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const users = await User.find({}, 'firstName lastName email _id').sort({ firstName: 1 });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}
