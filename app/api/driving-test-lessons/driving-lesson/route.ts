import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { generateEventId } from "@/lib/utils";

// Tipo para el instructor con las propiedades necesarias
interface InstructorWithSchedule {
  schedule_driving_test?: Array<{
    date: string;
    start: string;
    end: string;
  }>;
  schedule_driving_lesson?: Array<{
    date: string;
    start: string;
    end: string;
    classType: string;
  }>;
}

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
      // amount,
      pickupLocation = "",
      dropoffLocation = "",
      selectedProduct = "",
      recurrence = "none",
      recurrenceEndDate
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

    // Función para generar fechas recurrentes
    const generateRecurrenceDates = (startDate: string, recurrence: string, endDate: string) => {
      const dates = [];
      const currentDate = new Date(startDate);
      const endRecurrenceDate = new Date(endDate);
      
      while (currentDate <= endRecurrenceDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        
        switch (recurrence) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          default:
            break;
        }
      }
      
      return dates;
    };

    // Generar eventos recurrentes si es necesario
    let eventsToCreate = [];
    
    //console.log("🔄 Processing recurrence:", { recurrence, recurrenceEndDate, date });
    
    if (recurrence && recurrence !== 'none' && recurrenceEndDate) {
      const dates = generateRecurrenceDates(date, recurrence, recurrenceEndDate);
      //console.log("📅 Generated recurrence dates:", dates);
      
      // Filtrar fechas que no tienen conflictos
      for (const dateToCheck of dates) {
        const hasConflict = await validateScheduleConflict(instructor, dateToCheck, start, end);
        if (!hasConflict) {
          eventsToCreate.push({ date: dateToCheck, start, end });
        } else {
          console.log(`⚠️ Skipping date ${dateToCheck} due to schedule conflict`);
        }
      }
    } else {
      // Para eventos únicos (sin recurrencia), validar conflicto y fallar si existe
      const hasConflict = await validateScheduleConflict(instructor, date, start, end);
      if (hasConflict) {
        return NextResponse.json(
          { message: "Schedule conflict detected. There's already a class scheduled during this time." },
          { status: 409 }
        );
      }
      eventsToCreate = [{ date, start, end }];
    }
    
    //console.log("🎯 Events to create:", eventsToCreate.length);

    // Si no hay eventos para crear (todos tenían conflictos), informar
    if (eventsToCreate.length === 0) {
      return NextResponse.json(
        { message: "No events could be created. All dates in the recurrence had schedule conflicts." },
        { status: 409 }
      );
    }

    // Crear todos los eventos válidos
    const createdEvents = [];
    for (const eventData of eventsToCreate) {
      const eventId = generateEventId("driving_lesson", instructorId, eventData.date, start);
      const scheduleSlot = {
        _id: eventId,
        date: eventData.date,
        start,
        end,
        status,
        classType,
        pickupLocation,
        dropoffLocation,
        selectedProduct,
        studentId: body.studentId || null,
        studentName: body.studentName || null,
        paid: body.paid || false,
      };
      
      createdEvents.push(scheduleSlot);
    }

    //console.log("✅ Created events:", createdEvents.length);
    
    // Add all slots to the driving lesson schedule array
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $push: { schedule_driving_lesson: { $each: createdEvents } }
      },
      { new: true }
    );

    // Preparar mensaje de respuesta
    let message = "Driving lesson schedule slot added successfully";
    if (recurrence && recurrence !== 'none' && recurrenceEndDate) {
      const totalRequestedDates = generateRecurrenceDates(date, recurrence, recurrenceEndDate);
      const createdDates = createdEvents.length;
      const skippedDates = totalRequestedDates.length - createdDates;
      
      if (skippedDates > 0) {
        message += `. ${createdDates} events created, ${skippedDates} dates skipped due to conflicts.`;
      } else {
        message += `. All ${createdDates} recurring events created successfully.`;
      }
    }

    return NextResponse.json({
      message,
      instructor: updatedInstructor,
      eventsCreated: createdEvents.length
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
async function validateScheduleConflict(instructor: InstructorWithSchedule, date: string, start: string, end: string) {
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
      schedule = schedule.filter((slot: { classType: string }) => slot.classType === classType);
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