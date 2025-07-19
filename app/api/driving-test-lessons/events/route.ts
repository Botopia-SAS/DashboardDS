import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    //console.log("[EVENTS] Starting to fetch calendar events");
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const instructorId = searchParams.get("instructorId");

    //console.log("[EVENTS] Fetching instructors with schedules");
    
    // Build query to filter by instructor if instructorId is provided
    const query = instructorId ? { _id: instructorId } : {};
    
    // Fetch instructors with their schedules
    const instructors = await Instructor.find(query).populate("schedule_driving_test schedule_driving_lesson");
    //console.log(`[EVENTS] Found ${instructors.length} instructors`);

    const events: any[] = [];

    instructors.forEach((instructor) => {
      try {
      // Process driving test schedule
        if (instructor.schedule_driving_test && Array.isArray(instructor.schedule_driving_test)) {
        instructor.schedule_driving_test.forEach((slot: any) => {
            if (slot && slot.date && slot.start && slot.end) {
            events.push({
                id: slot._id || `test_${Date.now()}_${Math.random()}`,
              title: `${instructor.name} - Driving Test`,
              start: `${slot.date}T${slot.start}:00`,
              end: `${slot.date}T${slot.end}:00`,
              instructorId: instructor._id,
              instructorName: instructor.name,
              classType: 'driving test',
                status: slot.status || 'available',
              amount: slot.amount,
              backgroundColor: getStatusColor(slot.status),
              borderColor: getStatusColor(slot.status),
              extendedProps: {
                instructorId: instructor._id,
                instructorName: instructor.name,
                classType: 'driving test',
                  status: slot.status || 'available',
                amount: slot.amount,
                scheduleType: 'driving_test'
              }
            });
          }
        });
      }

      // Process driving lesson schedule
        if (instructor.schedule_driving_lesson && Array.isArray(instructor.schedule_driving_lesson)) {
        instructor.schedule_driving_lesson.forEach((slot: any) => {
            if (slot && slot.date && slot.start && slot.end) {
            events.push({
                id: slot._id || `lesson_${Date.now()}_${Math.random()}`,
              title: `${instructor.name} - ${slot.classType || 'Driving Lesson'}`,
              start: `${slot.date}T${slot.start}:00`,
              end: `${slot.date}T${slot.end}:00`,
              instructorId: instructor._id,
              instructorName: instructor.name,
              classType: slot.classType || 'driving lesson',
                status: slot.status || 'available',
              amount: slot.amount,
              backgroundColor: getStatusColor(slot.status),
              borderColor: getStatusColor(slot.status),
              extendedProps: {
                instructorId: instructor._id,
                instructorName: instructor.name,
                classType: slot.classType || 'driving lesson',
                  status: slot.status || 'available',
                amount: slot.amount,
                scheduleType: 'driving_lesson'
              }
            });
          }
        });
        }
      } catch (instructorError) {
        console.error(`[EVENTS] Error processing instructor ${instructor._id}:`, instructorError);
      }
    });

    //console.log(`[EVENTS] Generated ${events.length} events`);
    return NextResponse.json(events, { status: 200 });

  } catch (error) {
    console.error("[EVENTS] Error fetching calendar events:", error);
    return NextResponse.json(
      { message: "Error fetching calendar events", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'available':
      return '#10b981'; // green
    case 'cancelled':
      return '#ef4444'; // red
    case 'expired':
      return '#6b7280'; // gray
    case 'pending':
      return '#f59e0b'; // yellow
    default:
      return '#3b82f6'; // blue
  }
} 