import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import TicketClass from "@/lib/models/TicketClass";

export async function GET() {
  try {
    await connectToDB();

    console.log("🔧 Starting index migration for TicketClass...");

    // Get the collection
    const collection = TicketClass.collection;

    // Get existing indexes
    const existingIndexes = await collection.indexes();
    console.log("📋 Current indexes:", existingIndexes);

    // Drop ALL unique indexes except _id - we want to allow multiple classes at the same time
    const droppedIndexes = [];
    const notFoundIndexes = [];

    for (const index of existingIndexes) {
      // Skip the _id index as it's required by MongoDB
      if (index.name === '_id_') {
        console.log(`⏭️ Skipping required _id index`);
        continue;
      }

      // Drop any other index (unique or not) to clean up
      try {
        await collection.dropIndex(index.name);
        console.log(`✅ Dropped index: ${index.name}`);
        droppedIndexes.push(index.name);
      } catch (error) {
        console.log(`⚠️ Could not drop index ${index.name}:`, error);
        notFoundIndexes.push(index.name);
      }
    }

    // No need to create new unique indexes - we allow multiple classes at the same time now
    console.log("✅ Removed instructor-based constraints - tickets are now open for scheduling");

    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log("📋 Final indexes:", finalIndexes);

    return NextResponse.json({
      success: true,
      message: "Index migration completed successfully",
      initialIndexes: existingIndexes.map(idx => ({ name: idx.name, keys: idx.key })),
      droppedIndexes,
      notFoundIndexes,
      finalIndexes: finalIndexes.map(idx => ({ name: idx.name, keys: idx.key }))
    });

  } catch (error) {
    console.error("❌ Error during index migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to migrate indexes",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}