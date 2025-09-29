import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import ClassType from "@/lib/models/ClassType";

export async function GET() {
  try {
    await connectToDB();

    // Obtener todos los classTypes de la base de datos
    const classTypes = await ClassType.find({}).sort({ createdAt: 1 });

    // Si no hay ninguno, crear los por defecto
    if (classTypes.length === 0) {
      const defaultTypes = [
        { name: "date" },
        { name: "bdi" },
        { name: "adi" }
      ];

      await ClassType.insertMany(defaultTypes);
      const newClassTypes = await ClassType.find({}).sort({ createdAt: 1 });
      return NextResponse.json(newClassTypes);
    }

    return NextResponse.json(classTypes);
  } catch (error) {
    console.error("Error fetching class types:", error);
    return NextResponse.json(
      { error: "Failed to fetch class types" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Class type name is required" },
        { status: 400 }
      );
    }

    const cleanName = name.trim().toLowerCase();

    // Verificar si ya existe
    const exists = await ClassType.findOne({ name: cleanName });
    if (exists) {
      return NextResponse.json(
        { error: "Class type already exists" },
        { status: 409 }
      );
    }

    // Crear nuevo classType
    const newClassType = await ClassType.create({
      name: cleanName
    });

    return NextResponse.json(newClassType, { status: 201 });
  } catch (error) {
    console.error("Error creating class type:", error);
    return NextResponse.json(
      { error: "Failed to create class type" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // No permitir eliminar los tipos básicos
    const defaultTypes = ["date", "bdi", "adi"];
    if (defaultTypes.includes(name.toLowerCase())) {
      return NextResponse.json(
        { error: "Cannot delete default class types" },
        { status: 403 }
      );
    }

    const deletedClassType = await ClassType.findOneAndDelete({ name: name.toLowerCase() });

    if (!deletedClassType) {
      return NextResponse.json(
        { error: "Class type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Class type deleted successfully" });
  } catch (error) {
    console.error("Error deleting class type:", error);
    return NextResponse.json(
      { error: "Failed to delete class type" },
      { status: 500 }
    );
  }
}