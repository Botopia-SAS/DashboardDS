import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor"; // Modelo de MongoDB   

export const dynamic = "force-dynamic";

function isValidSlot(slot: any) {
  return slot && slot.date && slot.start && slot.end;
}

export async function POST(req: Request) {
    try {
        await connectToDB();
        const { name, photo, certifications, experience, schedule }: { name: string, photo: string, certifications: string[], experience: string, schedule: any[] } = await req.json();

        // Log para depuración
        console.log("SCHEDULE RECIBIDO EN POST:", JSON.stringify(schedule, null, 2));

        // Solo slots válidos
        const validSchedule = Array.isArray(schedule)
          ? schedule.filter(isValidSlot)
          : [];

        const newInstructor = new Instructor({
            name,
            photo,
            certifications,
            experience,
            schedule: validSchedule,
        });

        await newInstructor.save();
        return NextResponse.json(newInstructor, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error creating instructor" }, { status: 500 });
    }
}

export const GET = async () => {
  try {
    await connectToDB();

    const instructors = await Instructor.find().sort({ createdAt: "desc" });

    return NextResponse.json(instructors, { status: 200 });
  } catch (err) {
    console.log("[INSTRUCTORS_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export async function PATCH(req: Request) {
    try {
        await connectToDB();
        const { instructorId, schedule: newSchedule, ...updates } = await req.json();

        if (!instructorId) {
            return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
        }

        // Log para depuración
        console.log("SCHEDULE RECIBIDO EN PATCH:", JSON.stringify(newSchedule, null, 2));

        // Solo slots válidos
        const validSchedule = Array.isArray(newSchedule)
          ? newSchedule.filter(isValidSlot)
          : [];

        // Logs de depuración
        console.log("UPDATES:", updates);

        // Reemplaza el schedule por el nuevo array plano
        const updatedInstructor = await Instructor.findByIdAndUpdate(
            instructorId,
            { $set: { ...updates, schedule: validSchedule } },
            { new: true }
        );

        if (!updatedInstructor) {
            return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
        }

        return NextResponse.json(updatedInstructor, { status: 200 });
    } catch (error) {
        console.error("❌ Error al actualizar instructor:", error);
        return NextResponse.json({ message: "Error updating instructor" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectToDB();
        
        const { instructorId } = await req.json();
        if (!instructorId) {
            return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
        }

        const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);

        if (!deletedInstructor) {
            return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Instructor deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al eliminar instructor:", error);
        return NextResponse.json({ message: "Error deleting instructor" }, { status: 500 });
    }
}
