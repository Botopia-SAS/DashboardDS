import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/modals/user.modal";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const search = searchParams.get('search');

    let query: any = {};

    if (ids) {
      const idArray = ids.split(',').filter(id => id.trim());
      query = { _id: { $in: idArray } };
    } else if (search) {
      // Search by name or email
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(
      query,
      'firstName middleName lastName email licenseNumber birthDate _id'
    )
    .sort({ firstName: 1 })
    .limit(50);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}
