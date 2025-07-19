import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await connectToDB();
    // console.log("🔗 Conectado a MongoDB");

    // Buscar todos los instructores
    const instructors = await Instructor.find({});
    // console.log(`📋 Encontrados ${instructors.length} instructores`);

    let updatedCount = 0;

    for (const instructor of instructors) {
      const updates: any = {};
      let needsUpdate = false;

      // Verificar si faltan los nuevos campos
      if (typeof instructor.canTeachTicketClass === 'undefined') {
        updates.canTeachTicketClass = false;
        needsUpdate = true;
      }

      if (typeof instructor.canTeachDrivingTest === 'undefined') {
        updates.canTeachDrivingTest = false;
        needsUpdate = true;
      }

      if (typeof instructor.canTeachDrivingLesson === 'undefined') {
        updates.canTeachDrivingLesson = false;
        needsUpdate = true;
      }

      // Eliminar campos antiguos si existen
      if (instructor.schedule_driving_test !== undefined) {
        updates.$unset = { schedule_driving_test: 1 };
        needsUpdate = true;
      }

      if (instructor.schedule_driving_lesson !== undefined) {
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.schedule_driving_lesson = 1;
        needsUpdate = true;
      }

      if (needsUpdate) {
        // console.log(`🔄 Actualizando instructor: ${instructor.name} (${instructor._id})`);
        
        await Instructor.findByIdAndUpdate(
          instructor._id,
          updates,
          { new: true }
        );
        
        updatedCount++;
        // console.log(`✅ Instructor actualizado: ${instructor.name}`);
      } else {
        // console.log(`✅ Instructor ya actualizado: ${instructor.name}`);
      }
    }

    // console.log(`🎉 Migración completada. ${updatedCount} instructores actualizados.`);

    return NextResponse.json({ 
      message: "Migration completed successfully",
      totalInstructors: instructors.length,
      updatedCount 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("❌ Error durante la migración:", error);
    return NextResponse.json({ 
      message: "Error during migration",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 