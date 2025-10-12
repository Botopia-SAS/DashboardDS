import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import CertificateTemplate from "@/lib/models/CertificateTemplate";

// Initialize default templates
// NOTE: DATE uses BDI template by default (no need to create separate DATE template)
// This only creates templates if you want custom designs saved to database
export async function POST() {
  try {
    await connectToDB();

    // Check if templates already exist
    const existingTemplates = await CertificateTemplate.countDocuments();

    if (existingTemplates > 0) {
      return NextResponse.json({
        message: "Templates already exist. Use the editor to modify them.",
        count: existingTemplates
      }, { status: 200 });
    }

    // NOTE: We don't create a DATE template by default anymore
    // DATE will use the BDI template automatically
    // Only create BDI if you want a custom saved version

    // DATE Certificate Template (based on date_data.pdf)
    const dateTemplate = await CertificateTemplate.create({
      name: "DATE Certificate Default",
      classType: "DATE",
      pageSize: { width: 842, height: 595, orientation: 'landscape' },
      background: { type: 'pdf', value: '/date_data.pdf' },
      textElements: [
        // Student Name
        { id: 'text-1', content: '{{studentName}}', x: 390, y: 242, fontSize: 14, fontFamily: 'Times-Roman', fontWeight: 'bold', color: '#000000', align: 'center' },
        // Birth Date
        { id: 'text-2', content: '{{birthDate}}', x: 390, y: 295, fontSize: 12, fontFamily: 'Times-Roman', color: '#000000', align: 'center' },
        // Class Type
        { id: 'text-3', content: '{{classType}}', x: 390, y: 385, fontSize: 18, fontFamily: 'Times-Roman', fontWeight: 'bold', color: '#000000', align: 'center' },
        // Class Title
        { id: 'text-4', content: '{{classTitle}}', x: 390, y: 425, fontSize: 12, fontFamily: 'Times-Roman', color: '#000000', align: 'center' },
        // Certificate Number
        { id: 'text-5', content: '{{certn}}', x: 163, y: 394, fontSize: 12, fontFamily: 'Times-Roman', color: '#000000', align: 'center' },
        // Print Date
        { id: 'text-6', content: '{{printDate}}', x: 390, y: 495, fontSize: 12, fontFamily: 'Times-Roman', color: '#000000', align: 'center' },
      ],
      imageElements: [],
      shapeElements: [],
      availableVariables: [
        { key: 'studentName', label: 'Student Full Name', example: 'JOHN MICHAEL DOE' },
        { key: 'birthDate', label: 'Birth Date', example: '01/15/1990' },
        { key: 'classType', label: 'Class Type', example: 'DATE' },
        { key: 'classTitle', label: 'Class Title', example: 'D.A.T.E. Course' },
        { key: 'certn', label: 'Certificate Number', example: '12345' },
        { key: 'printDate', label: 'Print Date', example: 'Nov 15, 2025' },
      ],
      isDefault: true,
      isActive: true,
    });

    // BDI Certificate Template (programmatic design)
    const bdiTemplate = await CertificateTemplate.create({
      name: "BDI Certificate Default",
      classType: "BDI",
      pageSize: { width: 842, height: 595, orientation: 'landscape' },
      background: { type: 'color', value: '#FFFFFF' },
      textElements: [
        // Title
        { id: 'text-1', content: 'AFFORDABLE DRIVING TRAFFIC SCHOOL', x: 421, y: 70, fontSize: 24, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: 'text-2', content: 'CERTIFICATE OF COMPLETION', x: 421, y: 100, fontSize: 18, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: 'text-3', content: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406', x: 421, y: 130, fontSize: 14, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        { id: 'text-4', content: '561-969-0150 / 561-330-7007', x: 421, y: 150, fontSize: 14, fontFamily: 'Helvetica', color: '#000000', align: 'center' },

        // Certification text
        { id: 'text-5', content: 'This Certifies that the person named below has successfully completed the Florida Dept.', x: 421, y: 180, fontSize: 14, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        { id: 'text-6', content: 'Highway Safety and Motor Vehicles "Drive Safety & Driver Improvement Course"', x: 421, y: 200, fontSize: 14, fontFamily: 'Helvetica', color: '#000000', align: 'center' },

        // Student info
        { id: 'text-7', content: 'Citation No: {{citationNumber}}', x: 100, y: 230, fontSize: 14, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-8', content: 'Driver License Number: {{licenseNumber}}', x: 100, y: 260, fontSize: 14, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-9', content: 'Course Completion Date: {{courseDate}}', x: 100, y: 290, fontSize: 14, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-10', content: 'Name: {{studentName}}', x: 100, y: 320, fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-11', content: 'Course Location: {{address}}', x: 100, y: 350, fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },

        // Certificate number
        { id: 'text-12', content: 'Certificate #: {{certn}}', x: 500, y: 230, fontSize: 14, fontFamily: 'Helvetica', color: '#000000' },

        // Footer
        { id: 'text-13', content: '{{instructorName}}', x: 100, y: 100, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-14', content: 'AFFORDABLE DRIVING INSTRUCTOR', x: 100, y: 80, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-15', content: 'LICENSE # {{licenseNumber}}', x: 650, y: 100, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-16', content: 'AFFORDABLE DRIVING', x: 650, y: 80, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
      ],
      imageElements: [],
      shapeElements: [
        // Outer borders
        { id: 'shape-1', type: 'rectangle', x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 6 },
        { id: 'shape-2', type: 'rectangle', x: 30, y: 30, width: 782, height: 535, borderColor: '#000000', borderWidth: 4 },
        { id: 'shape-3', type: 'rectangle', x: 40, y: 40, width: 762, height: 515, borderColor: '#000000', borderWidth: 2 },
      ],
      availableVariables: [
        { key: 'studentName', label: 'Student Full Name', example: 'JOHN MICHAEL DOE' },
        { key: 'citationNumber', label: 'Citation Number', example: 'CIT-2025-001' },
        { key: 'licenseNumber', label: 'License Number', example: 'D123-456-78-910-0' },
        { key: 'courseDate', label: 'Course Completion Date', example: 'Nov 10, 2025' },
        { key: 'address', label: 'Course Location', example: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406' },
        { key: 'certn', label: 'Certificate Number', example: '12345' },
        { key: 'instructorName', label: 'Instructor Name', example: 'Jane Smith' },
      ],
      isDefault: true,
      isActive: true,
    });

    // ADI Certificate Template (with logo and green box)
    const adiTemplate = await CertificateTemplate.create({
      name: "ADI Certificate Default",
      classType: "ADI",
      pageSize: { width: 612, height: 792, orientation: 'portrait' },
      background: { type: 'color', value: '#FFFFFF' },
      textElements: [
        // Header
        { id: 'text-1', content: 'Affordable Driving and', x: 140, y: 45, fontSize: 16, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-2', content: 'Traffic School, Inc.', x: 140, y: 65, fontSize: 16, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-3', content: '3167 Forest Hill Blvd.', x: 140, y: 85, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-4', content: 'West Palm Beach, FL 33406', x: 140, y: 100, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-5', content: '(561) 969-0150 - (561) 330-7007', x: 140, y: 115, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },

        // Course info header
        { id: 'text-6', content: 'COURSE INFORMATION', x: 382, y: 45, fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-7', content: 'Course Date: {{courseDate}}', x: 382, y: 65, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-8', content: 'Course Time: {{courseTime}}', x: 382, y: 85, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-9', content: 'Course Location: {{courseAddress}}', x: 382, y: 105, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-10', content: 'Class Fee: $100.', x: 382, y: 125, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },

        // Student info
        { id: 'text-11', content: 'Dear: {{studentName}}', x: 50, y: 210, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-12', content: 'Certificate No: {{certn}}', x: 382, y: 210, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-13', content: '{{printDate}}', x: 50, y: 240, fontSize: 12, fontFamily: 'Helvetica', color: '#000000' },

        // Agreement text
        { id: 'text-14', content: 'Thank you for choosing Affordable Driving and Traffic School as the traffic school of your choice.', x: 50, y: 270, fontSize: 10, fontFamily: 'Helvetica', color: '#000000' },
        { id: 'text-15', content: 'ALL SEATS RESERVED! PAYMENT MUST BE MADE PRIOR TO CLASS DATE!', x: 50, y: 300, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-16', content: 'AFFORDABLE DRIVING AND TRAFFIC SCHOOL, INC. (ADTS)', x: 50, y: 330, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
        { id: 'text-17', content: '12 Hrs ADVANCED DRIVER IMPROVEMENT COURSE AGREEMENT', x: 50, y: 350, fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000' },
      ],
      imageElements: [
        { id: 'image-1', url: '/logo.png', x: 50, y: 20, width: 80, height: 80 },
      ],
      shapeElements: [
        // Green info box
        { id: 'shape-1', type: 'rectangle', x: 362, y: 10, width: 220, height: 120, color: '#CCFFCC', borderColor: '#000000', borderWidth: 1 },
        // Signature lines
        { id: 'shape-2', type: 'line', x: 50, y: 712, x2: 200, y2: 712, borderColor: '#000000', borderWidth: 1 },
        { id: 'shape-3', type: 'line', x: 362, y: 712, x2: 562, y2: 712, borderColor: '#000000', borderWidth: 1 },
        { id: 'shape-4', type: 'line', x: 362, y: 752, x2: 562, y2: 752, borderColor: '#000000', borderWidth: 1 },
      ],
      availableVariables: [
        { key: 'studentName', label: 'Student Full Name', example: 'JOHN MICHAEL DOE' },
        { key: 'courseDate', label: 'Course Date', example: 'Nov 10, 2025' },
        { key: 'courseTime', label: 'Course Time', example: '9:00 AM - 5:00 PM' },
        { key: 'courseAddress', label: 'Course Address', example: '3167 Forest Hill Blvd, West Palm Beach, FL' },
        { key: 'certn', label: 'Certificate Number', example: '12345' },
        { key: 'printDate', label: 'Print Date', example: 'November 15, 2025' },
      ],
      isDefault: true,
      isActive: true,
    });

    return NextResponse.json({
      message: "Default templates initialized successfully",
      templates: [
        { id: dateTemplate._id, name: dateTemplate.name, classType: dateTemplate.classType },
        { id: bdiTemplate._id, name: bdiTemplate.name, classType: bdiTemplate.classType },
        { id: adiTemplate._id, name: adiTemplate.name, classType: adiTemplate.classType },
      ]
    }, { status: 201 });

  } catch (err) {
    console.error("[certificate-templates_initialize]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
