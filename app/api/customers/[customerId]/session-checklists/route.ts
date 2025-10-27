import SessionChecklist from "@/lib/models/SessionChecklist";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface ChecklistItem {
  rating?: number;
}

interface InstructorData {
  _id: string;
  name: string;
  email: string;
}

const calculateProgress = (items: ChecklistItem[]): number => {
  if (items.length === 0) return 0;

  const itemsWithRating = items.filter(
    (item) => item.rating !== undefined && item.rating !== null && item.rating > 0
  );

  return Math.round((itemsWithRating.length / items.length) * 100);
};

const calculateAverageRating = (items: ChecklistItem[]): string => {
  if (items.length === 0) return "0.0";

  const totalRating = items.reduce(
    (sum: number, item) => sum + (item.rating ?? 0),
    0
  );

  return (totalRating / items.length).toFixed(1);
};

const buildStudentQuery = (customerId: string) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return { studentId: customerId };
  }

  return {
    $or: [
      { studentId: customerId },
      { studentId: new mongoose.Types.ObjectId(customerId) }
    ]
  };
};

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const customerId = req.nextUrl.pathname.split("/")[3];

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const query = buildStudentQuery(customerId);

    const checklists = await SessionChecklist.find(query)
      .populate("instructorId", "name email")
      .lean()
      .sort({ createdAt: -1 });

    const checklistsWithProgress = checklists.map((checklist) => {
      const progress = calculateProgress(checklist.items);
      const averageRating = calculateAverageRating(checklist.items);
      const instructor = checklist.instructorId as unknown as InstructorData | null;

      return {
        _id: checklist._id,
        checklistType: checklist.checklistType,
        sessionId: checklist.sessionId,
        studentId: checklist.studentId,
        instructorId: instructor?._id,
        instructorName: instructor?.name || "Unknown",
        instructorEmail: instructor?.email,
        items: checklist.items,
        notes: checklist.notes || [],
        status: checklist.status || "pending",
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
