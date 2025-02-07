import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, context: { params: Promise<{ instructorId: string }> }) => {
  try {
    await connectToDB();

    // ✅ Esperar a que `params` se resuelva antes de acceder a `instructorId`
    const resolvedParams = await context.params;
    const instructorId = resolvedParams?.instructorId;

    if (!instructorId) return new NextResponse("Instructor ID is required", { status: 400 });

    // ✅ Verificar si el ID es válido antes de buscar en MongoDB
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return new NextResponse("Invalid Instructor ID", { status: 400 });
    }

    const instructor = await Instructor.findById(new mongoose.Types.ObjectId(instructorId));
    if (!instructor) return new NextResponse("Instructor not found", { status: 404 });

    return NextResponse.json(instructor);
  } catch (err) {
    console.error("[instructor_GET] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: { instructorId: string } }) => {
  try {
    await connectToDB();
    
    const result = await Instructor.deleteOne({ _id: new ObjectId(params.instructorId) });

    if (!result.deletedCount) {
      return new NextResponse("Instructor not found", { status: 404 });
    }

    return new NextResponse("Instructor deleted successfully", { status: 200 });
  } catch (err) {
    console.log("[INSTRUCTOR_DELETE]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const PATCH = async (req: NextRequest, { params }: { params: { instructorId: string } }) => {
  try {
    await connectToDB();
    
    const updates = await req.json();
    
    if (updates.schedule && !Array.isArray(updates.schedule)) {
      return new NextResponse("Schedule must be an array", { status: 400 });
    }

    const updatedInstructor = await Instructor.updateOne(
      { _id: new ObjectId(params.instructorId) },
      { $set: updates }
    );

    return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (err) {
    console.log("[INSTRUCTOR_PATCH]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
