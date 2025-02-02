import Collection from "@/lib/models/Collection";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ collectionId: string }> } // 🔥 `params` es una promesa
) => {
  try {
    await connectToDB();

    const { collectionId } = await context.params; // 🔥 Hacer `await` en `params`

    if (!collectionId) {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    console.log("🔍 Fetching collection:", collectionId);
    const collection = await Collection.findById(collectionId).populate({
      path: "products",
      model: "Product",
    });

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(collection, { status: 200 });
  } catch (error) {
    console.error("[GET Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const POST = async (
  req: NextRequest,
  context: { params: Promise<{ collectionId: string }> } // 🔥 `params` es una promesa
) => {
  try {
    const { collectionId } = await context.params; // 🔥 Hacer `await` en `params`

    if (!collectionId) {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    await connectToDB();

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    const { title, description, image, price } = await req.json();
    const parsedPrice = parseFloat(price);

    if (!title || !description || !image || isNaN(parsedPrice)) {
      return new NextResponse("Title, description, image, and price are required", { status: 400 });
    }

    console.log("✅ Updating collection:", collectionId);
    const updatedCollection = await Collection.findByIdAndUpdate(
      collectionId,
      { title, description, image, price: parsedPrice },
      { new: true }
    );

    return NextResponse.json(updatedCollection, { status: 200 });
  } catch (error) {
    console.error("[POST Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
