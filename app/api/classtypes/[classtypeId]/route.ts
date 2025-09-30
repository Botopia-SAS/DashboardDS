import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import ClassType from "@/lib/models/ClassType";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classtypeId: string }> }
) {
  try {
    await connectToDB();

    const { classtypeId } = await params;
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Class type name is required" },
        { status: 400 }
      );
    }

    const cleanName = name.trim().toLowerCase();

    // Verificar si el classType existe
    const classType = await ClassType.findById(classtypeId);
    if (!classType) {
      return NextResponse.json(
        { error: "Class type not found" },
        { status: 404 }
      );
    }

    // Verificar si el nuevo nombre ya existe (excepto el actual)
    const exists = await ClassType.findOne({
      name: cleanName,
      _id: { $ne: classtypeId }
    });

    if (exists) {
      return NextResponse.json(
        { error: "Class type with this name already exists" },
        { status: 409 }
      );
    }

    // Actualizar el classType
    const updatedClassType = await ClassType.findByIdAndUpdate(
      classtypeId,
      { name: cleanName },
      { new: true }
    );

    return NextResponse.json(updatedClassType);
  } catch (error) {
    console.error("Error updating class type:", error);
    return NextResponse.json(
      { error: "Failed to update class type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ classtypeId: string }> }
) {
  try {
    await connectToDB();

    const { classtypeId } = await params;

    // Buscar el classType por ID
    const classType = await ClassType.findById(classtypeId);

    if (!classType) {
      return NextResponse.json(
        { error: "Class type not found" },
        { status: 404 }
      );
    }

    // No permitir eliminar los tipos básicos
    const defaultTypes = ["date", "bdi", "adi"];
    if (defaultTypes.includes(classType.name.toLowerCase())) {
      return NextResponse.json(
        { error: "Cannot delete default class types" },
        { status: 403 }
      );
    }

    // Eliminar el classType
    await ClassType.findByIdAndDelete(classtypeId);

    return NextResponse.json({ message: "Class type deleted successfully" });
  } catch (error) {
    console.error("Error deleting class type:", error);
    return NextResponse.json(
      { error: "Failed to delete class type" },
      { status: 500 }
    );
  }
}