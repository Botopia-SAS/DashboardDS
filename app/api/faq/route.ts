import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({}, { strict: false });
const Faq = mongoose.models.Faq || mongoose.model("Faq", FaqSchema, "faq");

export async function GET() {
  await connectToDB();
  const doc = await Faq.findOne();
  if (!doc) {
    return NextResponse.json({
      sections: {
        drivinglessons: { label: "Driving Lessons", questions: [] },
        advancedDrivingImprovementCourse: { label: "Advanced Driving Improvement Course", questions: [] }
      }
    });
  }

  // Migrar datos legacy si existen
  const sections = doc.sections || {};

  // Manejar migración de datos legacy
  if (doc.drivingLessons && !sections.drivinglessons) {
    sections.drivinglessons = { label: "Driving Lessons", questions: doc.drivingLessons };
  }
  if (doc.advancedDrivingImprovementCourse && !sections.advancedDrivingImprovementCourse) {
    sections.advancedDrivingImprovementCourse = { label: "Advanced Driving Improvement Course", questions: doc.advancedDrivingImprovementCourse };
  }

  return NextResponse.json({ sections });
}

export async function PUT(req: Request) {
  await connectToDB();
  const data = await req.json();

  // Actualiza el primer documento encontrado, o crea uno si no existe
  await Faq.findOneAndUpdate(
    {},
    {
      $set: {
        sections: data.sections || {}
      },
      // Limpiar campos legacy
      $unset: {
        drivinglessons: "",
        drivingLessons: "",
        advancedDrivingImprovementCourse: ""
      }
    },
    { new: true, upsert: true }
  );

  return NextResponse.json({ success: true });
} 