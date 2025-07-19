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
      classType,
      status = "available",
      amount,
      pickupLocation = "",
      dropoffLocation = "",
    } = body;

    if (!instructorId || !date || !start || !end || !classType) {
      return NextResponse.json(
        { message: "Missing required fields: instructorId, date, start, end, classType" },
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

    // Create the schedule slot
    const scheduleSlot = {
      date,
      start,
      end,
      status,
      classType,
      amount: amount || null,
      pickupLocation,
      dropoffLocation,
      instructorId,
      booked: false,
      studentId: null,
      paid: false,
    };

    // Determine which schedule array to update based on class type
    let updateField;
    if (classType === "driving test") {
      updateField = "schedule_driving_test";
    } else if (classType === "driving lesson") {
      updateField = "schedule_driving_lesson";
    } else {
      // For other class types (D.A.T.E, B.D.I, A.D.I), use driving lesson schedule
      updateField = "schedule_driving_lesson";
    }

    // Add the slot to the appropriate schedule array
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $push: { [updateField]: scheduleSlot }
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Schedule slot added successfully",
      instructor: updatedInstructor
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding schedule slot:", error);
    return NextResponse.json(
      { message: "Error adding schedule slot" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");
    const classType = searchParams.get("classType");

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

    // Return the appropriate schedule based on class type
    let schedule;
    if (classType === "driving test") {
      schedule = instructor.schedule_driving_test || [];
    } else if (classType === "driving lesson") {
      schedule = instructor.schedule_driving_lesson || [];
    } else {
      // For other class types, return driving lesson schedule
      schedule = instructor.schedule_driving_lesson || [];
    }

    return NextResponse.json(schedule, { status: 200 });

  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { message: "Error fetching schedule" },
      { status: 500 }
    );
  }
} 