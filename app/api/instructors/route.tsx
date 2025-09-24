import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor"; // Modelo de MongoDB
import { sendEmail } from "./sendEmail";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

interface Auth0Error {
  message: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();
    const {
      name,
      photo,
      certifications,
      experience,
      email,
      password,
      canTeachTicketClass,
      canTeachDrivingTest,
      canTeachDrivingLesson,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Encriptar la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    const newInstructor = new Instructor({
      name,
      photo,
      certifications,
      experience,
      email,
      password: hashedPassword,
      canTeachTicketClass: canTeachTicketClass || false,
      canTeachDrivingTest: canTeachDrivingTest || false,
      canTeachDrivingLesson: canTeachDrivingLesson || false,
    });

    await newInstructor.save();

    // Enviar correo con las credenciales al instructor
    try {
      await sendEmail({
        to: email,
        subject: "Your Credentials for Driving School Dashboard",
        html: `
                    <div style="font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;">
                      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
                        <div style="background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;">
                          <h2 style="margin: 0; font-size: 1.7rem; letter-spacing: 1px;">Driving School Dashboard</h2>
                        </div>
                        <div style="padding: 32px 32px 16px 32px;">
                          <p style="font-size: 1.1rem; margin-bottom: 18px;">Hello,</p>
                          <p style="font-size: 1.1rem; margin-bottom: 18px;">Your credentials to access the instructor panel are:</p>
                          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;">
                            <span style="font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">Email: ${email}</span><br/>
                            <span style="font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">Password: ${password}</span>
                          </div>
                          <p style="font-size: 1rem; color: #555;">For security reasons, please change your password after logging in.</p>
                        </div>
                        <div style="background: #e5e7eb; color: #1e293b; text-align: center; padding: 16px 32px; font-size: 0.95rem; border-top: 1px solid #cbd5e1;">
                          <p style="margin: 0;">If you have any questions, please contact your administrator.</p>
                          <p style="margin: 0; font-size: 0.93rem; color: #64748b;">&copy; ${new Date().getFullYear()} Driving School Dashboard</p>
                        </div>
                      </div>
                    </div>
                `,
      });
    } catch (err: unknown) {
      console.error(
        "❌ Error al enviar correo de credenciales al instructor:",
        err
      );
    }

    return NextResponse.json(newInstructor, { status: 201 });
  } catch (error: unknown) {
    console.error("Error en el endpoint POST /api/instructors:", error);
    return NextResponse.json({ message: "Error creating instructor" }, { status: 500 });
  }
}

export const GET = async () => {
  try {
    await connectToDB();
    const instructors = await Instructor.find().sort({ createdAt: "desc" });
    return NextResponse.json(instructors, { status: 200 });
  } catch (err: unknown) {
    console.error("[INSTRUCTORS_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export async function PATCH(req: Request) {
  try {
    await connectToDB();
    const {
      instructorId,
      password,
      email,
      canTeachTicketClass,
      canTeachDrivingTest,
      canTeachDrivingLesson,
      ...updates
    } = await req.json();

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Buscar el instructor actual
    const currentInstructor = await Instructor.findById(instructorId);
    if (!currentInstructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Construir el objeto de actualización
    const updateFields = {
      ...updates,
      email: email ? email.trim() : undefined,
      name: updates.name,
      canTeachTicketClass: canTeachTicketClass || false,
      canTeachDrivingTest: canTeachDrivingTest || false,
      canTeachDrivingLesson: canTeachDrivingLesson || false,
    };

    // Solo actualiza el password si se proporciona
    let passwordChanged = false;
    let emailChanged = false;
    if (typeof password === "string" && password.trim() !== "") {
      passwordChanged = true;
      updateFields.password = await bcrypt.hash(password, 10);
    }
    if (email && email !== currentInstructor.email) {
      emailChanged = true;
    }

    // Elimina campos vacíos explícitamente
    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === "" || updateFields[key] === undefined) &&
        delete updateFields[key]
    );

    let updatedInstructor;
    try {
      updatedInstructor = await Instructor.findByIdAndUpdate(
        instructorId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
    } catch (err: unknown) {
      // Verificar si es un error de duplicado de email
      const mongoError = err as { code?: number; keyPattern?: { email?: number } };
      if (mongoError.code === 11000 && mongoError.keyPattern?.email) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: "Database error", error: err },
        { status: 500 }
      );
    }

    // Enviar correo si la contraseña fue cambiada
    if (passwordChanged) {
      try {
        await sendEmail({
          to: email,
          subject: "Your Password Has Been Updated - Driving School Dashboard",
          html: `
            <div style="font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;">
              <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
                <div style="background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;">
                  <h2 style="margin: 0; font-size: 1.7rem; letter-spacing: 1px;">Password Updated</h2>
                </div>
                <div style="padding: 32px 32px 16px 32px;">
                  <p style="font-size: 1.1rem; margin-bottom: 18px;">Hello ${updates.name || 'there'},</p>
                  <p style="font-size: 1.1rem; margin-bottom: 18px;">Your password has been updated successfully. Your new credentials are:</p>
                  <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;">
                    <span style="font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">Email: ${email}</span><br/>
                    <span style="font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">New Password: ${password}</span>
                  </div>
                  <p style="font-size: 1rem; color: #555;">Please keep your credentials secure and do not share them with anyone.</p>
                  <p style="font-size: 1rem; color: #555;">If you did not request this password change, please contact your administrator immediately.</p>
                </div>
                <div style="background: #e5e7eb; color: #1e293b; text-align: center; padding: 16px 32px; font-size: 0.95rem; border-top: 1px solid #cbd5e1;">
                  <p style="margin: 0;">If you have any questions, please contact your administrator.</p>
                  <p style="margin: 0; font-size: 0.93rem; color: #64748b;">&copy; ${new Date().getFullYear()} Driving School Dashboard</p>
                </div>
              </div>
            </div>
          `,
        });
        // console.log("📧 Correo de contraseña actualizada enviado exitosamente");
      } catch (err: unknown) {
        console.error("❌ Error al enviar correo de contraseña actualizada:", err);
      }
    }

    return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (error: unknown) {
    console.error("Error en el endpoint PATCH /api/instructors:", error);
    return NextResponse.json({ message: "Error updating instructor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }

    const deletedInstructor = await Instructor.findByIdAndDelete(id);
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
  } catch (error: unknown) {
    console.error("Error en el endpoint DELETE /api/instructors:", error);
    return NextResponse.json(
      { message: "Error deleting instructor" },
      { status: 500 }
    );
  }
}
