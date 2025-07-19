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
      classType = "driving lesson",
      status = "available",
      amount,
      pickupLocation = "",
      dropoffLocation = "",
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

    // Create the driving lesson schedule slot
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

    // Add the slot to the driving lesson schedule array
    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $push: { schedule_driving_lesson: scheduleSlot }
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Driving lesson schedule slot added successfully",
      instructor: updatedInstructor
    }, { status: 201 });

  } catch (error) {
    console.error("Error adding driving lesson schedule slot:", error);
    return NextResponse.json(
      { message: "Error adding driving lesson schedule slot" },
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

    let schedule = instructor.schedule_driving_lesson || [];
    
    // Filter by class type if specified
    if (classType) {
      schedule = schedule.filter((slot: any) => slot.classType === classType);
    }

    return NextResponse.json(schedule, { status: 200 });

  } catch (error) {
    console.error("Error fetching driving lesson schedule:", error);
    return NextResponse.json(
      { message: "Error fetching driving lesson schedule" },
      { status: 500 }
    );
  }
} 