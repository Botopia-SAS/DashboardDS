import TicketClass from "@/lib/models/TicketClass";
import DrivingClass from "@/lib/models/Class";
import Location from "@/lib/models/Locations";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    console.log("🔍 Searching for classes for customer:", customerId);

    // Find all ticket classes with students
    const allTicketClasses = await TicketClass.find({
      students: { $exists: true, $ne: [] }
    })
      .populate("classId", "_id title")
      .populate("locationId", "_id title")
      .sort({ date: -1 })
      .lean();

    console.log(`📚 Found ${allTicketClasses.length} total ticket classes with students`);

    // Filter classes where the student is enrolled
    const ticketClasses = allTicketClasses.filter((ticketClass: any) => {
      if (!ticketClass.students || !Array.isArray(ticketClass.students)) {
        return false;
      }

      // Check if customerId is in the students array
      return ticketClass.students.some((student: any) => {
        // Handle both string IDs and object format
        if (typeof student === "string") {
          const match = student === customerId || student.toString() === customerId;
          if (match) {
            console.log("✅ Found match in class:", ticketClass._id);
          }
          return match;
        } else if (student && typeof student === "object" && student.studentId) {
          const match = student.studentId === customerId || student.studentId.toString() === customerId;
          if (match) {
            console.log("✅ Found match (object format) in class:", ticketClass._id);
          }
          return match;
        }
        return false;
      });
    });

    console.log(`✅ Filtered to ${ticketClasses.length} classes for this customer`);

    // Transform the data to include class and location names
    const enrichedClasses = ticketClasses.map((ticketClass: any) => ({
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
