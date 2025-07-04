import { connectToDB } from "@/lib/mongoDB";
import { NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor"; // Modelo de MongoDB
import { sendEmail } from "./sendEmail";
import bcrypt from "bcryptjs";
import TicketClass from "@/lib/models/TicketClass";

export const dynamic = "force-dynamic";

interface Slot {
  date: string;
  start: string;
  end: string;
  booked?: boolean;
  studentId?: string | null;
  status?: string;
}

interface Auth0Error {
  message: string;
  [key: string]: unknown;
}

function isValidSlot(slot: Slot): boolean {
  return Boolean(slot?.date && slot?.start && slot?.end);
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
      schedule,
      email,
      password,
      dni,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Solo slots válidos
    const validSchedule = Array.isArray(schedule)
      ? schedule.filter(isValidSlot)
      : [];

    // Encriptar la contraseña antes de guardar
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
    //console.error("[INSTRUCTORS_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export async function PATCH(req: Request) {
  try {
    await connectToDB();
    const {
      instructorId,
      schedule: newSchedule,
      password,
      email,
      dni,
      ...updates
    } = await req.json();

    if (!instructorId) {
      return NextResponse.json(
        { message: "Instructor ID is required" },
        { status: 400 }
      );
    }
    if (!email || !dni) {
      return NextResponse.json(
        { message: "Email and DNI are required" },
        { status: 400 }
      );
    }

    // Solo slots válidos
    const validSchedule = Array.isArray(newSchedule)
      ? newSchedule.filter(isValidSlot)
      : [];

    // Buscar el instructor actual
    const currentInstructor = await Instructor.findById(instructorId);
    if (!currentInstructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Construir el objeto de actualización SOLO con los campos que quieres cambiar
    const updateFields = {
      ...updates,
      schedule: validSchedule,
      email: email ? email.trim() : undefined,
      name: updates.name,
      dni,
    };
    // Solo actualiza el password en Auth0, no en MongoDB
    let passwordChanged = false;
    let emailChanged = false;
    if (typeof password === "string" && password.trim() !== "") {
      passwordChanged = true;
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

    // Actualizar en Auth0 si cambió email o password
    if ((passwordChanged || emailChanged) && currentInstructor.auth0Id) {
      // 1. Obtener token de Auth0
      const tokenRes = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            grant_type: "client_credentials",
          }),
        }
      );
      const tokenData = await tokenRes.json();
      const access_token = tokenData.access_token;

      // 2. Actualizar usuario en Auth0
      await fetch(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(
          currentInstructor.auth0Id
        )}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            ...(emailChanged ? { email } : {}),
            ...(passwordChanged ? { password } : {}),
          }),
        }
      );
    }

    let updatedInstructor;
    try {
      updatedInstructor = await Instructor.findByIdAndUpdate(
        instructorId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
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
              `,
        });
      } catch (err) {
        console.error("❌ Error al enviar correo de nueva contraseña:", err);
      }
    }

    return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating instructor", error },
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

    // Buscar el instructor para obtener el auth0Id
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Eliminar usuario en Auth0
    if (instructor.auth0Id) {
      // Obtener token de Auth0
      const tokenRes = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            client_id: process.env.AUTH0_CLIENT_ID,
            client_secret: process.env.AUTH0_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            grant_type: "client_credentials",
          }),
        }
      );
      const tokenData = await tokenRes.json();
      const access_token = tokenData.access_token;

      // Eliminar usuario en Auth0
      const auth0DeleteRes = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(
          instructor.auth0Id
        )}`,
        {
          method: "DELETE",
          headers: {
            authorization: `Bearer ${access_token}`,
          },
        }
      );
      if (!auth0DeleteRes.ok) {
        const error = await auth0DeleteRes.json();
        console.error("❌ Error al eliminar usuario en Auth0:", error);
        return NextResponse.json(
          { message: "Error deleting user in Auth0", error },
          { status: 500 }
        );
      }
    }

    // Eliminar instructor en MongoDB
    const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);
    if (!deletedInstructor) {
      return NextResponse.json(
        { message: "Instructor not found" },
        { status: 404 }
      );
    }

    // Eliminar todas las ticketclasses asociadas a este instructor
    await TicketClass.deleteMany({ instructorId });

    return NextResponse.json({ message: "Instructor deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error al eliminar instructor:", error);
    return NextResponse.json({ message: "Error deleting instructor" }, { status: 500 });
  }
}
