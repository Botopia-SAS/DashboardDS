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

    console.log("🔄 [PUT_CLASS] Updating class ID:", classId);
    console.log("🔄 [PUT_CLASS] Request body:", JSON.stringify(body, null, 2));

    // Validate classId
    if (!classId || classId === 'undefined') {
      console.error("❌ [PUT_CLASS] Invalid classId:", classId);
      return NextResponse.json(
        { success: false, message: "Invalid class ID provided" },
        { status: 400 }
      );
    }

    // Validate required fields from body
    const requiredFields = ['title', 'length', 'price', 'overview', 'contact', 'buttonLabel'];
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

    console.log("✅ [PUT_CLASS] Existing class found:", existingClass.title);

    // Remove _id from body if it exists to avoid conflicts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...updateData } = body;

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    console.log("🔄 [PUT_CLASS] Update data:", JSON.stringify(updateData, null, 2));
    console.log("🔄 [PUT_CLASS] ClassType being saved:", updateData.classType);
    console.log("🔄 [PUT_CLASS] ClassType type:", typeof updateData.classType);
    console.log("🔄 [PUT_CLASS] Length being saved:", updateData.length);
    console.log("🔄 [PUT_CLASS] Price being saved:", updateData.price);

    // Asegurar que classType se preserve exactamente como viene
    if (updateData.classType) {
      console.log("🔄 [PUT_CLASS] Preserving classType as:", updateData.classType);
    }

    let updatedClass;
    try {
      console.log("🔄 [PUT_CLASS] Attempting database update...");
      updatedClass = await DrivingClass.findByIdAndUpdate(
        classId,
        updateData,
        {
          new: true,
          runValidators: true,
          upsert: false // Don't create if not exists
        }
      );
      console.log("✅ [PUT_CLASS] Database update successful");
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

    console.log("✅ [PUT_CLASS] Class updated successfully:", updatedClass.title);
    console.log("✅ [PUT_CLASS] Updated ClassType:", updatedClass.classType);
    console.log("✅ [PUT_CLASS] Updated Length:", updatedClass.length);
    console.log("✅ [PUT_CLASS] Updated Price:", updatedClass.price);
    console.log("✅ [PUT_CLASS] Updated At:", updatedClass.updatedAt);

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

    console.log("🗑️ [DELETE_CLASS] Deleting class ID:", classId);

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

    console.log("✅ [DELETE_CLASS] Deleting class:", existingClass.title);

    // Delete the class
    await DrivingClass.findByIdAndDelete(classId);

    console.log("✅ [DELETE_CLASS] Class deleted successfully");

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