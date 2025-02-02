import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

import Collection from "@/lib/models/Collection";
import { auth } from "@clerk/nextjs/server";

// Forzamos dynamic para evitar problemas de caché en estas rutas:
export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  try {
    // OBTENER userId USANDO AWAIT
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await connectToDB();

    const requestData = await req.json();

    // 🔹 Incluir `price` en la extracción del request
    const { title, description, image, price } = requestData;

    if (!title || !image || price === undefined) {
      return new NextResponse("Title, image, and price are required", { status: 400 });
    }

    // 🔹 Validar que `price` sea un número válido
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return new NextResponse("Invalid price value", { status: 400 });
    }

    // 🔹 Verificar si la colección ya existe
    const existingCollection = await Collection.findOne({ title });

    if (existingCollection) {
      return new NextResponse("Collection already exists", { status: 400 });
    }

    // 🔹 Crear la colección incluyendo `price`
    const newCollection = await Collection.create({
      title,
      description,
      image,
      price: parsedPrice, // Guardar el precio como número
    });

    await newCollection.save();

    return NextResponse.json(newCollection, { status: 200 });
  } catch (err) {
    console.log("[collections_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  try {
    await connectToDB();

    const collections = await Collection.find().sort({ createdAt: "desc" });

    return NextResponse.json(collections, { status: 200 });
  } catch (err) {
    console.log("[collections_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
