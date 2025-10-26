import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST() {
  try {
    await connectToDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database connection not established" },
        { status: 500 }
      );
    }

    const collection = db.collection("certificates");
    
    // Get all indexes
    const indexes = await collection.indexes();

    // Check if number_1 index exists
    const numberIndexExists = indexes.some(index => index.name === "number_1");
    
    if (numberIndexExists) {
      // Drop the unique index on the number field
      await collection.dropIndex("number_1");

      return NextResponse.json({
        success: true,
        message: "Unique index on 'number' field has been removed. Certificate numbers can now be duplicated.",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "No unique index found on 'number' field. Nothing to remove.",
      });
    }
  } catch (error) {
    console.error("Error removing index:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "An error occurred",
      },
      { status: 500 }
    );
  }
}
