import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import { SEO } from "@/lib/models/SEO";

// ✅ GET: Obtener configuración de SEO
// Soporta query params: ?entityType=DrivingClass&entityId=123
export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    let query: any = {};

    if (entityType && entityId) {
      // Buscar SEO específico de una entidad
      query = { entityType, entityId };
    } else if (entityType === "General" || (!entityType && !entityId)) {
      // Buscar SEO general
      query = { entityType: "General" };
    }

    let seoSettings = await SEO.findOne(query);

    // 🔹 Si no hay configuraciones, creamos una por defecto solo para General
    if (!seoSettings && (!entityType || entityType === "General")) {
      seoSettings = await SEO.create({
        metaTitle: "Default Title",
        metaDescription: "Default Description",
        robotsTxt: "User-agent: *\nDisallow:",
        sitemapUrl: "",
        ogTitle: "",
        ogImage: "",
        entityType: "General",
      });
    }

    return NextResponse.json(seoSettings || {});
  } catch (error) {
    console.error("❌ API Error in /api/seo:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ✅ POST: Guardar configuración de SEO
export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();

    const { entityType, entityId, ...seoData } = body;

    let query: any = {};

    if (entityType && entityId) {
      query = { entityType, entityId };
    } else if (entityType === "General" || !entityType) {
      query = { entityType: "General", entityId: { $exists: false } };
    }

    const updatedSEO = await SEO.findOneAndUpdate(
      query,
      { ...seoData, entityType: entityType || "General", entityId: entityId || undefined },
      { upsert: true, new: true }
    );

    return NextResponse.json(updatedSEO);
  } catch (error) {
    console.error("❌ API Error in /api/seo POST:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ✅ DELETE: Eliminar configuración de SEO de una entidad
export async function DELETE(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return new NextResponse("entityType and entityId are required", { status: 400 });
    }

    await SEO.deleteOne({ entityType, entityId });

    return NextResponse.json({ message: "SEO deleted successfully" });
  } catch (error) {
    console.error("❌ API Error in /api/seo DELETE:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
