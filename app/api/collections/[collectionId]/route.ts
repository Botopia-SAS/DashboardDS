import { NextRequest, NextResponse } from "next/server";
import Collection from "@/lib/models/Collection";
import { connectToDB } from "@/lib/mongoDB";

// ✅ Fetch Collection by ID (Usando POST en lugar de GET)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const { collectionId } = await req.json();

    if (!collectionId || typeof collectionId !== "string") {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching collection:", collectionId);
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(collection, { status: 200 });
  } catch (error) {
    console.error("[POST Collection Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ UPDATE Collection by ID
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();

    const { collectionId, ...updateData } = await req.json();

    if (!collectionId || typeof collectionId !== "string") {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    const updatedCollection = await Collection.findByIdAndUpdate(
      collectionId,
      updateData,
      { new: true }
    );

    if (!updatedCollection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCollection, { status: 200 });
  } catch (error) {
    console.error("[PATCH Collection Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ DELETE Collection by ID
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    const { collectionId } = await req.json();

    if (!collectionId || typeof collectionId !== "string") {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting collection:", collectionId);
    const deletedCollection = await Collection.findByIdAndDelete(collectionId);

    if (!deletedCollection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Collection deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE Collection Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
