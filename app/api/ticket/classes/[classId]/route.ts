import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import TicketClass from "@/lib/models/TicketClass";
import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";
import mongoose from "mongoose";

const ticketClassSchema = Joi.object({
  locationId: Joi.string(),
  date: Joi.date().iso(),
  hour: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  classId: Joi.string(),
  instructorId: Joi.string(),
  cupos: Joi.number().integer().min(1),
  students: Joi.array().items(Joi.string()).default([]),
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
  const resolvedParams = await params;
  const classId = resolvedParams.classId;

  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const { error, value } = ticketClassSchema.validate(body);

    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const ticketClass = await TicketClass.findOne({ _id: classId });

    if (!ticketClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    Object.keys(value).forEach((key) => {
      (ticketClass as any)[key] = (value as any)[key];
    });

    if (body.students !== undefined) {
      ticketClass.students = body.students;
    }

    if (body.cupos !== undefined) {
      ticketClass.cupos = body.cupos;
    }

    await ticketClass.save();

    return NextResponse.json({
      message: "Class updated successfully",
      data: ticketClass,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.classId;
  console.log(classId);
  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  const ticketClass = await TicketClass.findOne({ _id: classId }).lean().exec();

  if (!ticketClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(ticketClass);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  await connectToDB();
  const resolvedParams = await params;
  const classId = resolvedParams.classId || req.url.split("/").pop();
  console.log("[DELETE ticketclass] classId:", classId);

  if (!classId) {
    console.error("[DELETE ticketclass] No classId provided");
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    console.error("[DELETE ticketclass] Invalid ObjectId:", classId);
    return NextResponse.json({ error: "Invalid classId" }, { status: 400 });
  }

  try {
    console.log("[DELETE ticketclass] Starting deletion process for classId:", classId);
    
    // Buscar el ticketclass para obtener el instructorId
    const ticketClass = await TicketClass.findById(classId);
    if (!ticketClass) {
      console.error("[DELETE ticketclass] Class not found:", classId);
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    
    const instructorId = ticketClass.instructorId;
    console.log("[DELETE ticketclass] Found ticketclass with instructorId:", instructorId);
    
    // Borrar el ticketclass de la colección
    const deleted = await TicketClass.findOneAndDelete({ _id: new mongoose.Types.ObjectId(classId) });
    console.log("[DELETE ticketclass] Deleted from ticketclasses collection:", deleted ? "SUCCESS" : "FAILED");
    
    if (!deleted) {
      console.error("[DELETE ticketclass] Failed to delete from collection");
      return NextResponse.json({ error: "TicketClass not deleted from collection" }, { status: 500 });
    }
    
    // Si hay instructorId, clear the ticketClassId from the slot instead of removing the entire slot
    if (instructorId && mongoose.Types.ObjectId.isValid(instructorId)) {
      console.log("[DELETE ticketclass] Attempting to clear ticketClassId from instructor schedule...");
      const updateResult = await Instructor.updateOne(
        { 
          _id: instructorId,
          'schedule.ticketClassId': classId
        },
        { 
          $unset: { 'schedule.$.ticketClassId': "" }
        }
      );
      console.log("[DELETE ticketclass] Instructor schedule update result:", {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        acknowledged: updateResult.acknowledged
      });
      
      if (updateResult.matchedCount === 0) {
        console.warn("[DELETE ticketclass] No instructor found with matching slot for ticketClassId:", classId);
      } else if (updateResult.modifiedCount === 0) {
        console.warn("[DELETE ticketclass] No slots updated in instructor schedule");
      } else {
        console.log("[DELETE ticketclass] Successfully cleared ticketClassId from instructor schedule");
      }
    } else {
      console.log("[DELETE ticketclass] No valid instructorId, skipping schedule cleanup");
    }
    
    console.log("[DELETE ticketclass] Deletion process completed successfully for classId:", classId);
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
