"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function useCertificateGenerator() {
  const generateCertificatePDF = useCallback(async (user: Student) => {
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
    page.drawText("AFFORDABLE DRIVING and TRAFFIC SCHOOL, INC.", {
      x: width / 2 - 300,
      y: height - 70,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("3167 Forest Hill Blvd. West Palm Beach, Fl 33406", {
      x: width / 2 - 180,
      y: height - 100,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("(561) 969-0150 - (561) 330-7007", {
      x: width / 2 - 100,
      y: height - 120,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });

    // Add "This Certifies That"
    page.drawText("This Certifies That:", {
      x: width / 2 - 100,
      y: height - 180,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    // Add student name
    page.drawText(`${first_name} ${midl || ""} ${last_name}`, {
      x: width / 2 - 150,
      y: height - 210,
      size: 22,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Add certificate number below the student name
    page.drawText(`Certificate N°: ${certn}`, {
      x: width / 2 - 100,
      y: height - 240,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    // Add birth date below the certificate number in instructor style
    page.drawText("Date of Birth:", {
      x: width / 2 - 70,
      y: height - 270,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${birthDate}`, {
      x: width / 2 - 70,
      y: height - 290,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Add program details
    page.drawText("Has successfully completed the", {
      x: width / 2 - 140,
      y: height - 310,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("D.A.T.E.", {
      x: width / 2 - 40,
      y: height - 340,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("Drug, Alcohol and Traffic Education Program", {
      x: width / 2 - 180,
      y: height - 360,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Pursuant to Section 322.095, Florida Statutes", {
      x: width / 2 - 180,
      y: height - 390,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    // Add instructor signature image
    try {
      const instructorSignatureBytes = await fetch(
        "/firma_instructor.png"
      ).then((res) => res.arrayBuffer());
      const instructorSignature = await pdfDoc.embedPng(
        instructorSignatureBytes
      );
      const signatureDims = instructorSignature.scale(0.8);

      page.drawImage(instructorSignature, {
        x: 100,
        y: 100,
        width: signatureDims.width,
        height: signatureDims.height,
      });
    } catch (error) {
      console.error("Error loading instructor signature:", error);
    }

    // Add footer with instructor, date, and director
    page.drawText("Instructor", {
      x: 130,
      y: 60,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Nelson E. Guarin", {
      x: width - 300,
      y: 100,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("Director", {
      x: width - 300,
      y: 80,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Date:`, {
      x: width / 2 - 50,
      y: 100,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${courseDate}`, {
      x: width / 2 - 50,
      y: 80,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Add seals (left and right) with increased size
    try {
      const sealImageBytes = await fetch("/sello1.png").then((res) =>
        res.arrayBuffer()
      );
      const sealImage = await pdfDoc.embedPng(sealImageBytes);
      const sealDims = sealImage.scale(0.7); // Increased scale for larger size

      page.drawImage(sealImage, {
        x: 100,
        y: height / 2 - sealDims.height / 2,
        width: sealDims.width,
        height: sealDims.height,
      });

      const sealImageBytes2 = await fetch("/sello2.png").then((res) =>
        res.arrayBuffer()
      );
      const sealImage2 = await pdfDoc.embedPng(sealImageBytes2);
      const sealDims2 = sealImage2.scale(0.7); // Increased scale for larger size

      page.drawImage(sealImage2, {
        x: width - 200,
        y: height / 2 - sealDims2.height / 2,
        width: sealDims2.width,
        height: sealDims2.height,
      });
    } catch (error) {
      console.error("Error loading seal images:", error);
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  }, []);

  return { generateCertificatePDF };
}
