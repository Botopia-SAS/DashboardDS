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

    // Obtener el evento original ANTES de actualizarlo para verificar si se está cancelando
    let originalEvent: any | null = null;
    if (instructor.schedule_driving_test) {
      originalEvent = 
        instructor.schedule_driving_test.find((e: any) => e._id === eventId) ||
        instructor.schedule_driving_test.find((e: any, idx: number) => `driving_test_${instructor._id}_${e.date}_${e.start}_${idx}` === eventId) ||
        null;
    }
    if (!originalEvent && instructor.schedule_driving_lesson) {
      originalEvent = 
        instructor.schedule_driving_lesson.find((e: any) => e._id === eventId) ||
        instructor.schedule_driving_lesson.find((e: any, idx: number) => `driving_lesson_${instructor._id}_${e.date}_${e.start}_${idx}` === eventId) ||
        null;
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
    let movedToDifferentCollection = false;
    let finalEventId = eventId;
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
      const newEventBase = {
        _id: newEventId,
        date,
        start,
        end,
        status,
        classType,
        amount: amount ? parseFloat(amount) : (originalEvent?.amount ?? null),
        studentId: (typeof studentId !== 'undefined' ? studentId : originalEvent?.studentId) || null,
        studentName: (typeof studentName !== 'undefined' ? studentName : originalEvent?.studentName) || null,
        paid: typeof paid === 'boolean' ? paid : (originalEvent?.paid ?? false),
        // For driving test we will not include instructorId or booked
      };
      // For driving test we must NOT store pickup/dropoff
      const newEvent = classType === "driving test"
        ? newEventBase
        : { ...newEventBase, pickupLocation: eventData.pickupLocation ?? originalEvent?.pickupLocation ?? "", dropoffLocation: eventData.dropoffLocation ?? originalEvent?.dropoffLocation ?? "" };

      // Agregar a la nueva colección
      if (classType === "driving test") {
        await Instructor.updateOne(
          { _id: instructorId },
          { $push: { schedule_driving_test: newEvent } }
        );
      } else if (classType === "driving lesson") {
        await Instructor.updateOne(
          { _id: instructorId },
          { $push: { schedule_driving_lesson: { ...newEvent, instructorId, booked: typeof originalEvent?.booked === 'boolean' ? originalEvent.booked : (status === "booked" || status === "pending") } } }
        );
      }
      movedToDifferentCollection = true;
      finalEventId = newEventId;
    } else {
      // Actualizar en la misma colección (mismo tipo de clase)
      console.log(`Updating event in same class type: ${classType}`);
      
      const updateDataBase = {
        date,
        start,
        end,
        status,
        classType,
        amount: amount ? parseFloat(amount) : null,
        studentId: studentId || null,
        studentName: studentName || null,
        paid: paid || false,
      };

      if (classType === "driving test") {
        // Update base fields and ensure pickup/dropoff, instructorId and booked are removed
        await Instructor.updateOne(
          { _id: instructorId, "schedule_driving_test._id": eventId },
          {
            $set: { "schedule_driving_test.$": { ...updateDataBase, _id: eventId } },
          }
        );
        await Instructor.updateOne(
          { _id: instructorId, "schedule_driving_test._id": eventId },
          { $unset: { "schedule_driving_test.$.pickupLocation": "", "schedule_driving_test.$.dropoffLocation": "", "schedule_driving_test.$.instructorId": "", "schedule_driving_test.$.booked": "" } }
        );
      } else if (classType === "driving lesson") {
        await Instructor.updateOne(
          { _id: instructorId, "schedule_driving_lesson._id": eventId },
          { $set: { "schedule_driving_lesson.$": { ...updateDataBase, booked: status === "booked" || status === "pending", _id: eventId, pickupLocation: eventData.pickupLocation || "", dropoffLocation: eventData.dropoffLocation || "", instructorId } } }
        );
      }
    }

    // Si se está cancelando un evento que previamente no estaba cancelado, crear un slot disponible
    const isBeingCancelled = originalEvent && originalEvent.status !== "cancelled" && status === "cancelled";
    let newAvailableSlotId = null;

    if (isBeingCancelled && originalEvent) {
      console.log(`Creating available slot for cancelled event: ${eventId}`);
      
      // Crear un nuevo evento "available" con las mismas características
      const availableSlotId = generateEventId(originalEvent.classType, instructorId, originalEvent.date, originalEvent.start);
      const availableSlot: any = {
        _id: availableSlotId,
        date: originalEvent.date,
        start: originalEvent.start,
        end: originalEvent.end,
        status: "available",
        classType: originalEvent.classType,
        amount: originalEvent.classType === "driving test" ? originalEvent.amount : null,
        studentId: null,
        studentName: null,
        paid: false,
      };

      // Agregar campos específicos según el tipo de clase
      if (originalEvent.classType === "driving lesson") {
        availableSlot.pickupLocation = "";
        availableSlot.dropoffLocation = "";
        availableSlot.instructorId = instructorId;
        availableSlot.booked = false;
      }

      // Insertar el nuevo slot disponible en la colección apropiada
      if (originalEvent.classType === "driving test") {
        await Instructor.updateOne(
          { _id: instructorId },
          { $push: { schedule_driving_test: availableSlot } }
        );
      } else if (originalEvent.classType === "driving lesson") {
        await Instructor.updateOne(
          { _id: instructorId },
          { $push: { schedule_driving_lesson: availableSlot } }
        );
      }

      newAvailableSlotId = availableSlotId;
      console.log(`✅ Created available slot ${availableSlotId} for cancelled event`);
    }

    // Verificar que el evento se actualizó correctamente
    const updatedInstructor = await Instructor.findById(instructorId);
    const targetEventId = finalEventId;
    const eventUpdated = 
      (updatedInstructor.schedule_driving_test && updatedInstructor.schedule_driving_test.some((e: any) => e._id === targetEventId && e.classType === classType)) ||
      (updatedInstructor.schedule_driving_lesson && updatedInstructor.schedule_driving_lesson.some((e: any) => e._id === targetEventId && e.classType === classType));

    if (!eventUpdated) {
      return NextResponse.json(
        { message: "Failed to update event" },
        { status: 500 }
      );
    }

    const responseMessage = isBeingCancelled 
      ? `Event cancelled and new available slot created successfully` 
      : "Event updated successfully";

    return NextResponse.json(
      { 
        message: responseMessage, 
        eventId: targetEventId, 
        moved: movedToDifferentCollection,
        newAvailableSlotId: newAvailableSlotId
      },
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