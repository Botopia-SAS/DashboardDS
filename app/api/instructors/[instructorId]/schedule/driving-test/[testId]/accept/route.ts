import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

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
      (test: any) => test._id.toString() === testId
    );

    if (testIndex === -1) {
      return NextResponse.json(
        { message: "Driving test not found" },
        { status: 404 }
      );
    }

    // Actualizar el test
    instructor.schedule_driving_test[testIndex].status = status;
    instructor.schedule_driving_test[testIndex].paid = paid;

    await instructor.save();

    console.log('✅ Driving test accepted successfully');

    // Emit SSE notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'driving_test_update',
          data: { 
            action: 'test_accepted',
            instructorId: instructorId,
            testId: testId,
            studentId: instructor.schedule_driving_test[testIndex].studentId
          }
        })
      });
    } catch (error) {
      console.log('SSE notification failed:', error instanceof Error ? error.message : 'Unknown error');
    }

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
