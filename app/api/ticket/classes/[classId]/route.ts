import { NextRequest, NextResponse } from "next/server";
import Joi from "joi";
import TicketClass from "@/lib/models/TicketClass";

const ticketClassSchema = Joi.object({
  locationId: Joi.string(),
  date: Joi.date().iso(),
  hour: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  classId: Joi.string(),
  instructorId: Joi.string(),
  students: Joi.array().items(Joi.string()).default([]),
}).unknown(false);

export async function PATCH(req: NextRequest) {
  const classId = req.url.split("/").pop();

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

    // Update the ticket class with the new values
    Object.assign(ticketClass, value);
    await ticketClass.save();

    return NextResponse.json({
      message: "Class updated successfully",
      data: ticketClass,
    });
  } catch {
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
