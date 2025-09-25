import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      certificateNumber,
      printDate,
      courseCompletionDate,
      citationNumber,
      citationCounty,
      courseProvider,
      providerPhone,
      schoolName,
      schoolPhone,
      driversLicenseNumber,
      studentName,
      dateOfBirth,
      reasonAttending
    } = body;

    // Create a new PDF document using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header - State of Florida
    page.drawText("FLORIDA DEPARTMENT OF HIGHWAY SAFETY", {
      x: width / 2 - 150,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("AND MOTOR VEHICLES", {
      x: width / 2 - 90,
      y: height - 70,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("ADI COURSE COMPLETION CERTIFICATE", {
      x: width / 2 - 140,
      y: height - 100,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    let yPosition = height - 140;

    // Certificate information section
    const leftColumnFields = [
      { label: "Certificate Number:", value: certificateNumber },
      { label: "Print Date:", value: printDate },
      { label: "Course Completion Date:", value: courseCompletionDate },
    ];

    const rightColumnFields = [
      { label: "Citation Number:", value: citationNumber || "" },
      { label: "Citation County:", value: citationCounty || "" },
    ];

    // Left column
    leftColumnFields.forEach((field, index) => {
      const y = yPosition - (index * 25);
      page.drawText(field.label, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(field.value, {
        x: 180,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    // Right column
    rightColumnFields.forEach((field, index) => {
      const y = yPosition - (index * 25);
      page.drawText(field.label, {
        x: 320,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(field.value, {
        x: 450,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 100;

    // Provider information section
    const providerFields = [
      { label: "Name of Course Provider:", value: courseProvider },
      { label: "Provider Phone:", value: providerPhone },
      { label: "Name of School:", value: schoolName },
      { label: "School Phone:", value: schoolPhone },
    ];

    providerFields.forEach((field, index) => {
      const y = yPosition - (index * 25);
      page.drawText(field.label, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(field.value, {
        x: 180,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 120;

    // Student information section
    const studentFields = [
      { label: "Drivers License Number:", value: driversLicenseNumber },
      { label: "Student Name:", value: studentName },
      { label: "Date Of Birth:", value: dateOfBirth },
      { label: "Reason Attending:", value: reasonAttending },
    ];

    studentFields.forEach((field, index) => {
      const y = yPosition - (index * 25);
      page.drawText(field.label, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(field.value, {
        x: 180,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 120;

    // Certification statement
    page.drawText("CERTIFICATION", {
      x: width / 2 - 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    page.drawText("I certify that the above named student has successfully completed an", {
      x: width / 2 - 180,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 15;
    page.drawText("ADI (Aggressive Driver Improvement) course as required by Florida", {
      x: width / 2 - 180,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 15;
    page.drawText("Statute 318.1451 and Administrative Rule 15A-6.012, F.A.C.", {
      x: width / 2 - 150,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 40;

    // Signature area
    page.drawText("_________________________________", {
      x: 50,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Authorized Signature", {
      x: 50,
      y: yPosition - 15,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Date: ________________", {
      x: 350,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    yPosition -= 50;

    // Footer
    page.drawText("This certificate is valid only when bearing an original signature and official seal.", {
      x: width / 2 - 200,
      y: yPosition,
      size: 8,
      font,
      color: rgb(0, 0, 0),
    });

    // Convert PDF to bytes
    const pdfBytes = await pdfDoc.save();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ADI_Certificate_${certificateNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating ADI certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate ADI certificate' },
      { status: 500 }
    );
  }
}