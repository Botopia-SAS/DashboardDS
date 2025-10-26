import SessionChecklist from "@/lib/models/SessionChecklist";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - Fetch a specific checklist by ID
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const checklistId = searchParams.get("id");
    const sessionId = searchParams.get("sessionId");

    if (!checklistId && !sessionId) {
      return NextResponse.json(
        { error: "Checklist ID or Session ID is required" },
        { status: 400 }
      );
    }

    let checklist;
    if (checklistId) {
      checklist = await SessionChecklist.findById(checklistId)
        .populate("instructorId", "name email")
        .populate("studentId", "name email")
        .lean();
    } else if (sessionId) {
      checklist = await SessionChecklist.findOne({ sessionId })
        .populate("instructorId", "name email")
        .populate("studentId", "name email")
        .lean();
    }

    if (!checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(checklist, { status: 200 });
  } catch (error) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json(
      {
        error: "Error fetching checklist",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST - Create a new checklist
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();

    const {
      checklistType,
      sessionId,
      studentId,
      instructorId,
      items,
      notes,
      status,
    } = body;

    // Validate required fields
    if (!checklistType || !sessionId || !studentId || !instructorId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: checklistType, sessionId, studentId, instructorId",
        },
        { status: 400 }
      );
    }

    // Check if checklist already exists for this session
    const existingChecklist = await SessionChecklist.findOne({ sessionId });
    if (existingChecklist) {
      return NextResponse.json(
        { error: "Checklist already exists for this session" },
        { status: 409 }
      );
    }

    // Create new checklist
    const newChecklist = new SessionChecklist({
      checklistType,
      sessionId,
      studentId,
      instructorId,
      items: items || [],
      notes: notes || [],
      status: status || "pending",
    });

    await newChecklist.save();


    return NextResponse.json(newChecklist, { status: 201 });
  } catch (error) {
    console.error("Error creating checklist:", error);
    return NextResponse.json(
      {
        error: "Error creating checklist",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing checklist
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();

    const { checklistId, items, notes, status } = body;

    if (!checklistId) {
      return NextResponse.json(
        { error: "Checklist ID is required" },
        { status: 400 }
      );
    }

    // Find and update the checklist
    const updateData: Record<string, unknown> = {};
    if (items !== undefined) updateData.items = items;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const updatedChecklist = await SessionChecklist.findByIdAndUpdate(
      checklistId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("instructorId", "name email")
      .populate("studentId", "name email");

    if (!updatedChecklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }


    return NextResponse.json(updatedChecklist, { status: 200 });
  } catch (error) {
    console.error("Error updating checklist:", error);
    return NextResponse.json(
      {
        error: "Error updating checklist",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a checklist
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const checklistId = searchParams.get("id");

    if (!checklistId) {
      return NextResponse.json(
        { error: "Checklist ID is required" },
        { status: 400 }
      );
    }

    const deletedChecklist = await SessionChecklist.findByIdAndDelete(
      checklistId
    );

    if (!deletedChecklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }


    return NextResponse.json(
      { message: "Checklist deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting checklist:", error);
    return NextResponse.json(
      {
        error: "Error deleting checklist",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
