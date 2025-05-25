import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({}, { strict: false });
const Faq = mongoose.models.Faq || mongoose.model("Faq", FaqSchema, "faq");

export async function GET() {
  await connectToDB();
  const doc = await Faq.findOne();
  if (!doc) {
    return NextResponse.json({ drivinglessons: [], advancedDrivingImprovementCourse: [] });
  }
  return NextResponse.json({
    drivinglessons: doc.drivingLessons || [],
    advancedDrivingImprovementCourse: doc.advancedDrivingImprovementCourse || [],
  });
}

export async function PUT(req: Request) {
  await connectToDB();
  const data = await req.json();

  // Actualiza el primer documento encontrado, o crea uno si no existe
  await Faq.findOneAndUpdate(
    {},
    {
      $set: {
        drivingLessons: data.drivinglessons || [],
        advancedDrivingImprovementCourse: data.advancedDrivingImprovementCourse || [],
      },
      $unset: { drivinglessons: "" }, // Elimina el campo viejo si existe
    },
    { new: true, upsert: true }
  );

  return NextResponse.json({ success: true });
} 