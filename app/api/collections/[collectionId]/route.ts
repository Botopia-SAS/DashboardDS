import Collection from "@/lib/models/Collection";
import { connectToDB } from "@/lib/mongoDB";
import { NextRequest, NextResponse } from "next/server";

// ✅ GET Collection by ID
export const GET = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    await connectToDB();

    const { collectionId } = params;

    if (!collectionId) {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    console.log("🔍 Fetching collection:", collectionId);
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(collection, { status: 200 });
  } catch (error) {
    console.error("[GET Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ UPDATE Collection by ID
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    await connectToDB();

    const { collectionId } = params;

    if (!collectionId) {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    const body = await req.json();
    const updatedCollection = await Collection.findByIdAndUpdate(collectionId, body, { new: true });

    if (!updatedCollection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(updatedCollection, { status: 200 });
  } catch (error) {
    console.error("[PATCH Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ DELETE Collection by ID
export const DELETE = async (
  req: NextRequest,
  { params }: { params: { collectionId: string } }
) => {
  try {
    await connectToDB();

    const { collectionId } = params;

    if (!collectionId) {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    console.log("🗑️ Deleting collection:", collectionId);
    const deletedCollection = await Collection.findByIdAndDelete(collectionId);

    if (!deletedCollection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json({ message: "Collection deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};