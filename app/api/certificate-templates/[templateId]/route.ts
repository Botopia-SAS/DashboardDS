import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import CertificateTemplate from "@/lib/models/CertificateTemplate";

// GET single template
export async function GET(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    await connectToDB();

    const template = await CertificateTemplate.findById(params.templateId);

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });
  } catch (err) {
    console.error("[certificate-template_GET]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT - Update template
export async function PUT(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
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
      isActive,
    } = body;

    const template = await CertificateTemplate.findById(params.templateId);

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    // Update fields
    if (name) template.name = name;
    if (classType) template.classType = classType.toUpperCase();
    if (pageSize) template.pageSize = pageSize;
    if (background) template.background = background;
    if (textElements) template.textElements = textElements;
    if (imageElements) template.imageElements = imageElements;
    if (shapeElements) template.shapeElements = shapeElements;
    if (availableVariables) template.availableVariables = availableVariables;
    if (typeof isDefault === 'boolean') template.isDefault = isDefault;
    if (typeof isActive === 'boolean') template.isActive = isActive;

    template.updatedAt = new Date();

    await template.save();

    return NextResponse.json(template, { status: 200 });
  } catch (err) {
    console.error("[certificate-template_PUT]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    await connectToDB();

    const template = await CertificateTemplate.findByIdAndDelete(params.templateId);

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    return NextResponse.json({ message: "Template deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("[certificate-template_DELETE]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
