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

export async function PATCH(req: NextRequest) {
  const classId = req.url.split("/").pop();

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

export async function GET(req: NextRequest) {
  const classId = req.url.split("/").pop();
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
  const classId = params.classId || req.url.split("/").pop();
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
    // Buscar el ticketclass para obtener el instructorId
    const ticketClass = await TicketClass.findById(classId);
    if (!ticketClass) {
      console.error("[DELETE ticketclass] Class not found:", classId);
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    const instructorId = ticketClass.instructorId;
    // Borrar el ticketclass (asegúrate de usar ObjectId)
    const deleted = await TicketClass.findOneAndDelete({ _id: new mongoose.Types.ObjectId(classId) });
    console.log("[DELETE ticketclass] Deleted result:", deleted);
    if (!deleted) {
      return NextResponse.json({ error: "TicketClass not deleted" }, { status: 500 });
    }
    // Si hay instructorId, eliminar el _id del schedule
    if (instructorId && mongoose.Types.ObjectId.isValid(instructorId)) {
      const updateResult = await Instructor.updateOne(
        { _id: instructorId },
        { $pull: { schedule: classId } }
      );
      console.log("[DELETE ticketclass] Removed from instructor schedule:", updateResult);
    }
    console.log("[DELETE ticketclass] Deleted successfully:", classId);
    return NextResponse.json({ message: "Class deleted successfully", deleted });
  } catch (err) {
    console.error("[DELETE ticketclass] Error deleting class:", err);
    return NextResponse.json({ error: "Error deleting class" }, { status: 500 });
  }
}
