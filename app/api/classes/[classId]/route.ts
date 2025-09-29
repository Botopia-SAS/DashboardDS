import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import DrivingClass from "@/lib/models/Class"; // ✅ Asegura que el modelo es el correcto

// ✅ GET CLASS BY ID
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `classId` desde la URL
    const url = new URL(req.url);
    const classId = url.pathname.split("/").pop(); // 🚀 Extrae el último segmento

    if (!classId) {
      return NextResponse.json({ message: "Missing classId" }, { status: 400 });
    }

    const drivingClass = await DrivingClass.findById(classId);
    if (!drivingClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(drivingClass, { status: 200 });
  } catch (error) {
    console.error("[GET_CLASS_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch class" }, { status: 500 });
  }
}

// ✅ UPDATE A CLASS BY ID
export async function PATCH(req: NextRequest, context: { params: Promise<{ classId: string }> }) {
  try {
    await connectToDB();

    const { classId } = await context.params; // ✅ Usar `await` en `params`

    if (!classId) {
      console.error("[PATCH_CLASS_ERROR] Missing classId");
      return NextResponse.json({ message: "Missing classId" }, { status: 400 });
    }

    const body = await req.json();
    console.log("[PATCH_CLASS_DEBUG] classId:", classId);
    console.log("[PATCH_CLASS_DEBUG] Request body:", body);

    const updatedClass = await DrivingClass.findByIdAndUpdate(classId, body, { new: true });

    if (!updatedClass) {
      console.error("[PATCH_CLASS_ERROR] Class not found for ID:", classId);
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    console.log("[PATCH_CLASS_SUCCESS] Updated class:", updatedClass);
    return NextResponse.json(updatedClass, { status: 200 });
  } catch (error) {
    console.error("[PATCH_CLASS_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Failed to update class", error: errorMessage }, { status: 500 });
  }
}

// ✅ DELETE CLASS BY ID
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `classId` desde la URL
    const url = new URL(req.url);
    const classId = url.pathname.split("/").pop(); // 🚀 Extrae el último segmento

    if (!classId) {
      return NextResponse.json({ message: "Missing classId" }, { status: 400 });
    }

    const deletedClass = await DrivingClass.findByIdAndDelete(classId);
    if (!deletedClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Class deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_CLASS_ERROR]", error);
    return NextResponse.json({ message: "Failed to delete class" }, { status: 500 });
  }
}

