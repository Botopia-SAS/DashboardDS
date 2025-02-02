import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import Package from "@/lib/models/Package"; // Importar el modelo correcto

// ✅ GET ALL PACKAGES
export async function GET() {
  try {
    await connectToDB();
    const packages = await Package.find({});
    return NextResponse.json(packages, { status: 200 });
  } catch (error) {
    console.error("[GET_PACKAGES_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch packages" }, { status: 500 });
  }
}

// ✅ CREATE A NEW PACKAGE
export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();
    
    // ✅ Crear un nuevo Package sin `description`
    const newPackage = new Package({
      title: body.title,
      media: body.media || [], // ✅ Asegurar que media es un array
      price: body.price,
      category: body.category,
      type: body.type,
      buttonLabel: body.buttonLabel,
    });

    await newPackage.save();
    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error("[POST_PACKAGE_ERROR]", error);
    return NextResponse.json({ message: "Failed to create package" }, { status: 500 });
  }
}
