import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import { SEO } from "@/lib/models/SEO";

// ✅ GET - Obtener un SEO por ID
export const GET = async (req: Request) => {
  try {
    await connectToDB();
    const seoId = req.url.split("/").pop(); // Extraer el ID de la URL

    if (!seoId) {
      return new NextResponse("SEO ID is required", { status: 400 });
    }

    const seoSettings = await SEO.findById(seoId);

    if (!seoSettings) {
      return new NextResponse("SEO settings not found", { status: 404 });
    }

    return NextResponse.json(seoSettings, { status: 200 });
  } catch (err) {
    console.error("[SEO_GET_ID]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ PATCH - Actualizar configuración SEO por ID
export const PATCH = async (req: Request) => {
  try {
    await connectToDB();
    const seoId = req.url.split("/").pop();
    const body = await req.json();

    if (!seoId) {
      return new NextResponse("SEO ID is required", { status: 400 });
    }

    const updatedSEO = await SEO.findByIdAndUpdate(seoId, body, { new: true });

    if (!updatedSEO) {
      return new NextResponse("SEO settings not found", { status: 404 });
    }

    return NextResponse.json(updatedSEO, { status: 200 });
  } catch (err) {
    console.error("[SEO_PATCH]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ DELETE - Eliminar configuración SEO por ID
export const DELETE = async (req: Request) => {
  try {
    await connectToDB();
    const seoId = req.url.split("/").pop();

    if (!seoId) {
      return new NextResponse("SEO ID is required", { status: 400 });
    }

    await SEO.findByIdAndDelete(seoId);

    return new NextResponse(JSON.stringify({ message: "SEO settings deleted" }), { status: 200 });
  } catch (err) {
    console.error("[SEO_DELETE]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// Mantiene el modo dinámico
export const dynamic = "force-dynamic";
