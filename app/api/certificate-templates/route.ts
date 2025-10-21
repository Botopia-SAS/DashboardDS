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

    console.log(`🔍 Certificate templates API - Requested classType: "${classType}"`);

    const query: any = { isActive: true };

    if (classType) {
      // Normalize classType for comparison - handle both spaces and hyphens
      const normalizedClassType = classType.toUpperCase().trim();
      console.log(`📝 Searching for classType: "${normalizedClassType}"`);
      
      // Try exact match first
      query.classType = normalizedClassType;
      
      // Also try to find templates that might have different formats
      // (e.g., "ANGER-MANAGMENT" vs "ANGER MANAGMENT")
      const alternativeQuery = { 
        isActive: true,
        $or: [
          { classType: normalizedClassType },
          { classType: normalizedClassType.replace(/-/g, ' ') },
          { classType: normalizedClassType.replace(/\s+/g, '-') }
        ]
      };
      
      console.log(`🔎 Using alternative query:`, JSON.stringify(alternativeQuery, null, 2));
      const templates = await CertificateTemplate.find(alternativeQuery).sort({ createdAt: -1 });
      
      console.log(`📋 Found ${templates.length} templates`);
      templates.forEach(template => {
        console.log(`  - ${template.name} (classType: "${template.classType}")`);
      });
      
      return NextResponse.json(templates, { status: 200 });
    }

    if (defaultOnly) {
      query.isDefault = true;
    }

    const templates = await CertificateTemplate.find(query).sort({ createdAt: -1 });
    console.log(`📋 Found ${templates.length} templates (no classType filter)`);

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
      certificatesPerPage,
      background,
      textElements,
      imageElements,
      shapeElements,
      checkboxElements,
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
    console.log(`📄 Certificates Per Page: ${certificatesPerPage || 1}`);
    console.log(`📝 Text elements: ${textElements?.length || 0}`);
    console.log(`🖼️ Image elements: ${imageElements?.length || 0}`);
    console.log(`🔲 Shape elements: ${shapeElements?.length || 0}`);
    console.log(`☑️ Checkbox elements: ${checkboxElements?.length || 0}`);

    // UPSERT: Find existing template for this classType and update it, or create new one
    const template = await CertificateTemplate.findOneAndUpdate(
      { classType: upperClassType }, // Find by classType
      {
        name,
        classType: upperClassType,
        pageSize: pageSize || { width: 842, height: 595, orientation: 'landscape' },
        certificatesPerPage: certificatesPerPage || 1, // Default to 1 if not provided
        background,
        textElements: textElements || [],
        imageElements: imageElements || [],
        shapeElements: shapeElements || [],
        checkboxElements: checkboxElements || [],
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
