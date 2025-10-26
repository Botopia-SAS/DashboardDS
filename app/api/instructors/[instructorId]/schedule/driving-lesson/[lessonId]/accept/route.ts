import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { broadcastNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ instructorId: string; lessonId: string }> }
) {
  try {
    await connectToDB();
    
    const { instructorId, lessonId } = await params;
    const body = await req.json();
    const { status, paid } = body;


    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Verificar que existe schedule_driving_lesson
    if (!instructor.schedule_driving_lesson || !Array.isArray(instructor.schedule_driving_lesson)) {
      return NextResponse.json(
        { message: "No driving lessons found for this instructor" },
        { status: 404 }
      );
    }

    // Buscar la lesson específica en schedule_driving_lesson
    const lessonIndex = instructor.schedule_driving_lesson.findIndex(
      (lesson: any) => lesson._id.toString() === lessonId
    );

    if (lessonIndex === -1) {
      return NextResponse.json(
        { message: "Driving lesson not found" },
        { status: 404 }
      );
    }

    // Actualizar la lesson
    instructor.schedule_driving_lesson[lessonIndex].status = status;
    instructor.schedule_driving_lesson[lessonIndex].paid = paid;

    await instructor.save();


    // Enviar notificación SSE en tiempo real
    broadcastNotification('driving_lesson_update', {
      action: 'lesson_accepted',
      instructorId: instructorId,
      lessonId: lessonId,
      studentId: instructor.schedule_driving_lesson[lessonIndex].studentId
    });

    return NextResponse.json({ 
      message: "Driving lesson accepted successfully",
      lesson: instructor.schedule_driving_lesson[lessonIndex]
    });

  } catch (error) {
    console.error("Error accepting driving lesson:", error);
    return NextResponse.json(
      { message: "Error accepting driving lesson" },
      { status: 500 }
    );
  }
}
