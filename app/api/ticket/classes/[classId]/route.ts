import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TicketClass from "@/lib/models/TicketClass";
import { broadcastNotification } from "@/lib/notifications";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();

    const { classId } = await params;
    const body = await request.json();
    const { action, studentId, requestId } = body;

    console.log('🎫 PATCH ticket class:', { classId, action, studentId, requestId });

    const ticketClass = await TicketClass.findById(classId);

    if (!ticketClass) {
      return NextResponse.json(
        { success: false, message: "Ticket class not found" },
        { status: 404 }
      );
    }

    if (action === 'acceptRequest') {
      // Move student from studentRequests to students array
      if (!ticketClass.studentRequests || !ticketClass.studentRequests.includes(studentId)) {
        return NextResponse.json(
          { success: false, message: "Student request not found" },
          { status: 404 }
        );
      }

      // Remove from studentRequests
      ticketClass.studentRequests = ticketClass.studentRequests.filter(
        (id: string) => id !== studentId
      );

      // Add to students
      if (!ticketClass.students) {
        ticketClass.students = [];
      }
      if (!ticketClass.students.includes(studentId)) {
        ticketClass.students.push(studentId);
      }

      await ticketClass.save();
      console.log('✅ Student accepted and moved to students array');

      // Broadcast notification to update counters
      await broadcastNotification('ticket', {
        action: 'request_accepted',
        classId,
        studentId,
        timestamp: new Date().toISOString()
      });
      console.log('📧 Notification broadcast sent');

      return NextResponse.json({
        success: true,
        message: "Student request accepted"
      });

    } else if (action === 'rejectRequest') {
      // Remove student from studentRequests
      if (!ticketClass.studentRequests || !ticketClass.studentRequests.includes(studentId)) {
        return NextResponse.json(
          { success: false, message: "Student request not found" },
          { status: 404 }
        );
      }

      ticketClass.studentRequests = ticketClass.studentRequests.filter(
        (id: string) => id !== studentId
      );

      await ticketClass.save();
      console.log('✅ Student request rejected and removed');

      // Broadcast notification to update counters
      await broadcastNotification('ticket', {
        action: 'request_rejected',
        classId,
        studentId,
        timestamp: new Date().toISOString()
      });
      console.log('📧 Notification broadcast sent');

      return NextResponse.json({
        success: true,
        message: "Student request rejected"
      });

    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error in PATCH ticket class:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}