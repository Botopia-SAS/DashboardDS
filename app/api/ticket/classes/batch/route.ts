import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TicketClass from "@/lib/models/TicketClass";
import Instructor from "@/lib/models/Instructor";
import Location from "@/lib/models/Locations";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

// Define types for parameters
interface TicketClassData {
  locationId: string;
  date: string;
  hour: string;
  endHour: string;
  classId: string;
  type: string;
  instructorId?: string;
  students?: string[];
  cupos?: number;
  [key: string]: any;
}

// Define types for schedule slots
interface ScheduleSlot {
  date: string;
  start: string;
  end: string;
  ticketClassId?: mongoose.Types.ObjectId;
  status?: string;
  classType?: string;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Esperar que body sea un array de ticket classes
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request format, expected array of ticket classes" },
        { status: 400 }
      );
    }
    
    // console.log(`[API] ticket/classes/batch POST - Creating ${body.length} classes in batch`);
    
    // Validar cada clase del lote
    for (let i = 0; i < body.length; i++) {
      const ticketClass = body[i];
      if (!ticketClass.locationId || !ticketClass.date || !ticketClass.hour || !ticketClass.classId) {
        return NextResponse.json(
          { error: `Missing required fields in ticket class at index ${i}` },
          { status: 400 }
        );
      }
      
      // Normalizar la fecha para cada clase
      const originalDate = new Date(ticketClass.date);
      const normalizedDate = originalDate.toISOString().split('T')[0];
      ticketClass.date = normalizedDate;
      
      // console.log(`[API] Date normalization for class ${i}: {
      //   originalDate: ${originalDate},
      //   normalizedDate: '${normalizedDate}'
      // }`);
      
      // Validar horarios para cada clase
      // console.log(`[API] Time validation for class ${i}: {
      //   date: '${ticketClass.date}',
      //   startTime: '${ticketClass.hour}',
      //   endTime: '${ticketClass.endHour}',
      //   duration: '${ticketClass.duration}',
      //   instructorId: '${ticketClass.instructorId}'
      // }`);
    }
    
    // Procesar ubicaciones e instructores en lote para reducir consultas a DB
    const locationInstructorMap = new Map<string, Set<string>>();
    
    // Agrupar por ubicación e instructor
    body.forEach(ticketClass => {
      if (!locationInstructorMap.has(ticketClass.locationId)) {
        locationInstructorMap.set(ticketClass.locationId, new Set());
      }
      if (ticketClass.instructorId) {
        locationInstructorMap.get(ticketClass.locationId)?.add(ticketClass.instructorId);
      }
    });
    
    // Verificar y actualizar asignaciones de instructor-ubicación
    for (const [locationId, instructorIds] of locationInstructorMap.entries()) {
      const location = await Location.findById(locationId);
      if (!location) {
        return NextResponse.json(
          { error: `Location with ID ${locationId} not found` },
          { status: 404 }
        );
      }
      
      // Construir el array completo de instructores para la ubicación
      const currentInstructorIds = Array.isArray(location.instructors) 
        ? location.instructors.map((id: any) => id.toString()) 
        : [];
      
      const newInstructorIds = [...instructorIds].filter((id: string) => !currentInstructorIds.includes(id));
      
      // Si hay nuevos instructores para asignar
      if (newInstructorIds.length > 0) {
        // console.log(`[API] Batch-assigning ${newInstructorIds.length} instructors to location ${locationId}`);
        const allInstructorIds = [...new Set([...currentInstructorIds, ...newInstructorIds])];
        
        // Actualizar ubicación con todos los instructores
        await Location.findByIdAndUpdate(locationId, {
          instructors: allInstructorIds
        });
      }
    }
    
    // Crear todas las ticket classes en una sola operación
    const createdClasses = await TicketClass.insertMany(body);
    // console.log(`[API] Successfully created ${createdClasses.length} ticket classes in batch`);
    
    // Actualizar el schedule de cada instructor con las nuevas ticket classes
    const instructorUpdates = new Map<string, { date: string, hour: string, endHour: string, ticketClassId: ObjectId }[]>();
    
    // Agrupar las actualizaciones por instructor
    createdClasses.forEach((ticketClass: any, index: number) => {
      const instructorId = body[index].instructorId;
      if (!instructorId) return;
      
      if (!instructorUpdates.has(instructorId)) {
        instructorUpdates.set(instructorId, []);
      }
      
      instructorUpdates.get(instructorId)?.push({
        date: ticketClass.date,
        hour: ticketClass.hour,
        endHour: ticketClass.endHour,
        ticketClassId: ticketClass._id
      });
    });
    
    // Aplicar las actualizaciones para cada instructor
    for (const [instructorId, slots] of instructorUpdates.entries()) {
      // console.log(`[API] Batch-updating schedule for instructor ${instructorId} with ${slots.length} slots`);
      
      const instructor = await Instructor.findById(instructorId);
      if (!instructor) {
        console.error(`[API] Instructor ${instructorId} not found, skipping schedule update`);
        continue;
      }
      
      // Obtener el schedule actual o inicializar uno nuevo
      const currentSchedule: ScheduleSlot[] = Array.isArray(instructor.schedule) ? instructor.schedule : [];
      
      // Añadir nuevos slots
      for (const slot of slots) {
        // Buscar si ya existe un slot para esta fecha/hora
        const existingSlotIndex = currentSchedule.findIndex((s: any) => 
          s.date === slot.date && s.start === slot.hour && s.end === slot.endHour
        );
        
        if (existingSlotIndex >= 0) {
          // Actualizar el slot existente con el ticketClassId
          currentSchedule[existingSlotIndex].ticketClassId = slot.ticketClassId;
          // console.log(`[API] Updated existing slot with ticketClassId ${slot.ticketClassId}`);
        } else {
          // Crear nuevo slot en el schedule
          currentSchedule.push({
            date: slot.date,
            start: slot.hour,
            end: slot.endHour,
            ticketClassId: slot.ticketClassId,
            status: "available"
          });
          // console.log(`[API] Created new slot in instructor schedule for ${slot.date}`);
        }
      }
      
      // Guardar el schedule actualizado del instructor
      await Instructor.findByIdAndUpdate(instructorId, {
        schedule: currentSchedule
      });
    }
    
    const response = createdClasses.map((ticketClass, idx) => ({
      _id: ticketClass._id,
      clientTempId: body[idx].clientTempId,
      // Puedes agregar más campos si lo necesitas
    }));

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("[API] Error in batch creating ticket classes:", error);
    return NextResponse.json(
      { error: error.message || "Error creating ticket classes" },
      { status: 500 }
    );
  }
}
