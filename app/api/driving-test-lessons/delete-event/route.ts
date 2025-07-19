import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();
    
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Buscar el instructor que tiene este evento
    const instructor = await Instructor.findOne({
      $or: [
        { "schedule_driving_test._id": eventId },
        { "schedule_driving_lesson._id": eventId }
      ]
    });

    // Si no se encuentra el instructor o el evento, simplemente retornar éxito
    if (!instructor) {
      return NextResponse.json(
        { message: "Event deleted successfully" },
        { status: 200 }
      );
    }

    // Eliminar el evento de ambas colecciones para asegurar limpieza
    const testResult = await Instructor.updateOne(
      { _id: instructor._id },
      { $pull: { schedule_driving_test: { _id: eventId } } }
    );

    const lessonResult = await Instructor.updateOne(
      { _id: instructor._id },
      { $pull: { schedule_driving_lesson: { _id: eventId } } }
    );

    // Si no se eliminó nada, no importa - el evento ya no existe
    // Simplemente retornar éxito



    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { message: "Error deleting event", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 