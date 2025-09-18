import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import TicketClass from "@/lib/models/TicketClass";
import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";
import mongoose from "mongoose";

const ticketClassSchema = Joi.object({
  locationId: Joi.string().optional(),
  date: Joi.date().iso().optional(),
  hour: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endHour: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  classId: Joi.string().optional(),
  type: Joi.string().optional(),
  duration: Joi.string().optional(),
  instructorId: Joi.string().optional(),
  spots: Joi.number().integer().min(1).optional(),
  students: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().optional(),
  studentRequests: Joi.array().items(Joi.string()).optional(),
  recurrence: Joi.string().optional(),
  recurrenceEndDate: Joi.string().optional(),
}).unknown(false);

interface Student {
  studentId: string;
  citation_number: string;
  course_country: string;
  case_number: string;
  reason: string;
  country_ticket: string;
  licenseNumber: string;
  country_course: string;
  id: string
  license_number: string 
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    await connectToDB();
    
    const resolvedParams = await params;
    const classId = resolvedParams.classId;

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    const body = await req.json();
    //console.log(`[API] PATCH ticket class ${classId}:`, body);

    // Handle Accept/Reject student requests
    if (body.action === 'acceptRequest') {
      const { studentId, requestId } = body;
      
      const ticketClass = await TicketClass.findById(classId);
      if (!ticketClass) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      // Ensure studentRequests is an array before filtering
      if (!Array.isArray(ticketClass.studentRequests)) {
        ticketClass.studentRequests = [];
      }

      // Remove from studentRequests
      ticketClass.studentRequests = ticketClass.studentRequests.filter(
        (req: any) => req._id.toString() !== requestId
      );

      // Ensure students is an array
      if (!Array.isArray(ticketClass.students)) {
        ticketClass.students = [];
      }

      // Add to students array if not already there
      if (!ticketClass.students.includes(studentId)) {
        ticketClass.students.push(studentId);
      }

      await ticketClass.save();
      return NextResponse.json({ message: "Request accepted successfully" });
    }

    if (body.action === 'rejectRequest') {
      const { requestId } = body;
      
      const ticketClass = await TicketClass.findById(classId);
      if (!ticketClass) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      // Ensure studentRequests is an array before filtering
      if (!Array.isArray(ticketClass.studentRequests)) {
        ticketClass.studentRequests = [];
      }

      // Remove from studentRequests
      ticketClass.studentRequests = ticketClass.studentRequests.filter(
        (req: any) => req._id.toString() !== requestId
      );

      await ticketClass.save();
      return NextResponse.json({ message: "Request rejected successfully" });
    }

    const ticketClass = await TicketClass.findOne({ _id: classId });

