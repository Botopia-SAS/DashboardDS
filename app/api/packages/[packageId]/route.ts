import { NextResponse, NextRequest } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import Package from "@/lib/models/Package";
import Product from "@/lib/models/Product";

// ✅ GET SINGLE PACKAGE
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const productId = req.nextUrl.pathname.split("/").pop();
    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("[GET_PRODUCT_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();

    // ✅ Extraer `productId` desde `req.url`
    const urlParts = req.nextUrl.pathname.split("/");
    const productId = urlParts[urlParts.length - 1]; // Última parte de la URL

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, body, { new: true });
    if (!updatedProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("[PATCH_PRODUCT_ERROR]", error);
    return NextResponse.json({ message: "Failed to update product" }, { status: 500 });
  }
}

// ✅ DELETE - Eliminar un paquete
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    const productId = req.nextUrl.pathname.split("/").pop();
    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_PRODUCT_ERROR]", error);
    return NextResponse.json({ message: "Failed to delete product" }, { status: 500 });
  }
}



