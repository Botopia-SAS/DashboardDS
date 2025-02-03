import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";
import Locations from "@/lib/models/Locations";

// Forzamos dynamic para evitar problemas de caché en estas rutas:
export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest, context: { params: Promise<{ locationId: string }> }) => {
  try {
    await connectToDB();

    // ✅ Esperar la promesa `params`
    const { locationId } = await context.params;

    if (!locationId) {
      return new NextResponse("Missing locationId", { status: 400 });
    }

    const location = await Locations.findById(locationId);

    if (!location) {
      return new NextResponse("Location not found", { status: 404 });
    }

    return NextResponse.json(location, { status: 200 });
  } catch (err) {
    console.error("[locationId_GET] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// PATCH - Actualizar una ubicación
export const PATCH = async (req: NextRequest, { params }: { params: { locationId: string } }) => {
  try {
    await connectToDB();
    const body = await req.json();

    const updatedLocation = await Locations.findByIdAndUpdate(params.locationId, body, { new: true });

    if (!updatedLocation) {
      return new NextResponse("Location not found", { status: 404 });
    }

    return NextResponse.json(updatedLocation, { status: 200 });
  } catch (err) {
    console.error("[locationId_PATCH] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// DELETE - Eliminar una ubicación
export const DELETE = async (req: NextRequest, { params }: { params: { locationId: string } }) => {
  try {
    await connectToDB();
    await Locations.findByIdAndDelete(params.locationId);
    return new NextResponse("Location deleted successfully", { status: 200 });
  } catch (err) {
    console.error("[locationId_DELETE] Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
