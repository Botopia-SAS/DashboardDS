import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

// ✅ GET SINGLE PRODUCT (Extrae `productId` desde la URL manualmente)
export const GET = async (req: NextRequest) => {
  try {
    await connectToDB();

    const productId = req.nextUrl.pathname.split("/").pop();

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // 🔥 Asegurar que todos los campos están en la respuesta
    return NextResponse.json({
      _id: product._id,
      title: product.title,
      description: product.description,
      media: product.media,
      price: product.price,
      duration: product.duration,
      category: product.category, // 🔥 Incluir `category`
      type: product.type, // 🔥 Incluir `type`
      buttonLabel: product.buttonLabel, // 🔥 Incluir `buttonLabel`
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ POST PRODUCT (Sin cambios)
export const POST = async (req: NextRequest) => {
  try {
    await connectToDB();

    const {
      title,
      description,
      hasImage,
      media,
      price,
      duration,
      category,
      buttonLabel,
    } = await req.json();

    if (!title || !description || !price || !duration || !category || !buttonLabel) {
      return new NextResponse("All fields are required", { status: 400 });
    }

    const processedMedia = hasImage ? media : [];

    const newProduct = new Product({
      title,
      description,
      hasImage,
      media: processedMedia,
      price,
      duration,
      category,
      type: "Buy", // Always "Buy" for products
      buttonLabel,
    });

    await newProduct.save();
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("[POST_PRODUCT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ DELETE PRODUCT (Extrae `productId` desde la URL manualmente)
export const DELETE = async (req: NextRequest) => {
  try {
    const productId = req.nextUrl.pathname.split("/").pop(); // 🔹 Extraemos `productId`

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    await connectToDB();

    const product = await Product.findById(productId);
    if (!product) {
      return new NextResponse(JSON.stringify({ message: "Product not found" }), { status: 404 });
    }

    await Product.findByIdAndDelete(productId);

    return new NextResponse(JSON.stringify({ message: "Product deleted" }), { status: 200 });
  } catch (err) {
    console.log("[productId_DELETE]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
};

// ✅ PATCH PRODUCT (Extrae `productId` desde la URL manualmente)
export const PATCH = async (req: NextRequest) => {
  try {
    await connectToDB();
    const body = await req.json();

    const productId = req.nextUrl.pathname.split("/").pop(); // 🔹 Extraemos `productId`

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Ensure type is always "Buy" for products
    const updateData = { ...body, type: "Buy" };
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PATCH_PRODUCT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// Mantiene el modo dinámico
export const dynamic = "force-dynamic";
