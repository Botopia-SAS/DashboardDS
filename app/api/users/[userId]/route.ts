import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import User from "@/lib/models/User";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await connectToDB();
    
    const { userId } = await params;
    
    const user = await User.findById(userId).select('firstName middleName lastName email phoneNumber');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching user" },
      { status: 500 }
    );
  }
}