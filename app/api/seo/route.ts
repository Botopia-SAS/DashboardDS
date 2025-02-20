import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import { SEO } from "@/lib/models/SEO";

// ✅ GET: Obtener configuración de SEO
export async function GET() {
  try {
    await connectToDB();
    let seoSettings = await SEO.findOne();

    // 🔹 Si no hay configuraciones, creamos una por defecto
    if (!seoSettings) {
      seoSettings = await SEO.create({
        metaTitle: "Default Title",
        metaDescription: "Default Description",
        robotsTxt: "User-agent: *\nDisallow:",
        sitemapUrl: "",
        ogTitle: "",
        ogImage: "",
      });
    }

    return NextResponse.json(seoSettings);
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

    const updatedSEO = await SEO.findOneAndUpdate({}, body, { upsert: true, new: true });

    return NextResponse.json(updatedSEO);
  } catch (error) {
    console.error("❌ API Error in /api/seo POST:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
