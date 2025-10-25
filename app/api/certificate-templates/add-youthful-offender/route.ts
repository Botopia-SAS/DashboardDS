import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import CertificateTemplate from "@/lib/models/CertificateTemplate";
import { getYouthfulOffenderTemplate } from "@/lib/defaultTemplates/youthfulOffenderTemplate";

// Add or update youthful offender template
export async function POST() {
  try {
    await connectToDB();

    // Check if youthful offender template already exists
    const existingTemplate = await CertificateTemplate.findOne({
      classType: 'YOUTHFUL OFFENDER CLASS',
      isActive: true
    });

    const templateData = getYouthfulOffenderTemplate();

    if (existingTemplate) {
      // Update existing template
      console.log('🔄 Updating existing youthful offender template...');
      const updated = await CertificateTemplate.findByIdAndUpdate(
        existingTemplate._id,
        templateData,
        { new: true }
      );

      return NextResponse.json({
        message: "Youthful offender template updated successfully",
        template: updated ? {
          id: updated._id,
          name: updated.name,
          classType: updated.classType
        } : null
      }, { status: 200 });
    } else {
      // Create new template
      console.log('➕ Creating new youthful offender template...');
      const newTemplate = await CertificateTemplate.create(templateData);

      return NextResponse.json({
        message: "Youthful offender template created successfully",
        template: {
          id: newTemplate._id,
          name: newTemplate.name,
          classType: newTemplate.classType
        }
      }, { status: 201 });
    }

  } catch (err) {
    console.error("[add-youthful-offender]", err);
    return new NextResponse(`Internal Server Error: ${err}`, { status: 500 });
  }
}
