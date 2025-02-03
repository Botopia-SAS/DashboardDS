import Product from "@/lib/models/Product";
import { connectToDB } from "@/lib/mongoDB";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ✅ GET SINGLE PRODUCT (Corrección: `params` ya no es una promesa)
export const GET = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    await connectToDB();

    const { productId } = params; // 🔹 No usar `await` aquí

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("❌ Internal Server Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ POST PRODUCT (No requiere cambios)
export const POST = async (req: NextRequest) => {
  try {
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
      return new NextResponse("All fields are required", { status: 400 });
    }

    const processedMedia = hasImage ? media : []; // 🔹 Si `hasImage` es `false`, `media` será un array vacío

    const newProduct = new Product({
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
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("[POST_PRODUCT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ DELETE PRODUCT (Corrección: `params` ya no es una promesa)
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { productId: string } } // 🔹 Corregido
) => {
  try {
    const { productId } = params; // 🔹 No usar `await` aquí

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
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

// ✅ PATCH PRODUCT (No requiere cambios)
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { productId: string } }
) => {
  try {
    await connectToDB();

    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const data = await req.json();

    const updatedProduct = await Product.findByIdAndUpdate(
      params.productId,
      data,
      { new: true } // Retorna el producto actualizado
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
