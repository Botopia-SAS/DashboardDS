import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();
    const {
      instructorId,
      date,
      start,
      end,
      classType = "driving lesson",
      status = "available",
      amount,
      pickupLocation = "",
      dropoffLocation = "",
    } = body;

    if (!instructorId || !date || !start || !end) {
      return NextResponse.json(
        { message: "Missing required fields: instructorId, date, start, end" },
        { status: 400 }
      );
    }

    // Validate instructor exists
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Validar conflictos de horarios
    const hasConflict = await validateScheduleConflict(instructor, date, start, end);
    if (hasConflict) {
      return NextResponse.json(
        { message: "Schedule conflict detected. There's already a class scheduled during this time." },
        { status: 409 }
      );
    }

    // Create the driving lesson schedule slot
    const scheduleSlot = {
      date,
      start,
      end,
      status,
      classType,
      amount: amount || null,
      pickupLocation,
      dropoffLocation,
      instructorId,
      booked: false,
      studentId: null,
      paid: false,
    };

    // Add the slot to the driving lesson schedule array
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $push: { schedule_driving_lesson: scheduleSlot }
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Driving lesson schedule slot added successfully",
      instructor: updatedInstructor
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding driving lesson schedule slot:", error);
    return NextResponse.json(
      { message: "Error adding driving lesson schedule slot" },
      { status: 500 }
    );
  }
}

// Función para validar conflictos de horarios
async function validateScheduleConflict(instructor: any, date: string, start: string, end: string) {
  try {
    // Verificar conflictos en schedule_driving_test
    if (instructor.schedule_driving_test && Array.isArray(instructor.schedule_driving_test)) {
      for (const slot of instructor.schedule_driving_test) {
        if (slot.date === date) {
          // Verificar si hay superposición
          if (
            (start < slot.end && end > slot.start) ||
            (slot.start < end && slot.end > start)
          ) {
            return true; // Hay conflicto
          }
        }
      }
    }

    // Verificar conflictos en schedule_driving_lesson
    if (instructor.schedule_driving_lesson && Array.isArray(instructor.schedule_driving_lesson)) {
      for (const slot of instructor.schedule_driving_lesson) {
        if (slot.date === date) {
          // Verificar si hay superposición
          if (
            (start < slot.end && end > slot.start) ||
            (slot.start < end && slot.end > start)
          ) {
            return true; // Hay conflicto
          }
        }
      }
    }

    return false; // No hay conflictos
  } catch (error) {
    console.error("Error validating schedule conflict:", error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");
    const classType = searchParams.get("classType");

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    let schedule = instructor.schedule_driving_lesson || [];
    
    // Filter by class type if specified
    if (classType) {
      schedule = schedule.filter((slot: any) => slot.classType === classType);
    }

    return NextResponse.json(schedule, { status: 200 });

  } catch (error) {
    console.error("Error fetching driving lesson schedule:", error);
    return NextResponse.json(
      { message: "Error fetching driving lesson schedule" },
      { status: 500 }
    );
  }
} 