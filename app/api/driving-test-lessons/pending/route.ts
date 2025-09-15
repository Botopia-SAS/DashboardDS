import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";

export async function GET() {
  try {
    await connectToDB();
    
    // Obtener todos los instructores que tienen schedule_driving_test con status pending
    const instructors = await Instructor.find({
      schedule_driving_test: { $exists: true, $not: { $size: 0 } }
    }).lean();

    const pendingRequests = [];

    for (const instructor of instructors) {
      if (instructor.schedule_driving_test) {
        for (const event of instructor.schedule_driving_test) {
          if (event.status === 'pending' && event.studentId) {
            pendingRequests.push({
              requestId: event._id?.toString() || `${instructor._id}-${event.date}-${event.start}`,
              drivingTestId: event._id?.toString() || `${instructor._id}-${event.date}-${event.start}`,
              studentId: event.studentId,
              date: event.date,
              hour: event.start,
              endHour: event.end,
              classType: event.classType || 'driving test',
              requestDate: event.createdAt || new Date().toISOString(),
              status: event.status,
              instructorId: instructor._id
            });
          }
        }
      }
    }

    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending driving test requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending driving test requests' },
      { status: 500 }
    );
  }
}
