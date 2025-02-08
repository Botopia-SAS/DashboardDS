import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Locations from "@/lib/models/Locations";
import mongoose from "mongoose";

// Forzamos dynamic para evitar problemas de caché en estas rutas:
export const dynamic = "force-dynamic";

// ✅ GET LOCATION BY ID (Corrige el problema de los instructores vacíos)
export const GET = async (req: NextRequest, context: { params: Promise<{ locationId: string }> }) => {
  try {
    await connectToDB();

    // ✅ Esperar la promesa `params`
    const { locationId } = await context.params;

    if (!locationId) {
      return new NextResponse("Missing locationId", { status: 400 });
    }

    // ✅ Usamos `.populate("instructors")` para cargar los detalles de los instructores
    const location = await Locations.findById(locationId).populate("instructors");

    if (!location) {
      return new NextResponse("Location not found", { status: 404 });
    }

    return NextResponse.json(location, { status: 200 });
  } catch (err) {
    console.error("[locationId_GET] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ UPDATE LOCATION BY ID (Corrige el problema al guardar instructores)
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `locationId` desde la URL
    const url = new URL(req.url);
    const locationId = url.pathname.split("/").pop(); // 🚀 Extrae el último segmento de la URL

    if (!locationId) {
      return NextResponse.json({ message: "Missing locationId" }, { status: 400 });
    }

    // ✅ Obtener los datos del request
    const body = await req.json();
    const { instructors, ...updateData } = body;

    // ✅ Asegurar que los instructores sean `ObjectId[]`
    const instructorsObjectIds = instructors.map((id: string) => new mongoose.Types.ObjectId(id));

    // ✅ Actualizar la ubicación en la base de datos
    const updatedLocation = await Locations.findByIdAndUpdate(
      locationId,
      { ...updateData, instructors: instructorsObjectIds },
      { new: true }
    ).populate("instructors"); // ✅ Populamos instructores después de actualizar

    if (!updatedLocation) {
      return NextResponse.json({ message: "Location not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLocation, { status: 200 });
  } catch (error) {
    console.error("[PATCH_LOCATION_ERROR]", error);
    return NextResponse.json({ message: "Failed to update location" }, { status: 500 });
  }
}

// ✅ DELETE LOCATION BY ID (No necesita cambios)
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `locationId` desde la URL
    const url = new URL(req.url);
    const locationId = url.pathname.split("/").pop(); // 🚀 Extrae el último segmento de la URL

    if (!locationId) {
      return NextResponse.json({ message: "Missing locationId" }, { status: 400 });
    }

    const deletedLocation = await Locations.findByIdAndDelete(locationId);
    if (!deletedLocation) {
      return NextResponse.json({ message: "Location not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Location deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_LOCATION_ERROR]", error);
    return NextResponse.json({ message: "Failed to delete location" }, { status: 500 });
  }
}
