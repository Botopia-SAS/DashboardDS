import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import TicketClass from "@/lib/models/TicketClass";

export async function POST() {
  try {
    await connectToDB();
    
    console.log("🔧 Starting index migration for TicketClass...");
    
    // Get the collection
    const collection = TicketClass.collection;
    
    // Get existing indexes
    const existingIndexes = await collection.indexes();
    console.log("📋 Current indexes:", existingIndexes.map(idx => idx.name));
    
    // Drop problematic unique indexes if they exist
    const indexesToDrop = [
      "date_1_hour_1",
      "date_1_hour_1_students_1"
    ];
    
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`⚠️ Index ${indexName} not found or already dropped`);
      }
    }
    
    // Create the new index that includes instructorId
    try {
      await collection.createIndex(
        { date: 1, hour: 1, instructorId: 1 },
        { unique: true, name: "date_hour_instructor_unique" }
      );
      console.log("✅ Created new unique index: date_hour_instructor_unique");
    } catch (error) {
      console.log("⚠️ New index already exists or error creating:", error);
    }
    
    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log("📋 Final indexes:", finalIndexes.map(idx => idx.name));
    
    return NextResponse.json({ 
      success: true, 
      message: "Index migration completed successfully",
      indexes: finalIndexes.map(idx => idx.name)
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