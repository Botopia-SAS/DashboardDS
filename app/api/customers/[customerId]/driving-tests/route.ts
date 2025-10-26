import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/")[3]; // /api/customers/[customerId]/driving-tests

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }


    // Find all instructors with driving tests for this student
    // Note: We need to find all instructors and filter manually because studentId might be stored as string
    const instructors = await Instructor.find({
      schedule_driving_test: { $exists: true, $ne: [] }
    }).lean();


    const drivingTests: any[] = [];

    // Extract driving tests for this student
    instructors.forEach((instructor) => {
      if (
        instructor.schedule_driving_test &&
        Array.isArray(instructor.schedule_driving_test)
      ) {
        instructor.schedule_driving_test.forEach((slot: any) => {
          // Compare as strings to handle both ObjectId and string formats
          const slotStudentId = slot.studentId?.toString();
          const targetCustomerId = customerId.toString();

          if (slot && slotStudentId === targetCustomerId) {

            drivingTests.push({
              _id: slot._id || `${instructor._id}_${slot.date}_${slot.start}`,
              instructorName: instructor.name,
              instructorId: instructor._id,
              date: slot.date,
              startTime: slot.start,
              endTime: slot.end,
              status: slot.status || "available",
              amount: slot.amount,
              paid: slot.paid || false,
              studentName: slot.studentName,
            });
          }
        });
      }
    });

    // Sort by date descending
    drivingTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    return NextResponse.json(drivingTests, { status: 200 });
  } catch (error) {
    console.error("Error fetching driving tests:", error);
    return NextResponse.json(
      {
        error: "Error fetching driving tests",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
