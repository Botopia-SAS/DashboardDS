import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import { Schema } from "mongoose";

export const dynamic = "force-dynamic";

interface StudentEntry {
  studentId?: Schema.Types.ObjectId | string;
  _id?: Schema.Types.ObjectId;
}

interface PopulatedTicketClass {
  _id: Schema.Types.ObjectId;
  students?: unknown[];
  classId?: {
    _id?: Schema.Types.ObjectId;
    title?: string;
  };
  locationId?: {
    _id?: Schema.Types.ObjectId;
    title?: string;
  };
  date: Date;
  hour?: string;
  endHour?: string;
  duration?: number | string;
  type?: string;
  status?: string;
  spots?: number;
  createdAt?: Date;
  updatedAt?: Date;
  instructorId?: Schema.Types.ObjectId;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/")[3]; // /api/customers/[customerId]/classes

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }


    // Find all ticket classes with students
    const allTicketClasses = await TicketClass.find({
      students: { $exists: true, $ne: [] }
    })
      .populate("classId", "_id title")
      .populate("locationId", "_id title")
      .sort({ date: -1 })
      .lean();


    // Filter classes where the student is enrolled
    const ticketClasses = (allTicketClasses as unknown as PopulatedTicketClass[]).filter((ticketClass) => {
      if (!ticketClass.students || !Array.isArray(ticketClass.students)) {
        return false;
      }

      // Check if customerId is in the students array
      return ticketClass.students.some((student: unknown) => {
        // Handle both string IDs and object format
        if (typeof student === "string") {
          const match = student === customerId || student.toString() === customerId;
          if (match) {

          }
          return match;
        } else if (student && typeof student === "object") {
          const studentEntry = student as StudentEntry;
          const match = studentEntry.studentId === customerId || String(studentEntry.studentId) === customerId;
          if (match) {

          }
          return match;
        }
        return false;
      });
    });


    // Transform the data to include class and location names
    const enrichedClasses = ticketClasses.map((ticketClass) => ({
      _id: ticketClass._id,
      className: ticketClass.classId?.title || "Unknown Class",
      classIdRef: ticketClass.classId?._id,
      locationName: ticketClass.locationId?.title || "Unknown Location",
      locationIdRef: ticketClass.locationId?._id,
      date: ticketClass.date,
      hour: ticketClass.hour,
      endHour: ticketClass.endHour,
      duration: ticketClass.duration,
      type: ticketClass.type,
      status: ticketClass.status,
      spots: ticketClass.spots,
      createdAt: ticketClass.createdAt,
      updatedAt: ticketClass.updatedAt,
    }));

    return NextResponse.json(enrichedClasses, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer classes:", error);
    return NextResponse.json(
      {
        error: "Error fetching customer classes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
