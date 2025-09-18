import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ instructorId: string; lessonId: string }> }
) {
  try {
    await connectToDB();
    
    const { instructorId, lessonId } = await params;
    const body = await req.json();
    const { status, studentId, studentName, paymentMethod } = body;

    console.log('🎯 Rejecting driving lesson:', { instructorId, lessonId, status, studentId, studentName, paymentMethod });

    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
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

    // Actualizar la lesson - limpiar datos del estudiante y cambiar status
    instructor.schedule_driving_lesson[lessonIndex].status = status;
    instructor.schedule_driving_lesson[lessonIndex].studentId = studentId;
    instructor.schedule_driving_lesson[lessonIndex].studentName = studentName;
    
    // Eliminar paymentMethod si es null
    if (paymentMethod === null) {
      delete instructor.schedule_driving_lesson[lessonIndex].paymentMethod;
    } else {
      instructor.schedule_driving_lesson[lessonIndex].paymentMethod = paymentMethod;
    }

    await instructor.save();

    console.log('✅ Driving lesson rejected successfully');

    // Emit SSE notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'driving_lesson_update',
          data: { 
            action: 'lesson_rejected',
            instructorId: instructorId,
            lessonId: lessonId
          }
        })
      });
    } catch (error) {
      console.log('SSE notification failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    return NextResponse.json({ 
      message: "Driving lesson rejected successfully",
      lesson: instructor.schedule_driving_lesson[lessonIndex]
    });

  } catch (error) {
    console.error("Error rejecting driving lesson:", error);
    return NextResponse.json(
      { message: "Error rejecting driving lesson" },
      { status: 500 }
    );
  }
}
