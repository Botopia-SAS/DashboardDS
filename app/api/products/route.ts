import { NextRequest, NextResponse } from "next/server";

import { connectToDB } from "@/lib/mongoDB";
import Product from "@/lib/models/Product";

export const POST = async (req: NextRequest) => {
  try {
    // Clerk getAuth removed
    // const { userId } = getAuth(req);
    // console.log("🔍 userId recibido:", userId); // Debugging
    // if (!userId) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    await connectToDB();

    const {
      title,
      description,
      hasImage,
      media,
      price,
      category,
      type,
      buttonLabel,
    } = await req.json();

    if (!title || !description || !price || !category || !type || !buttonLabel) {
      return new NextResponse("Title, description, media, and price are required", { status: 400 });
    }

    // 🔹 Si `hasImage` es `false`, asegúrate de que `media` esté vacío
    const processedMedia = hasImage ? media : [];

    const newProduct = await Product.create({
      title,
      description,
      hasImage,
      media: processedMedia,
      price,
      category,
      type,
      buttonLabel,
    });

    await newProduct.save();

    return NextResponse.json(newProduct, { status: 200 });
  } catch (err) {
    console.log("[products_POST]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const GET = async () => {
  try {
    await connectToDB();

    const products = await Product.find().sort({ createdAt: "desc" });

    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.log("[products_GET]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const dynamic = "force-dynamic";