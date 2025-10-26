import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import Certificate from "@/lib/models/Certificate";

export async function GET() {
  try {
    await connectToDB();


    // Get the collection
    const collection = Certificate.collection;

    // Get existing indexes
    const existingIndexes = await collection.indexes();

    // Find and drop the unique index on the 'number' field
    const droppedIndexes = [];
    const notFoundIndexes = [];

    for (const index of existingIndexes) {
      // Skip the _id index as it's required by MongoDB
      if (index.name === '_id_' || !index.name) {

        continue;
      }

      // Look for indexes on the 'number' field
      if (index.key && index.key.number !== undefined) {
        try {
          await collection.dropIndex(index.name);

          droppedIndexes.push(index.name);
        } catch (error) {

          notFoundIndexes.push(index.name);
        }
      }
    }


    // List final indexes
    const finalIndexes = await collection.indexes();

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
