import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
// import Location from "@/lib/models/Locations";
// import DrivingClass from "@/lib/models/Class";
import { connectToDB } from "@/lib/mongoDB";

export async function GET() {
  try {
    await connectToDB();
    
    // Obtener todas las ticket classes con datos populados
    const ticketClasses = await TicketClass.find({})
      .populate('locationId', 'title')
      .populate('classId', 'title')
      .lean();
    
    return NextResponse.json(ticketClasses);
  } catch (error) {
    console.error('❌ Error fetching ticket classes:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket classes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await connectToDB();
  const data = await req.json();
  // Solo permitimos los campos válidos
  const {
    locationId,
    date,
    hour,
    endHour,
    classId,
    type,
    duration,
    students,
    spots,
    status,
    studentRequests,
  } = data;
  const ticketClass = await TicketClass.create({
    locationId,
    date,
    hour,
    endHour,
    classId,
    type,
    duration,
    students: students || [],
    spots: spots || 30,
    status: status || "available",
    studentRequests: studentRequests || [],
  });
  return NextResponse.json(ticketClass, { status: 201 });
} 