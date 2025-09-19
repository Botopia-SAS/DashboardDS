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
    const { status, studentId, studentName, paymentMethod } = body;

    console.log('🎯 Rejecting driving test:', { instructorId, testId, status, studentId, studentName, paymentMethod });

    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
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

    // Actualizar el test - limpiar datos del estudiante y cambiar status
    instructor.schedule_driving_test[testIndex].status = status;
    instructor.schedule_driving_test[testIndex].studentId = studentId;
    instructor.schedule_driving_test[testIndex].studentName = studentName;
    
    // Eliminar paymentMethod si es null
    if (paymentMethod === null) {
      delete instructor.schedule_driving_test[testIndex].paymentMethod;
    } else {
      instructor.schedule_driving_test[testIndex].paymentMethod = paymentMethod;
    }

    await instructor.save();

    console.log('✅ Driving test rejected successfully');

    // Enviar notificación SSE en tiempo real
    broadcastNotification('driving_test_update', {
      action: 'test_rejected',
      instructorId: instructorId,
      testId: testId
    });

    return NextResponse.json({ 
      message: "Driving test rejected successfully",
      test: instructor.schedule_driving_test[testIndex]
    });

  } catch (error) {
    console.error("Error rejecting driving test:", error);
    return NextResponse.json(
      { message: "Error rejecting driving test" },
      { status: 500 }
    );
  }
}
