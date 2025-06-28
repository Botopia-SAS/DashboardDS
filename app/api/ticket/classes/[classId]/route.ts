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
  students: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.string().required(),
        citation_number: Joi.string().required(),
        reason: Joi.string().required(),
        country_ticket: Joi.string().required(),
        license_number: Joi.string().required(),
        course_country: Joi.string().required(),
      })
    )
    .default([]),
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

export async function PATCH(req: NextRequest, { params }: { params: { classId: string } }) {
  const resolvedParams = await params;
  const classId = resolvedParams.classId;

  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  try {
    const body = await req.json();

    if (body.students && Array.isArray(body.students)) {
      body.students = body.students.map((student: Partial<Student>) => ({
        studentId: student.studentId || student.id || "", // Asegurar que studentId esté presente
        citation_number: student.citation_number || student.case_number || "", // Mapear case_number a citation_number si es necesario
        reason: student.reason || "", // Asegurar que reason esté presente
        country_ticket: student.country_ticket || "", // Asegurar que country_ticket esté presente
        license_number: student.license_number || student.licenseNumber || "", // Mapear licenseNumber a license_number si es necesario
        course_country: student.course_country || student.country_course || "", // Mapear country_course a course_country si es necesario
        case_number: student.case_number || student.citation_number || "", // Asegurar que case_number esté presente
        country_course: student.country_course || student.course_country || "", // Asegurar que country_course esté presente
      }));
    }

    const { error, value } = ticketClassSchema.validate({
      ...body,
      students: undefined,
    });

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
      if (key !== "students") {
        ticketClass[key] = value[key];
      }
    });

    if (body.students) {
      ticketClass.students = body.students;
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

export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
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

export async function DELETE(req: NextRequest, { params }: { params: { classId: string } }) {
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
