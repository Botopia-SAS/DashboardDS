import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoDB';
import TicketClass from '@/lib/models/TicketClass';

export async function GET() {
  try {
    await connectToDB();
    
    // Get all indexes from the collection
    const indexes = await TicketClass.collection.listIndexes().toArray();
    
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      indexes: indexes.map(index => ({
        name: index.name,
        key: index.key,
        unique: index.unique || false,
        sparse: index.sparse || false
      }))
    });
  } catch (error) {
    console.error('Error checking indexes:', error);
    return NextResponse.json({ error: 'Failed to check indexes' }, { status: 500 });
  }
}