import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import TicketClass from "@/lib/models/TicketClass";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { sendEmail } from "../sendEmail";

export const dynamic = "force-dynamic";

// ✅ Método GET para obtener un instructor por ID
export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");

    if (!instructorId) {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json(instructor, { status: 200 });
  } catch (err) {
    console.error("[GET Instructor] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ Método POST para obtener un instructor por ID (redundante si usas GET)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    
    const { instructorId } = await req.json();

    if (!instructorId) {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    // console.log("✅ Instructor encontrado:", instructor);

    return NextResponse.json(instructor, { status: 200 });
  } catch (err) {
    console.error("[POST Instructor] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ DELETE: Eliminar un instructor por ID
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    const instructorId = req.nextUrl.pathname.split("/").pop();

    if (!instructorId) {
      return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json({ error: "Invalid Instructor ID" }, { status: 400 });
    }

    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    // console.log(`[DELETE_INSTRUCTOR] 🗑️ Starting deletion of instructor: ${instructor.name} (${instructorId})`);

    // Eliminar instructor en MongoDB
    const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);
    if (!deletedInstructor) {
      return NextResponse.json({ error: "Instructor not found during deletion" }, { status: 404 });
    }
    // console.log(`[DELETE_INSTRUCTOR] ✅ Instructor deleted: ${deletedInstructor.name} (${instructorId})`);

    return NextResponse.json({ 
      message: "Instructor deleted successfully",
      instructorName: instructor.name 
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting instructor:", error);
    return NextResponse.json({ error: "Error deleting instructor" }, { status: 500 });
  }
}

// ✅ PATCH: Actualizar un instructor por ID
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const { instructorId, password, ...updates } = await req.json();

    // console.log("📥 Datos recibidos en el PATCH:", { instructorId, updates, hasPassword: !!password });

    if (!instructorId) {
      return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0 && !password) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 });
    }

    // Preparar los campos de actualización
    const updateFields = { ...updates };
    let passwordChanged = false;
    let newPassword = "";
    let ticketClassesDeleted = 0;

    // Si se proporciona una nueva contraseña, encriptarla
    if (password && typeof password === "string" && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
      passwordChanged = true;
      newPassword = password; // Guardar la contraseña sin encriptar para el correo
      // console.log("🔐 Contraseña encriptada y lista para guardar");
    }

    // Asegurar que los campos de Class Types sean booleanos
    if (typeof updateFields.canTeachTicketClass !== 'undefined') {
      updateFields.canTeachTicketClass = Boolean(updateFields.canTeachTicketClass);
    }
    if (typeof updateFields.canTeachDrivingTest !== 'undefined') {
      updateFields.canTeachDrivingTest = Boolean(updateFields.canTeachDrivingTest);
    }
    if (typeof updateFields.canTeachDrivingLesson !== 'undefined') {
      updateFields.canTeachDrivingLesson = Boolean(updateFields.canTeachDrivingLesson);
    }

    // Verificar si se está desactivando Ticket Class
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
    }

    const wasTicketClassEnabled = instructor.canTeachTicketClass || false;
    const isTicketClassBeingDisabled = wasTicketClassEnabled && updateFields.canTeachTicketClass === false;

    // Si se está desactivando Ticket Class, eliminar todas las ticket classes asociadas
    if (isTicketClassBeingDisabled) {
      console.log(`🗑️ Deleting all ticket classes for instructor ${instructorId} (Ticket Class capability disabled)`);
      
      // Eliminar todas las ticket classes asociadas al instructor
      const deleteResult = await TicketClass.deleteMany({ instructorId });
      ticketClassesDeleted = deleteResult.deletedCount;
      
      console.log(`✅ Deleted ${ticketClassesDeleted} ticket classes for instructor ${instructorId}`);
      
      // Limpiar el horario del instructor para remover referencias a ticket classes
      // Clean both driving test and driving lesson schedules
      if (instructor.schedule_driving_test && instructor.schedule_driving_test.length > 0) {
        const cleanedDrivingTestSchedule = instructor.schedule_driving_test.filter((slot: any) => 
          !slot.ticketClassId && slot.classType !== 'D.A.T.E' && slot.classType !== 'B.D.I' && slot.classType !== 'A.D.I'
        );
        updateFields.schedule_driving_test = cleanedDrivingTestSchedule;
        console.log(`🧹 Cleaned instructor driving test schedule, kept ${cleanedDrivingTestSchedule.length} non-ticket slots`);
      }
      
      if (instructor.schedule_driving_lesson && instructor.schedule_driving_lesson.length > 0) {
        const cleanedDrivingLessonSchedule = instructor.schedule_driving_lesson.filter((slot: any) => 
          !slot.ticketClassId && slot.classType !== 'D.A.T.E' && slot.classType !== 'B.D.I' && slot.classType !== 'A.D.I'
        );
        updateFields.schedule_driving_lesson = cleanedDrivingLessonSchedule;
        console.log(`🧹 Cleaned instructor driving lesson schedule, kept ${cleanedDrivingLessonSchedule.length} non-ticket slots`);
      }
    }

    // console.log("📝 Campos a actualizar:", updateFields);

    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedInstructor) {
      return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
    }

    // console.log("✅ Instructor actualizado en la BD:", updatedInstructor);

    // Enviar correo si la contraseña fue cambiada
    if (passwordChanged) {
      try {
        await sendEmail({
          to: updatedInstructor.email,
          subject: "Your Password Has Been Updated - Driving School Dashboard",
          html: `
            <div style="font-family: Arial, sans-serif; background: #f4f6fa; padding: 32px; color: #222;">
              <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; overflow: hidden;">
                <div style="background: #1e40af; color: #fff; padding: 24px 32px 16px 32px; text-align: center;">
                  <h2 style="margin: 0; font-size: 1.7rem; letter-spacing: 1px;">Password Updated</h2>
                </div>
                <div style="padding: 32px 32px 16px 32px;">
                  <p style="font-size: 1.1rem; margin-bottom: 18px;">Hello ${updatedInstructor.name},</p>
                  <p style="font-size: 1.1rem; margin-bottom: 18px;">Your password has been updated successfully. Your new credentials are:</p>
                  <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;">
                    <span style="font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">Email: ${updatedInstructor.email}</span><br/>
                    <span style="font-size: 1.1rem; font-weight: bold; color: #1e40af; letter-spacing: 1px;">New Password: ${newPassword}</span>
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
      } catch (err) {
        console.error("❌ Error al enviar correo de contraseña actualizada:", err);
        // No fallar la actualización si el correo falla
      }
    }

    // Incluir información sobre las ticket classes eliminadas en la respuesta
    const responseData = {
      ...updatedInstructor.toObject(),
      ticketClassesDeleted: isTicketClassBeingDisabled ? ticketClassesDeleted : undefined
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("❌ Error al actualizar instructor:", error);
    return NextResponse.json({ message: "Error updating instructor" }, { status: 500 });
  }
}

