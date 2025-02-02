import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import DrivingClass from "@/lib/models/Class"; // ✅ Importar el modelo correcto

// ✅ GET ALL CLASSES
export async function GET() {
  try {
    await connectToDB();
    const classes = await DrivingClass.find({});
    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("[GET_CLASSES_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch classes" }, { status: 500 });
  }
}

// ✅ CREATE A NEW CLASS
export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();
    const newClass = new DrivingClass({
      ...body,
      objectives: body.objectives || [], // ✅ Asegurar que siempre se envía un array vacío si no hay datos
    });
    await newClass.save();
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("[POST_CLASS_ERROR]", error);
    return NextResponse.json({ message: "Failed to create class" }, { status: 500 });
  }
}
