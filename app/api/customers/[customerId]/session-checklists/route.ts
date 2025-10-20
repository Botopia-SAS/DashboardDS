import SessionChecklist from "@/lib/models/SessionChecklist";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const customerId = req.nextUrl.pathname.split("/")[3]; // /api/customers/[customerId]/session-checklists

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Searching for session checklists for customer:", customerId);

    // Find all checklists for this student
    const checklists = await SessionChecklist.find({
      studentId: customerId,
    })
      .populate("instructorId", "name email")
      .lean()
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${checklists.length} session checklists for customer`);

    // Calculate progress for each checklist
    const checklistsWithProgress = checklists.map((checklist) => {
      const itemsWithRating = checklist.items.filter(
        (item) => item.rating !== undefined && item.rating !== null && item.rating > 0
      );
      const progress =
        checklist.items.length > 0
          ? Math.round((itemsWithRating.length / checklist.items.length) * 100)
          : 0;

      // Calculate average rating
      const totalRating = checklist.items.reduce(
        (sum: number, item) => sum + (item.rating ?? 0),
        0
      );
      const averageRating =
        checklist.items.length > 0
          ? (totalRating / checklist.items.length).toFixed(1)
          : "0.0";

      // Type assertion for populated instructorId
      const instructor = checklist.instructorId as unknown as { _id: string; name: string; email: string } | null;

      return {
        _id: checklist._id,
        checklistType: checklist.checklistType,
        sessionId: checklist.sessionId,
        studentId: checklist.studentId,
        instructorId: instructor?._id,
        instructorName: instructor?.name || "Unknown",
        instructorEmail: instructor?.email,
        items: checklist.items,
        notes: checklist.notes,
        status: checklist.status,
        createdAt: checklist.createdAt,
        updatedAt: checklist.updatedAt,
        progress,
        averageRating,
      };
    });

    return NextResponse.json(checklistsWithProgress, { status: 200 });
  } catch (error) {
    console.error("Error fetching session checklists:", error);
    return NextResponse.json(
      {
        error: "Error fetching session checklists",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
