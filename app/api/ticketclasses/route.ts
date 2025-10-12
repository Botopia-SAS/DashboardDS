import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoDB';
import TicketClass from '@/lib/models/TicketClass';

export async function GET() {
  try {
    // Conectar a la base de datos
    await connectToDB();
    
    // Obtener todas las clases con studentRequests que no estén vacías
    const ticketClasses = await TicketClass.find({
      studentRequests: { $exists: true, $not: { $size: 0 } }
    }).lean();

    return NextResponse.json({
      success: true,
      data: ticketClasses,
      count: ticketClasses.length
    });

  } catch (error) {
    console.error('Error fetching ticket classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error fetching ticket classes data',
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}