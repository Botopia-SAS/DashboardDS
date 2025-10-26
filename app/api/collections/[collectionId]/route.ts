import { NextRequest, NextResponse } from "next/server";
import Collection from "@/lib/models/Collection";
import { connectToDB } from "@/lib/mongoDB";

// ✅ GET Collection by ID
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `collectionId` desde la URL
    const collectionId = req.nextUrl.pathname.split("/").pop();

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(collection, { status: 200 });
  } catch (error) {
    console.error("[GET Collection Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ PATCH Collection by ID (Extrae `collectionId` de la URL)
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `collectionId` desde la URL en lugar del body
    const collectionId = req.nextUrl.pathname.split("/").pop();

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    const updateData = await req.json(); // ✅ Body ahora solo contiene los datos a actualizar

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

    // ✅ Extraer `collectionId` desde la URL
    const collectionId = req.nextUrl.pathname.split("/").pop();

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }


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
