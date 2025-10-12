import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    //console.log("[EVENTS] Starting to fetch calendar events");
    await connectToDB();
    const { searchParams } = new URL(req.url);
    // const start = searchParams.get("start");
    // const end = searchParams.get("end");
    const instructorId = searchParams.get("instructorId");

    //console.log("[EVENTS] Fetching instructors");
    
    // Build query to filter by instructor if instructorId is provided
    const query = instructorId ? { _id: instructorId } : {};
    
    // Fetch instructors (sin populate ya que no tenemos schedules en el modelo simplificado)
    const instructors = await Instructor.find(query);
    //console.log(`[EVENTS] Found ${instructors.length} instructors`);

    const events: any[] = [];

    // Procesar los eventos reales de los schedules del instructor
    instructors.forEach((instructor) => {
      try {
        // Procesar schedule_driving_test
        if (instructor.schedule_driving_test && Array.isArray(instructor.schedule_driving_test)) {
          instructor.schedule_driving_test.forEach((slot: any, index: number) => {
            if (slot && slot.date && slot.start && slot.end) {
              // Generar ID único si no existe
              const eventId = slot._id || `driving_test_${instructor._id}_${slot.date}_${slot.start}_${index}`;
              
              events.push({
                id: eventId,
                title: `${instructor.name} - Driving Test`,
                start: `${slot.date}T${slot.start}:00`,
                end: `${slot.date}T${slot.end}:00`,
                instructorId: instructor._id,
                instructorName: instructor.name,
                classType: 'driving test',
                status: slot.status || 'available',
                amount: slot.amount,
                studentId: slot.studentId,
                studentName: slot.studentName,
                paid: slot.paid,
                backgroundColor: getStatusColor(slot.status),
                borderColor: getStatusColor(slot.status),
                extendedProps: {
                  instructorId: instructor._id,
                  instructorName: instructor.name,
                  classType: 'driving test',
                  status: slot.status || 'available',
                  amount: slot.amount,
                  studentId: slot.studentId,
                  studentName: slot.studentName,
                  paid: slot.paid,
                  scheduleType: 'driving_test',
                  eventId: eventId
                }
              });
            }
          });
        }

        // Procesar schedule_driving_lesson
        if (instructor.schedule_driving_lesson && Array.isArray(instructor.schedule_driving_lesson)) {
          instructor.schedule_driving_lesson.forEach((slot: any, index: number) => {
            if (slot && slot.date && slot.start && slot.end) {
              // Generar ID único si no existe
              const eventId = slot._id || `driving_lesson_${instructor._id}_${slot.date}_${slot.start}_${index}`;
              
              events.push({
                id: eventId,
                title: `${instructor.name} - Driving Lesson`,
                start: `${slot.date}T${slot.start}:00`,
                end: `${slot.date}T${slot.end}:00`,
                instructorId: instructor._id,
                instructorName: instructor.name,
                classType: 'driving lesson',
                status: slot.status || 'available',
                amount: slot.amount,
                studentId: slot.studentId,
                studentName: slot.studentName,
                paid: slot.paid,
                backgroundColor: getStatusColor(slot.status),
                borderColor: getStatusColor(slot.status),
                extendedProps: {
                  instructorId: instructor._id,
                  instructorName: instructor.name,
                  classType: 'driving lesson',
                  status: slot.status || 'available',
                  amount: slot.amount,
                  studentId: slot.studentId,
                  studentName: slot.studentName,
                  paid: slot.paid,
                  pickupLocation: slot.pickupLocation,
                  dropoffLocation: slot.dropoffLocation,
                  selectedProduct: slot.selectedProduct,
                  scheduleType: 'driving_lesson',
                  eventId: eventId
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
    case 'booked':
      return '#3b82f6'; // blue
    case 'pending':
      return '#f59e0b'; // yellow
    case 'cancelled':
      return '#ef4444'; // red
    case 'expired':
      return '#6b7280'; // gray
    default:
      return '#3b82f6'; // blue
  }
} 