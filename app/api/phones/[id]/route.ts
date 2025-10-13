import { NextRequest, NextResponse } from "next/server";
import Phone from "@/lib/models/Phone";
import dbConnect from "@/lib/dbConnect";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const phone = await Phone.findById(id);
    
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone not found" },
        { status: 404 }
      );
    }

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
    console.error("Error fetching phone:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch phone" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const data = await req.json();

    if (!data.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const phone = await Phone.findByIdAndUpdate(
      id,
      { 
        phoneNumber: data.phoneNumber,
        key: data.key || "main"
      },
      { new: true }
    );

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone not found" },
        { status: 404 }
      );
    }

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
    console.error("Error updating phone:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update phone" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const phone = await Phone.findByIdAndDelete(id);
    
    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Phone deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting phone:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete phone" },
      { status: 500 }
    );
  }
}
