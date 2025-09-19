import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { broadcastNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Define proper types for driving test
interface DrivingTest {
  _id: string;
  paymentMethod: string;
  reservedAt: string;
  date: string;
  start: string;
  end: string;
  status: string;
  classType: string;
  amount: number;
  studentId: string;
  studentName: string;
  paid: boolean;
}

interface InstructorDocument {
  _id: string;
  schedule_driving_test: DrivingTest[];
  markModified: (path: string) => void;
  save: () => Promise<InstructorDocument>;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ instructorId: string; testId: string }> }
) {
  try {
    await connectToDB();
    
    const { instructorId, testId } = await params;
    const body = await req.json();
    const { status, paid } = body;

    console.log('🎯 Accepting driving test:', { instructorId, testId, status, paid });

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
      (test: DrivingTest) => test._id.toString() === testId
    );

    if (testIndex === -1) {
      return NextResponse.json(
        { message: "Driving test not found" },
        { status: 404 }
      );
    }

    // Actualizar el test
    const oldStatus = instructor.schedule_driving_test[testIndex].status;
    instructor.schedule_driving_test[testIndex].status = status;
    instructor.schedule_driving_test[testIndex].paid = paid;

    console.log(`📝 Updating test status: ${oldStatus} → ${status}`);
    console.log(`💾 Test data before save:`, {
      id: instructor.schedule_driving_test[testIndex]._id,
      status: instructor.schedule_driving_test[testIndex].status,
      paid: instructor.schedule_driving_test[testIndex].paid,
      studentName: instructor.schedule_driving_test[testIndex].studentName
    });

    // Marcar que el array ha sido modificado para Mongoose
    instructor.markModified('schedule_driving_test');
    
    await instructor.save();

    console.log('✅ Driving test accepted successfully');
    console.log(`🔍 Final test status: ${instructor.schedule_driving_test[testIndex].status}`);

    // Verificar que realmente se guardó - con un nuevo query
    const updatedInstructor = await Instructor.findById(instructorId).lean() as { schedule_driving_test: DrivingTest[] } | null;
    const updatedTest = updatedInstructor?.schedule_driving_test.find(
      (test: DrivingTest) => test._id.toString() === testId 
    );
    console.log('🔍 Verification - Test status in DB:', updatedTest?.status);
    console.log('🔍 Full test from DB:', updatedTest);

    // Enviar notificación SSE en tiempo real
    broadcastNotification('driving_test_update', {
      action: 'test_accepted',
      instructorId: instructorId,
      testId: testId,
      studentId: instructor.schedule_driving_test[testIndex].studentId
    });

    return NextResponse.json({ 
      message: "Driving test accepted successfully",
      test: instructor.schedule_driving_test[testIndex]
    });

  } catch (error) {
    console.error("Error accepting driving test:", error);
    return NextResponse.json(
      { message: "Error accepting driving test" },
      { status: 500 }
    );
  }
}
