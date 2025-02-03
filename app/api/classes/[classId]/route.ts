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
      return NextResponse.json({ message: "Missing classId" }, { status: 400 });
    }

    const body = await req.json();
    const updatedClass = await DrivingClass.findByIdAndUpdate(classId, body, { new: true });

    if (!updatedClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(updatedClass, { status: 200 });
  } catch (error) {
    console.error("[PATCH_CLASS_ERROR]", error);
    return NextResponse.json({ message: "Failed to update class" }, { status: 500 });
  }
}

// ✅ DELETE A CLASS
export async function DELETE(req: NextRequest, context: { params: { classId: string } }) {
  try {
    await connectToDB();

    const { classId } = await context.params; // ⚠️ DEBES usar `await` al extraer params

    if (!classId) {
      return NextResponse.json({ message: "Class ID is required" }, { status: 400 });
    }

    console.log("📌 Intentando eliminar la clase con ID:", classId);

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


