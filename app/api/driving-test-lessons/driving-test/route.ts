import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

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
      status = "available",
      amount,
      studentId,
      paid = false,
      recurrence = "none"
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

    // Create the driving test schedule slot
    const scheduleSlot = {
      date,
      start,
      end,
      status,
      classType: "driving test",
      amount: amount || null,
      studentId: studentId || null,
      paid: paid || false
    };

    // Add the slot to the driving test schedule array
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $push: { schedule_driving_test: scheduleSlot }
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Driving test schedule slot added successfully",
      instructor: updatedInstructor
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding driving test schedule slot:", error);
    return NextResponse.json(
      { message: "Error adding driving test schedule slot" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

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

    const schedule = instructor.schedule_driving_test || [];
    return NextResponse.json(schedule, { status: 200 });

  } catch (error) {
    console.error("Error fetching driving test schedule:", error);
    return NextResponse.json(
      { message: "Error fetching driving test schedule" },
      { status: 500 }
    );
  }
} 