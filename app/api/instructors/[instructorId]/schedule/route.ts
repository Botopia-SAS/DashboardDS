import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import { connectToDB } from "@/lib/mongoDB";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest, context: { params: Promise<{ instructorId: string }> }) {
  await connectToDB();
  const { instructorId } = await context.params;
  const { slotId } = await req.json(); // slotId es el _id del slot dentro de schedule

  if (!instructorId || !slotId) {
    return NextResponse.json({ error: "instructorId and slotId are required" }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(instructorId)) {
    return NextResponse.json({ error: "Invalid instructorId" }, { status: 400 });
  }

  try {
    // Elimina el slot del schedule usando el slotId del slot (UUID)
    const updateResult = await Instructor.updateOne(
      { _id: instructorId },
      { $pull: { schedule: { slotId: slotId } } }
    );
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: "Slot not found or not deleted" }, { status: 404 });
    }
    return NextResponse.json({ message: "Slot deleted from instructor schedule" });
  } catch (err) {
    console.error("[DELETE instructor schedule] Error:", err);
    return NextResponse.json({ error: "Error deleting slot from schedule" }, { status: 500 });
  }
}
