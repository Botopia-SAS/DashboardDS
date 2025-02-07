import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor"; // Modelo de MongoDB   

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        await connectToDB();
        const { name, photo, certifications, experience, schedule }: { name: string, photo: string, certifications: string[], experience: string, schedule: { date: string, slots: { start: string, end: string, booked?: boolean }[] }[] } = await req.json();

        const newInstructor = new Instructor({
            name,
            photo,
            certifications,
            experience,
            schedule: schedule.map((day: { date: string, slots: { start: string, end: string, booked?: boolean }[] }) => ({
                date: day.date,
                slots: day.slots.map(slot => ({
                    start: slot.start,
                    end: slot.end,
                    booked: slot.booked || false, // ✅ Guardar `booked`
                }))
            }))
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
export async function PUT(req: Request) {
    try {
        await connectToDB();
        const { id, name, photo, certifications, experience, schedule } = await req.json();

        const updatedInstructor = await Instructor.findByIdAndUpdate(
            id,
            {
                name,
                photo,
                certifications,
                experience,
                schedule: schedule.map((day: { date: string, slots: { start: string, end: string, booked?: boolean }[] }) => ({
                    date: day.date,
                    slots: day.slots.map(slot => ({
                        start: slot.start,
                        end: slot.end,
                        booked: slot.booked || false, // ✅ Asegurar que se guarde
                    }))
                }))
            },
            { new: true }
        );

        return NextResponse.json(updatedInstructor, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error updating instructor" }, { status: 500 });
    }
}

