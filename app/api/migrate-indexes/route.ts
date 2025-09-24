import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TicketClass from '@/lib/models/TicketClass';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get the collection
    const collection = TicketClass.collection;

    console.log('Starting index migration...');

    // Get all existing indexes
    const existingIndexes = await collection.listIndexes().toArray();
    console.log('Existing indexes:', existingIndexes.map(i => i.name));

    // Drop problematic indexes
    const indexesToDrop = [
      'date_1_hour_1',
      'date_1_hour_1_students.id_1'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`Index ${indexName} does not exist or already dropped`);
      }
    }

    // Create new index that includes instructorId
    try {
      await collection.createIndex(
        { date: 1, hour: 1, instructorId: 1 },
        { unique: true, name: 'date_hour_instructor_unique' }
      );
      console.log('Created new unique index: date_hour_instructor_unique');
    } catch (error) {
      console.log('Index might already exist:', error instanceof Error ? error.message : String(error));
    }

    // List final indexes
    const finalIndexes = await collection.listIndexes().toArray();
    console.log('Final indexes:', finalIndexes.map(i => i.name));

    return NextResponse.json({
      success: true,
      message: 'Indexes migrated successfully',
      droppedIndexes: indexesToDrop,
      createdIndex: 'date_hour_instructor_unique',
      finalIndexes: finalIndexes.map(i => i.name)
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}