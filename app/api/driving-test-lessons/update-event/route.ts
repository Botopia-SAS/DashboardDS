import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { generateEventId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    await connectToDB();
    const eventData = await req.json();

    const {
      eventId,
      instructorId,
      classType,
      date,
      start,
      end,
      status,
      amount,
      studentId,
      studentName,
      paid,
      originalClassType
    } = eventData;

    if (!eventId || !instructorId || !classType || !date || !start || !end) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Verificar que el evento existe en alguna de las colecciones
    let eventExists = 
      (instructor.schedule_driving_test && instructor.schedule_driving_test.some((e: any) => e._id === eventId)) ||
      (instructor.schedule_driving_lesson && instructor.schedule_driving_lesson.some((e: any) => e._id === eventId));

    // Si no se encuentra con _id, buscar por el patrón del ID generado
    if (!eventExists) {
      console.log(`Event not found with _id, trying to find by generated ID pattern`);
      
      // Buscar en schedule_driving_test
      if (instructor.schedule_driving_test) {
        const testEventIndex = instructor.schedule_driving_test.findIndex((e: any) => {
          const generatedId = `driving_test_${instructor._id}_${e.date}_${e.start}_${instructor.schedule_driving_test.indexOf(e)}`;
          return generatedId === eventId;
        });
        if (testEventIndex !== -1) {
          eventExists = true;
          // Actualizar el evento con un _id real
          instructor.schedule_driving_test[testEventIndex]._id = eventId;
        }
      }

      // Buscar en schedule_driving_lesson
      if (instructor.schedule_driving_lesson) {
        const lessonEventIndex = instructor.schedule_driving_lesson.findIndex((e: any) => {
          const generatedId = `driving_lesson_${instructor._id}_${e.date}_${e.start}_${instructor.schedule_driving_lesson.indexOf(e)}`;
          return generatedId === eventId;
        });
        if (lessonEventIndex !== -1) {
          eventExists = true;
          // Actualizar el evento con un _id real
          instructor.schedule_driving_lesson[lessonEventIndex]._id = eventId;
        }
      }
    }

    if (!eventExists) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    // Si el classType cambió, necesitamos eliminar de una colección y agregar a la otra
    if (originalClassType && originalClassType !== classType) {
      console.log(`Moving event from ${originalClassType} to ${classType}`);
      
      // Primero, eliminar de ambas colecciones para asegurar limpieza
      await Instructor.updateOne(
        { _id: instructorId },
        { $pull: { schedule_driving_test: { _id: eventId } } }
      );
      
      await Instructor.updateOne(
        { _id: instructorId },
        { $pull: { schedule_driving_lesson: { _id: eventId } } }
      );

      // Crear el nuevo evento con un ID único
      const newEventId = generateEventId(classType, instructorId, date, start);
      const newEvent = {
        _id: newEventId,
        date,
        start,
        end,
        status,
        classType,
        amount: amount ? parseFloat(amount) : null,
        studentId: studentId || null,
        studentName: studentName || null,
        paid: paid || false,
        pickupLocation: "",
        dropoffLocation: "",
        instructorId,
        booked: status === "booked" || status === "pending"
      };

      // Agregar a la nueva colección
      if (classType === "driving test") {
        await Instructor.updateOne(
          { _id: instructorId },
          { $push: { schedule_driving_test: newEvent } }
        );
      } else if (classType === "driving lesson") {
        await Instructor.updateOne(
          { _id: instructorId },
          { $push: { schedule_driving_lesson: newEvent } }
        );
      }
    } else {
      // Actualizar en la misma colección (mismo tipo de clase)
      console.log(`Updating event in same class type: ${classType}`);
      
      const updateData = {
        date,
        start,
        end,
        status,
        classType,
        amount: amount ? parseFloat(amount) : null,
        studentId: studentId || null,
        studentName: studentName || null,
        paid: paid || false,
        booked: status === "booked" || status === "pending"
      };

      if (classType === "driving test") {
        await Instructor.updateOne(
          { _id: instructorId, "schedule_driving_test._id": eventId },
          { $set: { "schedule_driving_test.$": { ...updateData, _id: eventId, pickupLocation: eventData.pickupLocation || "", dropoffLocation: eventData.dropoffLocation || "", instructorId } } }
        );
      } else if (classType === "driving lesson") {
        await Instructor.updateOne(
          { _id: instructorId, "schedule_driving_lesson._id": eventId },
          { $set: { "schedule_driving_lesson.$": { ...updateData, _id: eventId, pickupLocation: eventData.pickupLocation || "", dropoffLocation: eventData.dropoffLocation || "", instructorId } } }
        );
      }
    }

    // Verificar que el evento se actualizó correctamente
    const updatedInstructor = await Instructor.findById(instructorId);
    const eventUpdated = 
      (updatedInstructor.schedule_driving_test && updatedInstructor.schedule_driving_test.some((e: any) => e._id === eventId && e.classType === classType)) ||
      (updatedInstructor.schedule_driving_lesson && updatedInstructor.schedule_driving_lesson.some((e: any) => e._id === eventId && e.classType === classType));

    if (!eventUpdated) {
      return NextResponse.json(
        { message: "Failed to update event" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Event updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { message: "Error updating event", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 