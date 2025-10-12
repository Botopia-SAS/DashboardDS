import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import CertificateTemplate from "@/lib/models/CertificateTemplate";

// GET all templates or filter by classType
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const classType = searchParams.get("classType");
    const defaultOnly = searchParams.get("default") === "true";

    let query: any = { isActive: true };

    if (classType) {
      query.classType = classType.toUpperCase();
    }

    if (defaultOnly) {
      query.isDefault = true;
    }

    const templates = await CertificateTemplate.find(query).sort({ createdAt: -1 });

    return NextResponse.json(templates, { status: 200 });
  } catch (err) {
    console.error("[certificate-templates_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST - Create new template
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const {
      name,
      classType,
      pageSize,
      background,
      textElements,
      imageElements,
      shapeElements,
      availableVariables,
      isDefault,
      createdBy,
    } = body;

    // Validate required fields
    if (!name || !classType) {
      return new NextResponse("Name and classType are required", { status: 400 });
    }

    // Create new template
    const newTemplate = await CertificateTemplate.create({
      name,
      classType: classType.toUpperCase(),
      pageSize: pageSize || { width: 842, height: 595, orientation: 'landscape' },
      background,
      textElements: textElements || [],
      imageElements: imageElements || [],
      shapeElements: shapeElements || [],
      availableVariables: availableVariables || [],
      isDefault: isDefault || false,
      createdBy,
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (err) {
    console.error("[certificate-templates_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
