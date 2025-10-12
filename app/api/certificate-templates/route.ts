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

    const query: any = { isActive: true };

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

// POST - Create or Update template (UPSERT - only one template per classType)
export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    console.log('📥 Received certificate template data:', JSON.stringify(body, null, 2));

    const {
      name,
      classType,
      pageSize,
      background,
      textElements,
      imageElements,
      shapeElements,
      availableVariables,
      createdBy,
    } = body;

    // Validate required fields
    if (!name || !classType) {
      return new NextResponse("Name and classType are required", { status: 400 });
    }

    const upperClassType = classType.toUpperCase();
    console.log(`🔍 Upserting template for classType: ${upperClassType}`);
    console.log(`📄 Background:`, background);
    console.log(`📝 Text elements: ${textElements?.length || 0}`);
    console.log(`🖼️ Image elements: ${imageElements?.length || 0}`);
    console.log(`🔲 Shape elements: ${shapeElements?.length || 0}`);

    // UPSERT: Find existing template for this classType and update it, or create new one
    const template = await CertificateTemplate.findOneAndUpdate(
      { classType: upperClassType }, // Find by classType
      {
        name,
        classType: upperClassType,
        pageSize: pageSize || { width: 842, height: 595, orientation: 'landscape' },
        background,
        textElements: textElements || [],
        imageElements: imageElements || [],
        shapeElements: shapeElements || [],
        availableVariables: availableVariables || [],
        isDefault: true, // Always set as default (it's the only one for this classType)
        isActive: true,  // Always active
        createdBy,
      },
      {
        new: true,        // Return the updated document
        upsert: true,     // Create if doesn't exist
        runValidators: true
      }
    );

    console.log(`✅ Template upserted successfully:`, template._id);
    console.log(`💾 Saved background:`, template.background);

    return NextResponse.json(template, { status: 200 });
  } catch (err) {
    console.error("[certificate-templates_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
