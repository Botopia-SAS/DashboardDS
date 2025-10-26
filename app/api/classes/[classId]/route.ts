import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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


    // Validate classId
    if (!classId || classId === 'undefined') {
      console.error("❌ [PUT_CLASS] Invalid classId:", classId);
      return NextResponse.json(
        { success: false, message: "Invalid class ID provided" },
        { status: 400 }
      );
    }

    // Validate required fields from body
    const requiredFields = ['title', 'length', 'price', 'overview', 'buttonLabel'];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        console.error(`❌ [PUT_CLASS] Missing required field: ${field}`);
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if class exists first
    const existingClass = await DrivingClass.findById(classId);
    if (!existingClass) {
      console.error("❌ [PUT_CLASS] Class not found:", classId);
      return NextResponse.json(
        { success: false, message: "Driving class not found" },
        { status: 404 }
      );
    }


    // Remove _id from body if it exists to avoid conflicts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...updateData } = body;

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();


    // Asegurar que classType se preserve exactamente como viene
    if (updateData.classType) {

    }

    let updatedClass;
    try {

      updatedClass = await DrivingClass.findByIdAndUpdate(
        classId,
        updateData,
        {
          new: true,
          runValidators: true,
          upsert: false // Don't create if not exists
        }
      );

    } catch (dbError) {
      console.error("❌ [PUT_CLASS] Database update failed:", dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }

    if (!updatedClass) {
      console.error("❌ [PUT_CLASS] Failed to update class");
      return NextResponse.json(
        { success: false, message: "Failed to update driving class" },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      data: updatedClass,
      message: "Class updated successfully"
    });
  } catch (error) {
    console.error("❌ [PUT_CLASS] Error updating driving class:", error);

    // Provide more specific error messages
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: "Validation error", errors: validationErrors },
        { status: 400 }
      );
    }

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { success: false, message: "Invalid class ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();

    const { classId } = await params;


    // Validate classId
    if (!classId || classId === 'undefined') {
      console.error("❌ [DELETE_CLASS] Invalid classId:", classId);
      return NextResponse.json(
        { success: false, message: "Invalid class ID provided" },
        { status: 400 }
      );
    }

    // Check if class exists first
    const existingClass = await DrivingClass.findById(classId);
    if (!existingClass) {
      console.error("❌ [DELETE_CLASS] Class not found:", classId);
      return NextResponse.json(
        { success: false, message: "Driving class not found" },
        { status: 404 }
      );
    }


    // Delete the class
    await DrivingClass.findByIdAndDelete(classId);


    return NextResponse.json({
      success: true,
      message: "Class deleted successfully"
    });
  } catch (error) {
    console.error("❌ [DELETE_CLASS] Error deleting driving class:", error);

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { success: false, message: "Invalid class ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}