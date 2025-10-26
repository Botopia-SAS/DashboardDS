import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import Certificate from "@/lib/models/Certificate";

export async function GET() {
  try {
    await connectToDB();

    console.log("🔧 Starting index migration for Certificate collection...");

    // Get the collection
    const collection = Certificate.collection;

    // Get existing indexes
    const existingIndexes = await collection.indexes();
    console.log("📋 Current indexes:", existingIndexes);

    // Find and drop the unique index on the 'number' field
    const droppedIndexes = [];
    const notFoundIndexes = [];

    for (const index of existingIndexes) {
      // Skip the _id index as it's required by MongoDB
      if (index.name === '_id_' || !index.name) {
        console.log(`⏭️ Skipping required _id index`);
        continue;
      }

      // Look for indexes on the 'number' field
      if (index.key && index.key.number !== undefined) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name} on field: number`);
          droppedIndexes.push(index.name);
        } catch (error) {
          console.log(`⚠️ Could not drop index ${index.name}:`, error);
          notFoundIndexes.push(index.name);
        }
      }
    }

    console.log("✅ Removed unique constraint from certificate number field");

    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log("📋 Final indexes:", finalIndexes);

    return NextResponse.json({
      success: true,
      message: "Index migration completed successfully",
      initialIndexes: existingIndexes.map(idx => ({ name: idx.name, keys: idx.key, unique: idx.unique })),
      droppedIndexes,
      notFoundIndexes,
      finalIndexes: finalIndexes.map(idx => ({ name: idx.name, keys: idx.key, unique: idx.unique }))
    });

  } catch (error) {
    console.error("Error in index migration:", error);
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
