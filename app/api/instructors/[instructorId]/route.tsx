import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/lib/models/Instructor";
import TicketClass from "@/lib/models/TicketClass";
import mongoose from "mongoose";
import axios from "axios";

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

    console.log("✅ Instructor encontrado:", instructor);

    return NextResponse.json(instructor, { status: 200 });
  } catch (err) {
    console.error("[POST Instructor] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Función para obtener el token de Auth0 Management API dinámicamente
async function getAuth0ManagementToken() {
  const response = await axios.post(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
    },
    {
      headers: { "content-type": "application/json" },
    }
  );
  return response.data.access_token;
}

interface Auth0Error {
  response?: {
    data?: unknown;
  };
  message?: string;
}

// ✅ DELETE: Eliminar un instructor por ID (Extrae `instructorId` desde la URL)
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

    // 1. Busca el instructor para obtener el auth0Id
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    console.log(`[DELETE_INSTRUCTOR] 🗑️ Starting deletion of instructor: ${instructor.name} (${instructorId})`);

    // 2. STEP 1: Buscar ticket classes antes de eliminar (para logs)
    const ticketClassesToDelete = await TicketClass.find({ instructorId });
    console.log(`[DELETE_INSTRUCTOR] Found ${ticketClassesToDelete.length} ticket classes to delete for instructor ${instructorId}:`, 
      ticketClassesToDelete.map(tc => ({
        id: tc._id,
        type: tc.type,
        date: tc.date,
        hour: tc.hour,
        students: tc.students?.length || 0
      }))
    );

    // 3. Elimina el usuario en Auth0 si tiene auth0Id
    if (instructor.auth0Id) {
      try {
        const managementToken = await getAuth0ManagementToken();
        console.log(`[DELETE_INSTRUCTOR] 🔐 Deleting Auth0 user: ${instructor.auth0Id}`);
        await axios.delete(
          `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${instructor.auth0Id}`,
          {
            headers: {
              Authorization: `Bearer ${managementToken}`,
            },
          }
        );
        console.log(`[DELETE_INSTRUCTOR] ✅ Auth0 user deleted successfully`);
      } catch (err: unknown) {
        const error = err as Auth0Error;
        console.error("[DELETE_INSTRUCTOR] ❌ Error deleting user in Auth0:", error.response?.data || error.message);
        // Continuar con la eliminación aunque falle Auth0
      }
    }

    // 4. STEP 2: Eliminar instructor en MongoDB
    const deletedInstructor = await Instructor.findByIdAndDelete(instructorId);
    if (!deletedInstructor) {
      return NextResponse.json({ error: "Instructor not found during deletion" }, { status: 404 });
    }
    console.log(`[DELETE_INSTRUCTOR] ✅ Instructor deleted: ${deletedInstructor.name} (${instructorId})`);

    // 5. STEP 3: 🎯 CASCADE DELETE - Eliminar todas las ticket classes asociadas
    const deleteResult = await TicketClass.deleteMany({ instructorId });
    console.log(`[DELETE_INSTRUCTOR] ✅ CASCADE DELETE: Deleted ${deleteResult.deletedCount} ticket classes for instructor ${instructorId}`);
    
    if (deleteResult.deletedCount !== ticketClassesToDelete.length) {
      console.warn(`[DELETE_INSTRUCTOR] ⚠️ Warning: Expected to delete ${ticketClassesToDelete.length} ticket classes, but deleted ${deleteResult.deletedCount}`);
    }

    // 6. Resumen final
    console.log(`[DELETE_INSTRUCTOR] 🎉 COMPLETE: Successfully deleted instructor ${instructor.name} and ${deleteResult.deletedCount} associated ticket classes`);

    return NextResponse.json({ 
      message: "Instructor and all associated data deleted successfully",
      deletedTicketClasses: deleteResult.deletedCount,
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
    const { instructorId, ...updates } = await req.json();

    console.log("📥 Datos recibidos en el PATCH:", { instructorId, updates });

    if (!instructorId) {
      return NextResponse.json({ message: "Instructor ID is required" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 });
    }

    const updatedInstructor = await Instructor.findByIdAndUpdate(
      instructorId,
      { $set: updates },
      { new: true }
    );

    if (!updatedInstructor) {
      return NextResponse.json({ message: "Instructor not found" }, { status: 404 });
    }

    console.log("✅ Instructor actualizado en la BD:", updatedInstructor);

    return NextResponse.json(updatedInstructor, { status: 200 });
  } catch (error) {
    console.error("❌ Error al actualizar instructor:", error);
    return NextResponse.json({ message: "Error updating instructor" }, { status: 500 });
  }
}

