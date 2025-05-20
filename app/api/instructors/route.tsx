import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor"; // Modelo de MongoDB   
import bcrypt from "bcryptjs";
import { sendEmail } from './sendEmail';

export const dynamic = "force-dynamic";

function isValidSlot(slot: any) {
  return slot && slot.date && slot.start && slot.end;
}

export async function POST(req: Request) {
    try {
        await connectToDB();
        const body = await req.json();
        const { name, photo, certifications, experience, schedule, email, password, dni }: { name: string, photo: string, certifications: string[], experience: string, schedule: any[], email: string, password: string, dni: string } = body;

        if (!email || !password) {
            return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
        }

        // Solo slots válidos
        const validSchedule = Array.isArray(schedule)
          ? schedule.filter(isValidSlot)
          : [];

        // Encriptar password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newInstructor = new Instructor({
            name,
            photo,
            certifications,
            experience,
            schedule: validSchedule,
            email,
            password: hashedPassword,
            dni,
        });

        await newInstructor.save();
        return NextResponse.json(newInstructor, { status: 201 });
    } catch (error) {
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
        const { instructorId, schedule: newSchedule, password, email, dni, ...updates } = await req.json();

        if (!instructorId) {
            return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
        }
        if (!email || !dni) {
            return NextResponse.json({ message: "Email and DNI are required" }, { status: 400 });
        }

        // Solo slots válidos
        const validSchedule = Array.isArray(newSchedule)
          ? newSchedule.filter(isValidSlot)
          : [];

        // Construir el objeto de actualización SOLO con los campos que quieres cambiar
        const updateFields: any = { 
          ...updates, 
          schedule: validSchedule, 
          email: email ? email.trim() : undefined, 
          name: updates.name, 
          dni,
        };
        // Solo actualiza el password si viene y no es vacío
        let passwordChanged = false;
        if (typeof password === "string" && password.trim() !== "") {
          updateFields.password = await bcrypt.hash(password, 10);
          passwordChanged = true;
        }

        // Elimina campos vacíos explícitamente
        Object.keys(updateFields).forEach(
          (key) => (updateFields[key] === "" || updateFields[key] === undefined) && delete updateFields[key]
        );

        let updatedInstructor;
        try {
          updatedInstructor = await Instructor.findByIdAndUpdate(
            instructorId,
            { $set: updateFields },
            { new: true, runValidators: true }
          );
        } catch (err: any) {
          console.error("❌ Error de Mongoose:", err); // Log detallado para depuración
          if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return NextResponse.json({ message: "Email already exists" }, { status: 409 });
          }
          return NextResponse.json({ message: "Database error", error: err }, { status: 500 });
        }

        if (!updatedInstructor) {
            return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
        }

        // Enviar correo si la contraseña fue cambiada
        if (passwordChanged) {
          try {
            await sendEmail({
              to: email,
              subject: "Your New Password for Driving School Dashboard",
              html: `
                <div style="font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;">
                  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
                    <div style="background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;">
                      <h2 style="margin: 0; font-size: 1.7rem; letter-spacing: 1px;">Driving School Dashboard</h2>
                    </div>
                    <div style="padding: 32px 32px 16px 32px;">
                      <p style="font-size: 1.1rem; margin-bottom: 18px;">Hello,</p>
                      <p style="font-size: 1.1rem; margin-bottom: 18px;">Your new password to access the Driving School Dashboard is:</p>
                      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;">
                        <span style="font-size: 1.3rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">${password}</span>
                      </div>
                      <p style="font-size: 1rem; color: #555;">For your security, please change this password after logging in.</p>
                    </div>
                    <div style="background: #e5e7eb; color: #1e293b; text-align: center; padding: 16px 32px; font-size: 0.95rem; border-top: 1px solid #cbd5e1;">
                      <p style="margin: 0;">If you have any questions, contact your administrator.</p>
                      <p style="margin: 0; font-size: 0.93rem; color: #64748b;">&copy; ${new Date().getFullYear()} Driving School Dashboard</p>
                    </div>
                  </div>
                </div>
              `
            });
          } catch (err) {
            console.error('❌ Error al enviar correo de nueva contraseña:', err);
          }
        }

        return NextResponse.json(updatedInstructor, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating instructor", error }, { status: 500 });
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
