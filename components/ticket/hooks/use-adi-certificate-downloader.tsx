"use client";

import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface AdiCertificateData {
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

export function useAdiCertificateDownloader() {
  const downloadAdiCertificate = useCallback(async (data: AdiCertificateData) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Header - Florida Department
      page.drawText("FLORIDA DEPARTMENT OF HIGHWAY SAFETY", {
        x: width / 2 - 140,
        y: height - 50,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("AND MOTOR VEHICLES", {
        x: width / 2 - 70,
        y: height - 70,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Title box
      page.drawRectangle({
        x: 40,
        y: height - 110,
        width: width - 80,
        height: 30,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText("ADI COURSE COMPLETION CERTIFICATE", {
        x: width / 2 - 120,
        y: height - 102,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      let yPosition = height - 150;

      // Certificate information - Left Column
      const leftColumnFields = [
        { label: "Certificate Number:", value: data.certificateNumber },
        { label: "Print Date:", value: data.printDate },
        { label: "Course Completion Date:", value: data.courseCompletionDate },
      ];

      // Right Column
      const rightColumnFields = [
        { label: "Citation Number:", value: data.citationNumber },
        { label: "Citation County:", value: data.citationCounty },
      ];

      // Draw left column
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

      // Draw right column
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

      // Provider information
      const providerFields = [
        { label: "Name of Course Provider:", value: data.courseProvider },
        { label: "Provider Phone:", value: data.providerPhone },
        { label: "Name of School:", value: data.schoolName },
        { label: "School Phone:", value: data.schoolPhone },
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

        // Special handling for long text
        let fontSize = 10;
        let xPosition = 180;

        if (field.value.length > 30) {
          fontSize = 9;
          xPosition = 175;
        }

        page.drawText(field.value, {
          x: xPosition,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      yPosition -= 130;

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


      // Convert PDF to bytes
      const pdfBytes = await pdfDoc.save();

      // Create download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ADI_Certificate_${data.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error generating ADI certificate PDF:', error);
      return false;
    }
  }, []);

  return { downloadAdiCertificate };
}