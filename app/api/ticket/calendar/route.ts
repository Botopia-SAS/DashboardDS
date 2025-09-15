import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
import Location from "@/lib/models/Locations";
import DrivingClass from "@/lib/models/Class";
import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";

export async function GET() {
  try {
    await connectToDB();
    
    console.log('🔄 Fetching ticket classes for calendar...');
    
    // Obtener todas las ticket classes con datos populados
    const ticketClasses = await TicketClass.find({})
      .populate('locationId', 'title')
      .populate('classId', 'title')
      .populate('instructorId', 'name')
      .lean();
    
    console.log('📊 Found ticket classes:', ticketClasses.length);
    
    // Agregar logs para debugging
    if (ticketClasses.length > 0) {
      console.log('📋 First ticket class sample:', ticketClasses[0]);
    }
    
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
    instructorId,
  } = data;
  if (!instructorId) {
    return NextResponse.json({ error: 'instructorId is required' }, { status: 400 });
  }
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
    instructorId,
  });
  return NextResponse.json(ticketClass, { status: 201 });
} 