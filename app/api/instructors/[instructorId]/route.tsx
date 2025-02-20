import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ✅ Método GET para obtener un instructor por ID
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json(instructor, { status: 200 });
  } catch (err) {
    console.error("[GET Instructor] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ Método POST para obtener un instructor por ID (redundante si usas GET)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    
    const { instructorId } = await req.json();

    if (!instructorId) {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    console.log("✅ Instructor encontrado:", instructor);

    return NextResponse.json(instructor, { status: 200 });
  } catch (err) {
    console.error("[POST Instructor] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar un instructor por ID (Extrae `instructorId` desde la URL)
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `instructorId` de la URL en lugar del body
    const instructorId = req.nextUrl.pathname.split("/").pop();

    if (!instructorId) {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    console.log("🗑️ Eliminando instructor con ID:", instructorId);
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
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const { instructorId, ...updates } = await req.json();

    console.log("📥 Datos recibidos en el PATCH:", { instructorId, updates });

    if (!instructorId) {
      return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 });
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
