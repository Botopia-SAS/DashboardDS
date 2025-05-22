"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function useDateCertificateGenerator() {
  const generateDateCertificatePDF = useCallback(async (user: Student) => {
    const { last_name, first_name, midl, birthDate, certn, courseDate } = user;

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

    // Tipo de certificado DATE específico
    page.drawText(
      'Highway Safety and Motor Vehicles "Driver Education Program Course"',
      {
        x: width / 2 - 270,
        y: height - 200,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      }
    );

    // DATE certificate - Centered course completion date
    page.drawText(`Course Completion Date: ${courseDate}`, {
      x: width / 2 - 100,
      y: height - 240,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // DATE certificate - Centered student name with more visibility
    page.drawText("Name:", {
      x: width / 2 - 150,
      y: height - 270,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${first_name} ${midl || ""} ${last_name}`, {
      x: width / 2 - 80,
      y: height - 270,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // DATE certificate - Birth date
    page.drawText("Birth Date:", {
      x: width / 2 - 150,
      y: height - 300,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${birthDate}`, {
      x: width / 2 - 60,
      y: height - 300,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // DATE certificate - Certificate number
    page.drawText("Certificate #:", {
      x: width / 2 - 150,
      y: height - 330,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${certn}`, {
      x: width / 2 - 50,
      y: height - 330,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Add footer
    page.drawText("MARÍA D. SÁNCHEZ", {
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

    page.drawText("LICENSE #", {
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

  return { generateDateCertificatePDF };
}
