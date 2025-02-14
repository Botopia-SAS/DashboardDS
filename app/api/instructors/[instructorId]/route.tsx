import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ✅ Nuevo método GET para obtener un instructor por ID
export async function GET(req: NextRequest, { params }: { params: { instructorId: string } }) {
  try {
    await connectToDB();
    const { instructorId } = params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    console.log("✅ Instructor encontrado:", instructor);
    console.log("📅 Horarios obtenidos:", instructor.schedule);

    return NextResponse.json(instructor, { status: 200 });
  } catch (err) {
    console.error("[GET Instructor] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// ✅ DELETE: Eliminar un instructor por ID
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    const { instructorId } = await req.json();

    if (!instructorId || typeof instructorId !== "string") {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    console.log("🗑️ Eliminando instructor con ID:", instructorId);

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);

    if (!deletedInstructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Instructor deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting instructor:", error);
    return NextResponse.json({ error: "Error deleting instructor" }, { status: 500 });
  }
}

// ✅ PATCH: Actualizar un instructor por ID
export async function PATCH(req: Request) {
  try {
      await connectToDB();
      const { instructorId, ...updates } = await req.json();

      console.log("📥 Datos recibidos en el PATCH:", { instructorId, updates });

      if (!instructorId) {
          return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
      }

      const updatedInstructor = await Instructor.findByIdAndUpdate(
          instructorId,
          { $set: updates },
          { new: true }
      );

      if (!updatedInstructor) {
          return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
      }

      console.log("✅ Instructor actualizado en la BD:", updatedInstructor);

      return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (error) {
      console.error("❌ Error al actualizar instructor:", error);
      return NextResponse.json({ message: "Error updating instructor" }, { status: 500 });
  }
}

