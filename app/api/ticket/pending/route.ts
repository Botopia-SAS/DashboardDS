import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";

export async function GET() {
  try {
    await connectToDB();
    
    // Obtener todas las ticket classes que tienen studentRequests pendientes
    const ticketClasses = await TicketClass.find({
      studentRequests: { $exists: true, $not: { $size: 0 } }
    }).lean();

    const pendingRequests = [];

    for (const ticketClass of ticketClasses) {
      if (ticketClass.studentRequests && ticketClass.studentRequests.length > 0) {
        for (const request of ticketClass.studentRequests) {
          // Si el request es un objeto con _id, usar sus propiedades
          if (typeof request === 'object' && request !== null && '_id' in request) {
            pendingRequests.push({
              requestId: (request as any)._id.toString(),
              ticketClassId: ticketClass._id.toString(),
              studentId: (request as any).studentId || (request as any).student_id,
              date: ticketClass.date,
              hour: ticketClass.hour,
              endHour: ticketClass.endHour,
              classType: ticketClass.type,
              requestDate: (request as any).requestDate || (request as any).createdAt,
              status: (request as any).status || 'pending'
            });
          }
        }
      }
    }

    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching pending ticket requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending ticket requests' },
      { status: 500 }
    );
  }
}
