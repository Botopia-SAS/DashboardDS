import { NextRequest, NextResponse } from "next/server";
import Phone from "@/lib/models/Phone";
import dbConnect from "@/lib/dbConnect";

export async function GET() {
  try {
    await dbConnect();
    
    const phones = await Phone.find({});
    
    return NextResponse.json({
      success: true,
      phones: phones.map(phone => ({
        _id: phone._id,
        key: phone.key,
        phoneNumber: phone.phoneNumber,
        createdAt: phone.createdAt,
        updatedAt: phone.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching phones:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch phones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();

    if (!data.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const phone = await Phone.create({
      key: data.key || "main",
      phoneNumber: data.phoneNumber
    });

    return NextResponse.json({
      success: true,
      phone: {
        _id: phone._id,
        key: phone.key,
        phoneNumber: phone.phoneNumber,
        createdAt: phone.createdAt,
        updatedAt: phone.updatedAt
      }
    });
  } catch (error) {
    console.error("Error creating phone:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create phone" },
      { status: 500 }
    );
  }
}
