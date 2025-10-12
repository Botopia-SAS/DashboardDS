"use client";

import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AdiCertificateData } from "../types";

export function usePdfGenerator() {
  const generatePDF = useCallback(async (
    data: AdiCertificateData,
    previewElement: HTMLElement
  ): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size dimensions in points (8.5x11 inches)
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load logo image
    const logoResponse = await fetch("/logo.png");
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoArrayBuffer);

    // Draw logo
    const logoWidth = 80;
    const logoHeight = 80;
    page.drawImage(logoImage, {
      x: 50,
      y: height - 100,
      width: logoWidth,
      height: logoHeight,
    });

    // Header Section
    page.drawText("Affordable Driving and", {
      x: 140,
      y: height - 45,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("Traffic School, Inc.", {
      x: 140,
      y: height - 65,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("3167 Forest Hill Blvd.", {
      x: 140,
      y: height - 85,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("West Palm Beach, FL 33406", {
      x: 140,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("(561) 969-0150 - (561) 330-7007", {
      x: 140,
      y: height - 115,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Course Information Section with green background
    page.drawRectangle({
      x: width - 250,
      y: height - 130,
      width: 220,
      height: 120,
      color: rgb(0.8, 1, 0.8), // Light green color
    });

    page.drawText("COURSE INFORMATION", {
      x: width - 230,
      y: height - 45,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Format course date
    const formatDate = (dateString: string) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return date.toLocaleDateString("en-US", options);
    };

    page.drawText("Course Date:", {
      x: width - 230,
      y: height - 65,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const formattedDate = formatDate(data.courseDate);
    const dateLines = formattedDate.match(/.{1,20}(\s|$)/g) || [formattedDate];
    dateLines.forEach((line, index) => {
      page.drawText(line.trim(), {
        x: width - 150,
        y: height - 65 - (index * 12),
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    page.drawText("Course Time:", {
      x: width - 230,
      y: height - 90,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(data.courseTime || "N/A", {
      x: width - 150,
      y: height - 90,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Course Location:", {
      x: width - 230,
      y: height - 113,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Split address into multiple lines if needed
    const addressText = data.courseAddress || "N/A";
    const addressMaxWidth = 70; // Width in points for the address area
    const addressLines: string[] = [];
    const words = addressText.split(' ');
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, 8);

      if (textWidth < addressMaxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) addressLines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) addressLines.push(currentLine);

    addressLines.forEach((line, index) => {
      page.drawText(line, {
        x: width - 130, // Moved a bit more to the left from -120 to -130
        y: height - 113 - (index * 10),
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });
    });

    page.drawText("Class Fee: $100.", {
      x: width - 230,
      y: height - 125,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Student information section
    page.drawText("Dear:", {
      x: 50,
      y: height - 210,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const studentName = `${data.firstName} ${data.middleInitial ? data.middleInitial + ' ' : ''}${data.lastName}`;
    page.drawText(studentName, {
      x: 90,
      y: height - 210,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Certificate Number
    page.drawText(`Certificate No: ${data.certificateNumber || ""}`, {
      x: width - 230,
      y: height - 210,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Date
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    page.drawText(currentDate, {
      x: 50,
      y: height - 240,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Agreement text with word wrapping
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, 10);

        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const thankYouText = wrapText(
      "Thank you for choosing Affordable Driving and Traffic School as the traffic school of your choice.",
      400
    );

    thankYouText.forEach((line, index) => {
      page.drawText(line, {
        x: 50,
        y: height - 270 - index * 15,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    });

    page.drawText(
      "ALL SEATS RESERVED! PAYMENT MUST BE MADE PRIOR TO CLASS DATE!",
      {
        x: 50,
        y: height - 300,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      }
    );

    // ADI Agreement section
    page.drawText("AFFORDABLE DRIVING AND TRAFFIC SCHOOL, INC. (ADTS)", {
      x: 50,
      y: height - 330,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("12 Hrs ADVANCED DRIVER IMPROVEMENT COURSE AGREEMENT", {
      x: 50,
      y: height - 350,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Agreement paragraphs with word wrapping
    const agreementText = [
      "This course combines Florida Traffic laws and awareness program which will affect your ability to avoid future traffic violations.",
      "It is mandatory that you attend class date(s) scheduled. If you miss any session(s) scheduled you must re-register and pay a $100.00 fee.",
      "To cancel or reschedule a class, you will be charged a $100.00 fee to reschedule, if not done two days in advance.",
      "Classes begin at the times scheduled. Late arrivals will receive NO CREDIT. Class breaks are designated for designed time frame. If you are late",
      "returning you will receive NO CREDIT for attending. Both traffic situations require registration and a $100.00 registration fee.",
      "Fees are NOT REFUNDABLE and payments implies consent.",
      "",
      "WARNING! IF YOU HAVE A SUSPENDED LICENSE OR LICENSE THAT WILL BE SUSPENDED BY THE STATE OF FLORIDA,",
      "YOU SHOULD IMMEDIATELY CONTACT THE BUREAU OF DRIVER IMPROVEMENT AT (850) 617-2000 OR 2900 APALACHEE PKWY,",
      "TALLAHASSEE, FL 32399-0575. TO KNOW IF YOU ARE ELIGIBLE TO TAKE THIS CLASS. IF YOU HAVE ANY QUESTIONS,",
      "PLEASE CALL OR VISIT OUR OFFICE. REMEMBER, IMMEDIATELY AFTER COMPLETION OF THIS CLASS, YOU MUST GO",
      "TO THE LOCAL DMV OFFICE TO GET YOUR DRIVER LICENSE REINSTATED AND PAY REINSTATEMENT FEES.",
    ];

    let yPos = height - 380;
    agreementText.forEach((text) => {
      if (text === "") {
        yPos -= 10;
        return;
      }

      if (text.length > 90) {
        const wrappedLines = wrapText(text, 450);
        wrappedLines.forEach((line) => {
          page.drawText(line, {
            x: 50,
            y: yPos,
            size: 10,
            font: text.startsWith("WARNING!") ? boldFont : font,
            color: rgb(0, 0, 0),
          });
          yPos -= 15;
        });
      } else {
        page.drawText(text, {
          x: 50,
          y: yPos,
          size: 10,
          font: text.startsWith("WARNING!") ? boldFont : font,
          color: rgb(0, 0, 0),
        });
        yPos -= 20;
      }
    });

    // Signature section at the bottom with more space
    // Draw signature lines - Date on left, Student Signature on right (same level), ADTS Officer on right (bottom)
    page.drawLine({
      start: { x: 50, y: 80 },
      end: { x: 200, y: 80 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: width - 250, y: 80 },
      end: { x: width - 50, y: 80 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: width - 250, y: 30 },
      end: { x: width - 50, y: 30 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });

    page.drawText("Date", {
      x: 50,
      y: 60,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("Student Signature", {
      x: width - 200,
      y: 60,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("ADTS Officer", {
      x: width - 200,
      y: 12,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Convert the PDF to bytes and create a blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  }, []);

  return { generatePDF };
}
