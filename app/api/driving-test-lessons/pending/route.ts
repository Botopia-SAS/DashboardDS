import { NextResponse } from "next/server";
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
          // Type guard to ensure event has the expected properties
          if (event && typeof event === 'object' && 
              'status' in event && 'studentId' in event &&
              event.status === 'pending' && event.studentId) {
            const eventObj = event as any; // Type assertion for Mixed type
            pendingRequests.push({
              requestId: eventObj._id?.toString() || `${instructor._id}-${eventObj.date}-${eventObj.start}`,
              drivingTestId: eventObj._id?.toString() || `${instructor._id}-${eventObj.date}-${eventObj.start}`,
              studentId: eventObj.studentId,
              date: eventObj.date,
              hour: eventObj.start,
              endHour: eventObj.end,
              classType: eventObj.classType || 'driving test',
              requestDate: eventObj.createdAt || new Date().toISOString(),
              status: eventObj.status,
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
