"use client";

import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface BdiCertificateData {
  certificateNumber: string;
  printDate: string;
  courseCompletionDate: string;
  citationNumber: string;
  citationCounty: string;
  courseProvider: string;
  providerPhone: string;
  schoolName: string;
  schoolPhone: string;
  driversLicenseNumber: string;
  studentName: string;
  dateOfBirth: string;
  reasonAttending: string;
}

export function useBdiCertificateDownloader() {
  const downloadBdiCertificate = useCallback(async (data: BdiCertificateData) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Header - State of Florida
      page.drawText("State of Florida", {
        x: width / 2 - 60,
        y: height - 50,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("Department of Highway Safety and Motor Vehicles", {
        x: width / 2 - 150,
        y: height - 70,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // Title box
      page.drawRectangle({
        x: 40,
        y: height - 110,
        width: width - 80,
        height: 25,
        color: rgb(0.8, 0.8, 0.8),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText("Course Completion Receipt", {
        x: width / 2 - 90,
        y: height - 105,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Horizontal line
      page.drawLine({
        start: { x: 40, y: height - 130 },
        end: { x: width - 40, y: height - 130 },
        thickness: 2,
        color: rgb(0, 0, 0),
      });

      let yPosition = height - 160;

      // Certificate information section
      const leftColumnFields = [
        { label: "Certificate Number:", value: data.certificateNumber },
        { label: "Print Date:", value: data.printDate },
        { label: "Course Completion Date:", value: data.courseCompletionDate },
        { label: "Citation Number:", value: data.citationNumber },
        { label: "Citation County:", value: data.citationCounty },
      ];

      const rightColumnFields = [
        { label: "Name of Course Provider:", value: data.courseProvider },
        { label: "Provider Phone:", value: data.providerPhone },
        { label: "Name of School:", value: data.schoolName },
        { label: "School Phone:", value: data.schoolPhone },
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
          x: 300, // Moved left from 320 to give more space for values
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        
        // Special handling for school name - if it's too long, use smaller font and adjust position
        let fontSize = 10;
        let xPosition = 430; // Adjusted from 450 to 430
        
        if (field.label === "Name of School:" && field.value.length > 25) {
          fontSize = 8; // Smaller font for long school names
          xPosition = 425; // Slightly adjust position for long names
        }
        
        page.drawText(field.value, {
          x: xPosition,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      // Horizontal line separator
      page.drawLine({
        start: { x: 40, y: yPosition - 140 },
        end: { x: width - 40, y: yPosition - 140 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 170;

      // Student information section
      const studentFields = [
        { label: "Drivers License Number:", value: data.driversLicenseNumber },
        { label: "Student Name:", value: data.studentName },
        { label: "Date Of Birth:", value: data.dateOfBirth },
        { label: "Reason Attending:", value: data.reasonAttending },
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

      // Bottom section
      yPosition -= 150;

      page.drawText("State of Florida", {
        x: width / 2 - 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("Department of Highway Safety and Motor Vehicles", {
        x: width / 2 - 120,
        y: yPosition - 20,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText("Driver School Inquiry:", {
        x: width / 2 - 70,
        y: yPosition - 40,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      // Convert PDF to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BDI_Certificate_${data.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error generating BDI certificate PDF:', error);
      return false;
    }
  }, []);

  return { downloadBdiCertificate };
}