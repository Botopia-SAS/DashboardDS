import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor"; // Modelo de MongoDB

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectToDB();
    const {
      name,
      dni,
      photo,
      certifications,
      experience,
      schedule,
    }: {
      name: string;
      dni: string;
      photo: string;
      certifications: string[];
      experience: string;
      schedule: {
        date: string;
        slots: { start: string; end: string; booked?: boolean }[];
      }[];
    } = await req.json();

    const newInstructor = new Instructor({
      name,
      dni,
      photo,
      certifications,
      experience,
      schedule: schedule.map(
        (day: {
          date: string;
          slots: { start: string; end: string; booked?: boolean }[];
        }) => ({
          date: day.date,
          slots: day.slots.map((slot) => ({
            start: slot.start,
            end: slot.end,
            booked: slot.booked || false, // ✅ Guardar `booked`
          })),
        })
      ),
    });

    await newInstructor.save();
    return NextResponse.json(newInstructor, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating instructor" },
      { status: 500 }
    );
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
    const { instructorId, ...updates } = await req.json();

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      { $set: updates },
      { new: true }
    );

    if (!updatedInstructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (error) {
    console.error("❌ Error al actualizar instructor:", error);
    return NextResponse.json(
      { message: "Error updating instructor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDB();

    const { instructorId } = await req.json();
    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);

    if (!deletedInstructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Instructor deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al eliminar instructor:", error);
    return NextResponse.json(
      { message: "Error deleting instructor" },
      { status: 500 }
    );
  }
}
