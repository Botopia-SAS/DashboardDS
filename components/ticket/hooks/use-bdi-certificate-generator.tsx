"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function useBdiCertificateGenerator() {
  const generateBdiCertificatePDF = useCallback(async (user: Student) => {
    const {
      last_name,
      first_name,
      midl,
      certn,
      courseDate,
      licenseNumber,
      address,
      citation_number,
      instructorName,
    } = user;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // Landscape A4 dimensions in points
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw outer borders
    const borderWidths = [6, 4, 2];
    borderWidths.forEach((borderWidth, index) => {
      page.drawRectangle({
        x: 20 + index * 10,
        y: 20 + index * 10,
        width: width - 40 - index * 20,
        height: height - 40 - index * 20,
        borderColor: rgb(0, 0, 0),
        borderWidth,
      });
    });

    // Add title
    page.drawText("AFFORDABLE DRIVING TRAFFIC SCHOOL", {
      x: width / 2 - 250,
      y: height - 70,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("CERTIFICATE OF COMPLETION", {
      x: width / 2 - 150,
      y: height - 100,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406", {
      x: width / 2 - 180,
      y: height - 130,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("561-969-0150 / 561-330-7007", {
      x: width / 2 - 90,
      y: height - 150,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Add "This Certifies That"
    page.drawText(
      "This Certifies that the person named below has successfully completed the Florida Dept.",
      {
        x: width / 2 - 300,
        y: height - 180,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      }
    );

    // BDI specific text
    page.drawText(
      'Highway Safety and Motor Vehicles "Drive Safety & Driver Improvement Course"',
      {
        x: width / 2 - 270,
        y: height - 200,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      }
    );

    // Citation No
    page.drawText(`Citation No: ${citation_number || ""}`, {
      x: 100,
      y: height - 230,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Driver License Number
    page.drawText(`Driver License Number: ${licenseNumber || ""}`, {
      x: 100,
      y: height - 260,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Course Completion Date
    page.drawText(`Course Completion Date: ${courseDate}`, {
      x: 100,
      y: height - 290,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Name
    page.drawText("Name:", {
      x: 100,
      y: height - 320,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${first_name} ${midl || ""} ${last_name}`, {
      x: 150,
      y: height - 320,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Course Location
    page.drawText("Course Location:", {
      x: 100,
      y: height - 350,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(
      `${address || "3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406"}`,
      {
        x: 220,
        y: height - 350,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      }
    );

    // Certificate Number
    page.drawText(`Certificate #: ${certn}`, {
      x: 500,
      y: height - 230,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Add footer
    page.drawText(`${instructorName?.toUpperCase()}`, {
      x: 100,
      y: 100,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("AFFORDABLE DRIVING INSTRUCTOR", {
      x: 100,
      y: 80,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`LICENSE # ${licenseNumber}`, {
      x: 650,
      y: 100,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("AFFORDABLE DRIVING", {
      x: 650,
      y: 80,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Convert the PDF to bytes and create a blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  }, []);

  return { generateBdiCertificatePDF };
}
