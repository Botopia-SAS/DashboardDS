import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import Package from "@/lib/models/Package";

// ✅ GET SINGLE PACKAGE
export async function GET(req: Request, context: { params: { packageId?: string } }) {
  try {
    await connectToDB();

    console.log("📌 params en API:", context.params); // ✅ Ver qué valores llegan

    const { packageId } = context.params;

    if (!packageId || packageId === "undefined") {
      return NextResponse.json({ message: "❌ Package ID is missing or invalid" }, { status: 400 });
    }

    const packageItem = await Package.findById(packageId);
    if (!packageItem) {
      return NextResponse.json({ message: "❌ Package not found" }, { status: 404 });
    }

    return NextResponse.json(packageItem, { status: 200 });
  } catch (error) {
    console.error("[GET_PACKAGE_ERROR]", error);
    return NextResponse.json({ message: "❌ Failed to fetch package" }, { status: 500 });
  }
}


// ✅ UPDATE PACKAGE
export async function PATCH(req: Request, context: { params: Promise<{ packageId?: string }> }) {
  try {
    await connectToDB();
    const body = await req.json();

    const { packageId } = await context.params; // ✅ `await` aquí para resolver `params`

    if (!packageId) {
      return NextResponse.json({ message: "Package ID is required" }, { status: 400 });
    }

    const updatedPackage = await Package.findByIdAndUpdate(packageId, body, { new: true });
    if (!updatedPackage) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPackage, { status: 200 });
  } catch (error) {
    console.error("[PATCH_PACKAGE_ERROR]", error);
    return NextResponse.json({ message: "Failed to update package" }, { status: 500 });
  }
}

// ✅ DELETE PACKAGE
export async function DELETE(req: Request, context: { params: Promise<{ packageId?: string }> }) {
  try {
    await connectToDB();

    const { packageId } = await context.params; // ✅ `await` aquí para resolver `params`

    if (!packageId) {
      return NextResponse.json({ message: "Package ID is required" }, { status: 400 });
    }

    const deletedPackage = await Package.findByIdAndDelete(packageId);
    if (!deletedPackage) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Package deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_PACKAGE_ERROR]", error);
    return NextResponse.json({ message: "Failed to delete package" }, { status: 500 });
  }
}
