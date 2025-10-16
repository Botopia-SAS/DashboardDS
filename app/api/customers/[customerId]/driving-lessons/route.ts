import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/")[3]; // /api/customers/[customerId]/driving-lessons

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Searching for driving lessons for customer:", customerId);

    // Find all instructors with driving lessons for this student
    // Note: We need to find all instructors and filter manually because studentId might be stored as string
    const instructors = await Instructor.find({
      schedule_driving_lesson: { $exists: true, $ne: [] }
    }).lean();

    console.log(`📚 Found ${instructors.length} instructors with driving lessons`);

    const drivingLessons: any[] = [];

    // Extract driving lessons for this student
    instructors.forEach((instructor) => {
      if (
        instructor.schedule_driving_lesson &&
        Array.isArray(instructor.schedule_driving_lesson)
      ) {
        instructor.schedule_driving_lesson.forEach((slot: any) => {
          // Compare as strings to handle both ObjectId and string formats
          const slotStudentId = slot.studentId?.toString();
          const targetCustomerId = customerId.toString();

          if (slot && slotStudentId === targetCustomerId) {
            console.log("✅ Found driving lesson match:", {
              instructor: instructor.name,
              date: slot.date,
              studentId: slotStudentId
            });
            drivingLessons.push({
              _id: slot._id || `${instructor._id}_${slot.date}_${slot.start}`,
              instructorName: instructor.name,
              instructorId: instructor._id,
              date: slot.date,
              startTime: slot.start,
              endTime: slot.end,
              status: slot.status || "available",
              classType: slot.classType,
              pickupLocation: slot.pickupLocation,
              dropoffLocation: slot.dropoffLocation,
              selectedProduct: slot.selectedProduct,
              amount: slot.amount,
              paid: slot.paid || false,
              studentName: slot.studentName,
            });
          }
        });
      }
    });

    // Sort by date descending
    drivingLessons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`✅ Returning ${drivingLessons.length} driving lessons for customer`);

    return NextResponse.json(drivingLessons, { status: 200 });
  } catch (error) {
    console.error("Error fetching driving lessons:", error);
    return NextResponse.json(
      {
        error: "Error fetching driving lessons",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
