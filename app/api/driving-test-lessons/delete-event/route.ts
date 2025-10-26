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

    // Si no se encuentra el instructor o el evento, intentar buscar por el ID generado
    if (!instructor) {

      // Buscar por el patrón del ID generado
      const allInstructors = await Instructor.find({});
      let foundInstructor = null;
      let foundEvent = null;
      let foundArray = null;

      for (const inst of allInstructors) {
        // Buscar en schedule_driving_test
        if (inst.schedule_driving_test) {
          const testEvent = inst.schedule_driving_test.find((event: any) => {
            const generatedId = `driving_test_${inst._id}_${event.date}_${event.start}_${inst.schedule_driving_test!.indexOf(event)}`;
            return generatedId === eventId || event._id === eventId;
          });
          if (testEvent) {
            foundInstructor = inst;
            foundEvent = testEvent;
            foundArray = 'schedule_driving_test';
            break;
          }
        }

        // Buscar en schedule_driving_lesson
        if (inst.schedule_driving_lesson) {
          const lessonEvent = inst.schedule_driving_lesson.find((event: any) => {
            const generatedId = `driving_lesson_${inst._id}_${event.date}_${event.start}_${inst.schedule_driving_lesson!.indexOf(event)}`;
            return generatedId === eventId || event._id === eventId;
          });
          if (lessonEvent) {
            foundInstructor = inst;
            foundEvent = lessonEvent;
            foundArray = 'schedule_driving_lesson';
            break;
          }
        }
      }

      if (foundInstructor && foundEvent) {

        // Eliminar el evento específico del array
        const result = await Instructor.updateOne(
          { _id: foundInstructor._id },
          { $pull: { [foundArray as string]: foundEvent } }
        );


        return NextResponse.json(
          { message: "Event deleted successfully" },
          { status: 200 }
        );
      }
    }

    // Si se encontró el instructor con el método original
    if (instructor) {
      // Eliminar el evento de ambas colecciones para asegurar limpieza
      const testResult = await Instructor.updateOne(
        { _id: instructor._id },
        { $pull: { schedule_driving_test: { _id: eventId } } }
      );

      const lessonResult = await Instructor.updateOne(
        { _id: instructor._id },
        { $pull: { schedule_driving_lesson: { _id: eventId } } }
      );


    }

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