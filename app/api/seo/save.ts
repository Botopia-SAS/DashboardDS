import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // ✅ Definiendo el tipo de req
  const body = await req.json();

  // Aquí puedes conectar con tu base de datos (ejemplo con Prisma o MongoDB)
  console.log("Saving SEO settings:", body);

  return NextResponse.json({ message: "SEO settings saved successfully" });
}
