import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const eventData = await req.json();

    const {
      instructorId,
      classType,
      date,
      start,
      end,
      status,
      amount,
      studentId,
      studentName,
      paid
    } = eventData;

    if (!instructorId || !classType || !date || !start || !end) {
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

    // Crear nuevo evento con ID único
    const newEvent = {
      _id: `${classType}_${instructorId}_${Date.now()}_${Math.random()}`,
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

    // Agregar a la colección correspondiente
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

    return NextResponse.json(
      { message: "Event copied successfully", eventId: newEvent._id },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error copying event:", error);
    return NextResponse.json(
      { message: "Error copying event", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 