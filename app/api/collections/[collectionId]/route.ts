import Collection from "@/lib/models/Collection";
import { connectToDB } from "@/lib/mongoDB";

type Context = {
  params: ParamsType;
};
import { NextRequest, NextResponse } from "next/server";

type ParamsType = {
  collectionId: string;
  [key: string]: string; // Para admitir otros posibles parámetros en la URL
};

export async function GET(req: NextRequest, context: Context) {
  try {
    await connectToDB();

    const { collectionId } = context.params;

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
}

// ✅ UPDATE Collection by ID
export async function PATCH(req: NextRequest, context: { params: ParamsType }) {
  try {
    await connectToDB();

    const collectionId = context?.params?.collectionId;

    if (!collectionId || typeof collectionId !== "string") {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    const body = await req.json();
    const updatedCollection = await Collection.findByIdAndUpdate(
      collectionId,
      body,
      { new: true }
    );

    if (!updatedCollection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(updatedCollection, { status: 200 });
  } catch (error) {
    console.error("[PATCH Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ✅ DELETE Collection by ID
export async function DELETE(
  req: NextRequest,
  context: { params: ParamsType }
) {
  try {
    await connectToDB();

    const collectionId = context?.params?.collectionId;

    if (!collectionId || typeof collectionId !== "string") {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    console.log("🗑️ Deleting collection:", collectionId);
    const deletedCollection = await Collection.findByIdAndDelete(collectionId);

    if (!deletedCollection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(
      { message: "Collection deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DELETE Collection Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
