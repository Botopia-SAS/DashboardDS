import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";

export async function GET() {
  try {
    await connectToDB();
    
    // Obtener todos los instructores que tienen schedule_driving_lesson con status pending
    const instructors = await Instructor.find({
      schedule_driving_lesson: { $exists: true, $not: { $size: 0 } }
    }).lean();

    const pendingRequests = [];

    for (const instructor of instructors) {
      if (instructor.schedule_driving_lesson) {
        for (const event of instructor.schedule_driving_lesson) {
          // Filtrar solo lecciones con status 'pending' y paymentMethod 'local'
          if (event.status === 'pending' && event.studentId && event.paymentMethod === 'local') {
            pendingRequests.push({
              requestId: event._id?.toString() || `${instructor._id}-${event.date}-${event.start}`,
              lessonId: event._id?.toString() || `${instructor._id}-${event.date}-${event.start}`,
              studentId: event.studentId,
              date: event.date,
              hour: event.start,
              endHour: event.end,
              classType: event.classType || 'driving lesson',
              requestDate: new Date().toISOString(),
              status: event.status,
              instructorId: instructor._id,
              paymentMethod: event.paymentMethod
            });
          }
        }
      }
    }


    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending lesson requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending lesson requests' },
      { status: 500 }
    );
  }
}
