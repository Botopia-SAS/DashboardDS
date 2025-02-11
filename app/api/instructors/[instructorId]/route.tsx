import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ✅ GET: Obtener un instructor por ID
export async function GET(req: NextRequest, context: { params: { instructorId: string } }) {
  try {
    await connectToDB();

    const instructorId = context.params.instructorId;

    if (!instructorId) {
      return new NextResponse("Instructor ID is required", { status: 400 });
    }

    // ✅ Verificar si el ID es válido antes de buscar en MongoDB
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return new NextResponse("Invalid Instructor ID", { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) return new NextResponse("Instructor not found", { status: 404 });

    return NextResponse.json(instructor);
  } catch (err) {
    console.error("[GET Instructor] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ✅ DELETE: Eliminar un instructor por ID
export async function DELETE(req: NextRequest, context: { params: { instructorId: string } }) {
  try {
    await connectToDB();

    const instructorId = context.params.instructorId;

    console.log("🗑️ Eliminando instructor con ID:", instructorId);

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return new NextResponse("Invalid Instructor ID", { status: 400 });
    }

    const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);

    if (!deletedInstructor) {
      return new NextResponse("Instructor not found", { status: 404 });
    }

    return NextResponse.json({ message: "Instructor deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting instructor:", error);
    return new NextResponse("Error deleting instructor", { status: 500 });
  }
}

// ✅ PATCH: Actualizar un instructor por ID
export async function PATCH(req: NextRequest, context: { params: { instructorId: string } }) {
  try {
    await connectToDB();

    const instructorId = context.params.instructorId;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return new NextResponse("Invalid Instructor ID", { status: 400 });
    }

    const updates = await req.json();

    if (updates.schedule && !Array.isArray(updates.schedule)) {
      return new NextResponse("Schedule must be an array", { status: 400 });
    }

    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      { $set: updates },
      { new: true }
    );

    if (!updatedInstructor) {
      return new NextResponse("Instructor not found", { status: 404 });
    }

    return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (err) {
    console.log("[PATCH Instructor] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
