import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/modals/user.modal";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    
    let query = {};
    if (ids) {
      const idArray = ids.split(',').filter(id => id.trim());
      query = { _id: { $in: idArray } };
    }
    
    const users = await User.find(query, 'firstName lastName email _id').sort({ firstName: 1 });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}
