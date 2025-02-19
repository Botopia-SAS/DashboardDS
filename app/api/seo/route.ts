import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import { SEO } from "@/lib/models/SEO"; // Asegúrate de importar correctamente

// ✅ GET - Obtener configuración de SEO
export const GET = async () => {
  try {
    await connectToDB();
    const seoSettings = await SEO.findOne();

    if (!seoSettings) {
      return new NextResponse("No SEO settings found", { status: 404 });
    }

    return NextResponse.json(seoSettings, { status: 200 });
  } catch (err) {
    console.error("❌ [SEO_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ POST - Guardar o actualizar configuración de SEO
export const POST = async (req: Request) => {
  try {
    await connectToDB();
    const body = await req.json();

    if (!body.metaTitle || !body.metaDescription || !body.sitemapUrl) {
      return new NextResponse("metaTitle, metaDescription y sitemapUrl son obligatorios", { status: 400 });
    }

    // 🔹 Encuentra y actualiza (o inserta si no existe)
    const updatedSEO = await SEO.findOneAndUpdate({}, body, { upsert: true, new: true });

    return NextResponse.json(updatedSEO, { status: 200 });
  } catch (err) {
    console.error("❌ [SEO_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// Mantiene el modo dinámico
export const dynamic = "force-dynamic";