    if (!ticketClass) {
      console.error(`[API] Ticket class not found: ${classId}`);
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Lógica especial para aceptar solicitud
    if (body.action === "acceptRequest" && body.studentId && body.requestId) {
      // Eliminar el objeto de studentRequests (array de objetos)
      const reqObj = (ticketClass.studentRequests || []).find((req: any) => req._id?.toString() === body.requestId);
      ticketClass.studentRequests = (ticketClass.studentRequests || []).filter((req: any) => req._id?.toString() !== body.requestId);
      // Agregar el studentId a students si no está
      function isStudentRequestObj(obj: any): obj is { studentId: string } {
        return obj && typeof obj === 'object' && !Array.isArray(obj) && typeof obj.studentId === 'string';
      }
      let studentIdToAdd = body.studentId;
      if (isStudentRequestObj(reqObj)) {
        studentIdToAdd = reqObj.studentId;
      }
      if (studentIdToAdd) {
        // Ensure students is an array
        if (!Array.isArray(ticketClass.students)) {
          ticketClass.students = [];
        }
        if (!ticketClass.students.includes(studentIdToAdd)) {
          ticketClass.students.push(studentIdToAdd);
        }
      }
      await ticketClass.save();
      return NextResponse.json({ message: "Request accepted", data: ticketClass });
    }

    const { error, value } = ticketClassSchema.validate(body);

    if (error) {
      console.error(`[API] Validation error for PATCH ${classId}:`, error.details[0].message);
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const originalData = {
      students: Array.isArray(ticketClass.students) ? [...ticketClass.students] : [],
      cupos: ticketClass.spots
    };

    // Update only the provided fields
    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined) {
        (ticketClass as any)[key] = (value as any)[key];
      }
    });

    // Explicitly handle students and cupos updates
    if (body.students !== undefined) {
      ticketClass.students = body.students;
      //console.log(`[API] Updated students for ${classId}: ${body.students.length} students`);
    }

    if (body.cupos !== undefined) {
      ticketClass.spots = body.cupos;
      //console.log(`[API] Updated cupos for ${classId}: ${body.cupos}`);
    }

    await ticketClass.save();
    //console.log(`[API] Successfully updated ticket class ${classId}`);

    // If we updated students or cupos, we might need to update the instructor's schedule cache
    if (ticketClass.instructorId && (body.students !== undefined || body.cupos !== undefined)) {
      //console.log(`[API] Checking if instructor schedule needs cache update for ${ticketClass.instructorId}`);
      
      try {
        const instructor = await Instructor.findById(ticketClass.instructorId);
        if (instructor && Array.isArray(instructor.schedule)) {
          // Find the corresponding slot in instructor's schedule and update cached data if needed
          const slotIndex = instructor.schedule.findIndex((slot: any) => 
            slot.ticketClassId && slot.ticketClassId.toString() === classId
          );
          
          if (slotIndex >= 0) {
            // The slot exists in the schedule, but the schedule doesn't store students/cupos
            // This data is fetched from the ticket class directly
            //console.log(`[API] Found corresponding slot in instructor schedule, updated data will be fetched from ticket class`);
          }
        }
      } catch (scheduleError) {
        console.error(`[API] Error updating instructor schedule cache:`, scheduleError);
        // Don't fail the main update if schedule cache update fails
      }
    }

    return NextResponse.json({
      message: "Class updated successfully",
      data: ticketClass,
      changes: {
        students: originalData.students !== ticketClass.students,
        cupos: originalData.cupos !== ticketClass.spots
      }
    });
  } catch (err) {
    console.error(`[API] Error in PATCH ticket class:`, err);
    return NextResponse.json(
      { error: "Invalid request body: " + (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  // PUT es idéntico a PATCH para actualizar TicketClasses
  return PATCH(req, { params });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  try {
    await connectToDB();
    
    const resolvedParams = await params;
    const classId = resolvedParams.classId;
    console.log(classId);
    
    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    // Check if this is a temporary ID (starts with "temp-")
    if (classId.startsWith('temp-')) {
      console.log(`[API] Skipping database query for temporary ID: ${classId}`);
      return NextResponse.json({ 
        error: "Temporary ticket class - data stored in frontend cache only" 
      }, { status: 404 });
    }

    // Validate that classId is a valid ObjectId format (24 character hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(classId)) {
      //console.log(`[API] Invalid ObjectId format: ${classId}`);
      return NextResponse.json({ 
        error: "Invalid class ID format" 
      }, { status: 400 });
    }

    const ticketClass = await TicketClass.findOne({ _id: classId }).lean().exec();

    if (!ticketClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(ticketClass);
  } catch (error: any) {
    console.error("[API] Error in GET ticket class:", error);
    return NextResponse.json(
      { error: error.message || "Error retrieving ticket class" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  await connectToDB();
  const resolvedParams = await params;
  const classId = resolvedParams.classId || req.url.split("/").pop();
  //console.log("[DELETE ticketclass] classId:", classId);

  if (!classId) {
    console.error("[DELETE ticketclass] No classId provided");
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    console.error("[DELETE ticketclass] Invalid ObjectId:", classId);
    return NextResponse.json({ error: "Invalid classId" }, { status: 400 });
  }

  try {
   // console.log("[DELETE ticketclass] Starting deletion process for classId:", classId);
    
    // Buscar el ticketclass para obtener el instructorId
    const ticketClass = await TicketClass.findById(classId);
    if (!ticketClass) {
      console.error("[DELETE ticketclass] Class not found:", classId);
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    
    const instructorId = ticketClass.instructorId;
    //console.log("[DELETE ticketclass] Found ticketclass with instructorId:", instructorId);
    
    // Borrar el ticketclass de la colección
    const deleted = await TicketClass.findOneAndDelete({ _id: new mongoose.Types.ObjectId(classId) });
    //console.log("[DELETE ticketclass] Deleted from ticketclasses collection:", deleted ? "SUCCESS" : "FAILED");
    
    if (!deleted) {
      console.error("[DELETE ticketclass] Failed to delete from collection");
      return NextResponse.json({ error: "TicketClass not deleted from collection" }, { status: 500 });
    }
    
    // Si hay instructorId, remove the entire slot from the schedule
    if (instructorId && mongoose.Types.ObjectId.isValid(instructorId)) {
      //console.log("[DELETE ticketclass] Attempting to remove slot completely from instructor schedule...");
      const updateResult = await Instructor.updateOne(
        { _id: instructorId },
        { 
          $pull: { 
            schedule: { ticketClassId: classId }
          }
        }
      );
      //console.log("[DELETE ticketclass] Instructor schedule update result:", {
      //  matchedCount: updateResult.matchedCount,
      //  modifiedCount: updateResult.modifiedCount,
      //  acknowledged: updateResult.acknowledged
      //});
      
      if (updateResult.matchedCount === 0) {
        console.warn("[DELETE ticketclass] No instructor found for instructorId:", instructorId);
      } else if (updateResult.modifiedCount === 0) {
        console.warn("[DELETE ticketclass] No slots removed from instructor schedule (no matching ticketClassId)");
      } else {
        //console.log("[DELETE ticketclass] Successfully removed slot from instructor schedule");
      }
    } else {
      //console.log("[DELETE ticketclass] No valid instructorId, skipping schedule cleanup");
    }
    
    //console.log("[DELETE ticketclass] Deletion process completed successfully for classId:", classId);
    return NextResponse.json({ 
      message: "Class deleted successfully", 
      deleted: {
        _id: deleted._id,
        instructorId: deleted.instructorId,
        date: deleted.date,
        classType: deleted.type
      }
    });
  } catch (err) {
    console.error("[DELETE ticketclass] Error deleting class:", err);
    return NextResponse.json({ error: "Error deleting class: " + (err as Error).message }, { status: 500 });
  }
}
