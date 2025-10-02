import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DrivingClass from "@/lib/models/Class";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();
    
    const { classId } = await params;
    const drivingClass = await DrivingClass.findById(classId);
    
    if (!drivingClass) {
      return NextResponse.json(
        { success: false, message: "Driving class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: drivingClass
    });
  } catch (error) {
    console.error("Error fetching driving class:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();
    
    const { classId } = await params;
    const body = await request.json();
    
    // Remove _id from body if it exists to avoid conflicts
    const { _id, ...updateData } = body;
    
    const updatedClass = await DrivingClass.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      return NextResponse.json(
        { success: false, message: "Driving class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClass,
      message: "Class updated successfully"
    });
  } catch (error) {
    console.error("Error updating driving class:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}