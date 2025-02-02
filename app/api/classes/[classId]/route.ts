import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import DrivingClass from "@/lib/models/Class"; // ✅ Importar el modelo correcto

// ✅ GET A SINGLE CLASS
export async function GET(req: Request, { params }: { params: { classId: string } }) {
  try {
    await connectToDB();
    const drivingClass = await DrivingClass.findById(params.classId);
    if (!drivingClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }
    return NextResponse.json(drivingClass, { status: 200 });
  } catch (error) {
    console.error("[GET_CLASS_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch class" }, { status: 500 });
  }
}

// ✅ UPDATE A CLASS
export async function PATCH(req: Request, { params }: { params: { classId: string } }) {
  try {
    await connectToDB();
    const body = await req.json();
    const updatedClass = await DrivingClass.findByIdAndUpdate(params.classId, body, { new: true });

    if (!updatedClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(updatedClass, { status: 200 });
  } catch (error) {
    console.error("[PATCH_CLASS_ERROR]", error);
    return NextResponse.json({ message: "Failed to update class" }, { status: 500 });
  }
}
