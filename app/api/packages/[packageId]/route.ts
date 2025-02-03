import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import Package from "@/lib/models/Package";
import type { Params } from "next/dist/server/request/params"; // Importación opcional en Next 14

// ✅ GET SINGLE PACKAGE
export async function GET(req: Request, context: { params: Params }) {
  try {
    await connectToDB();

    const { packageId } = context.params;

    if (!packageId) {
      return NextResponse.json({ message: "Package ID is required" }, { status: 400 });
    }

    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return NextResponse.json({ message: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(packageData, { status: 200 });
  } catch (error) {
    console.error("[GET_PACKAGE_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Params }) {
  try {
    await connectToDB();
    const body = await req.json();

    const { packageId } = context.params;

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

// ✅ DELETE - Eliminar un paquete
export async function DELETE(req: Request, context: { params: Params }) {
  try {
    await connectToDB();

    const { packageId } = context.params;

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
