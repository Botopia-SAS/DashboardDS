import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TicketClass from "@/lib/models/TicketClass";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();
    
    const { classId } = await params;
    const ticketClass = await TicketClass.findById(classId);
    
    if (!ticketClass) {
      return NextResponse.json(
        { success: false, message: "Ticket class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticketClass
    });
  } catch (error) {
    console.error("Error fetching ticket class:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}