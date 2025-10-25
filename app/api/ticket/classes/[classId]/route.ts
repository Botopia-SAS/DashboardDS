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
        (id: any) => id.toString() !== studentId
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
        (id: any) => id.toString() !== studentId
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();

    const { classId } = await params;
    const body = await request.json();

    console.log('🎫 PUT ticket class:', { classId, body });

    // Validar que el classId sea válido
    if (!classId) {
      return NextResponse.json(
        { success: false, message: "Class ID is required" },
        { status: 400 }
      );
    }

    // Buscar la clase existente
    const ticketClass = await TicketClass.findById(classId);

    if (!ticketClass) {
      return NextResponse.json(
        { success: false, message: "Ticket class not found" },
        { status: 404 }
      );
    }

    // Validar campos requeridos
    const requiredFields = ['date', 'hour', 'endHour', 'classId', 'type', 'locationId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validar que la hora de fin sea posterior a la hora de inicio
    if (body.hour >= body.endHour) {
      return NextResponse.json(
        { success: false, message: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Actualizar los campos de la clase
    const updateData = {
      date: body.date,
      hour: body.hour,
      endHour: body.endHour,
      classId: body.classId,
      type: body.type,
      locationId: body.locationId,
      spots: body.spots || ticketClass.spots,
      duration: body.duration || ticketClass.duration,
      status: body.status || ticketClass.status,
      // Asegurar que students y studentRequests sean arrays válidos
      students: Array.isArray(body.students) ? body.students.filter((s: unknown) => typeof s === 'string') : ticketClass.students || [],
      studentRequests: Array.isArray(body.studentRequests) ? body.studentRequests.filter((req: unknown) => typeof req === 'string') : ticketClass.studentRequests || []
    };

    // Actualizar la clase
    const updatedClass = await TicketClass.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return NextResponse.json(
        { success: false, message: "Failed to update ticket class" },
        { status: 500 }
      );
    }

    console.log('✅ Ticket class updated successfully');

    // Broadcast notification to update counters
    await broadcastNotification('ticket', {
      action: 'class_updated',
      classId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Ticket class updated successfully",
      data: updatedClass
    });

  } catch (error) {
    console.error("Error in PUT ticket class:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    await dbConnect();

    const { classId } = await params;

    console.log('🗑️ DELETE ticket class:', { classId });

    // Validar que el classId sea válido
    if (!classId) {
      return NextResponse.json(
        { success: false, message: "Class ID is required" },
        { status: 400 }
      );
    }

    // Buscar la clase existente
    const ticketClass = await TicketClass.findById(classId);

    if (!ticketClass) {
      return NextResponse.json(
        { success: false, message: "Ticket class not found" },
        { status: 404 }
      );
    }

    // Eliminar la clase
    await TicketClass.findByIdAndDelete(classId);

    console.log('✅ Ticket class deleted successfully');

    // Broadcast notification to update counters
    await broadcastNotification('ticket', {
      action: 'class_deleted',
      classId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Ticket class deleted successfully"
    });

  } catch (error) {
    console.error("Error in DELETE ticket class:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}