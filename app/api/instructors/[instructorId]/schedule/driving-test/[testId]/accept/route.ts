import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { broadcastNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ instructorId: string; testId: string }> }
) {
  try {
    await connectToDB();
    
    const { instructorId, testId } = await params;
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

    // Verificar que schedule_driving_test existe
    if (!instructor.schedule_driving_test) {
      return NextResponse.json(
        { message: "No driving tests scheduled for this instructor" },
        { status: 404 }
      );
    }

    // Buscar el test específico en schedule_driving_test
    const testIndex = instructor.schedule_driving_test.findIndex(
      (test: any) => test._id.toString() === testId
    );

    if (testIndex === -1) {
      return NextResponse.json(
        { message: "Driving test not found" },
        { status: 404 }
      );
    }

    // Actualizar el test
    const test = instructor.schedule_driving_test[testIndex] as any;
    const oldStatus = test.status;
    test.status = status;
    test.paid = paid;


    // Marcar que el array ha sido modificado para Mongoose
    instructor.markModified('schedule_driving_test');
    
    await instructor.save();


    // Verificar que realmente se guardó - con un nuevo query
    const updatedInstructor = await Instructor.findById(instructorId).lean() as { schedule_driving_test: any[] } | null;
    const updatedTest = updatedInstructor?.schedule_driving_test.find(
      (testItem: any) => testItem._id.toString() === testId 
    );

    // Enviar notificación SSE en tiempo real
    broadcastNotification('driving_test_update', {
      action: 'test_accepted',
      instructorId: instructorId,
      testId: testId,
      studentId: test.studentId
    });

    return NextResponse.json({ 
      message: "Driving test accepted successfully",
      test: test
    });

  } catch (error) {
    console.error("Error accepting driving test:", error);
    return NextResponse.json(
      { message: "Error accepting driving test" },
      { status: 500 }
    );
  }
}
