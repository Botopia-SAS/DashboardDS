"use client";

import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

export interface GovCertificateData {
  certificateNumber: string;
  courseTime: "4hr" | "6hr" | "8hr";
  citationNumber: string;
  court: string;
  county: string;
  attendanceReason: "court_order" | "volunteer" | "ticket";
  firstName: string;
  middleInitial: string;
  lastName: string;
  licenseNumber: string;
  completionDate: string;
}

export function useGovCertificateGenerator() {
  const drawX = (
    page: PDFPage,
    x: number,
    y: number,
    checked: boolean,
    font: PDFFont
  ) => {
    // Draw X if checked (no border)
    if (checked) {
      page.drawText("X", {
        x,
        y,
        size: 16,
        font,
        color: rgb(0.7, 0.2, 0.2),
      });
    }
  };

  const generateGovCertificatePDF = useCallback(
    async (data: GovCertificateData) => {
      const {
        certificateNumber,
        courseTime,
        citationNumber,
        court,
        county,
        attendanceReason,
        firstName,
        middleInitial,
        lastName,
        licenseNumber,
        completionDate,
      } = data;

      // Load the certificate template image
      const templatePath = "/Certificate.jpg";
      const imageBytes = await fetch(templatePath).then((res) =>
        res.arrayBuffer()
      );

      const pdfDoc = await PDFDocument.create();
      const templateImage = await pdfDoc.embedJpg(imageBytes);

      // Create page with landscape dimensions matching the certificate
      const page = pdfDoc.addPage([1275, 540]); // Approximate dimensions for the certificate
      const { width, height } = page.getSize();

      // Draw the template image
      page.drawImage(templateImage, {
        x: 0,
        y: 0,
        width,
        height,
      });

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Helper function to convert CSS % to PDF coordinates
      // CSS top % is from top, PDF y is from bottom
      const getY = (topPercent: number) => {
        return height * (1 - topPercent / 100);
      };

      // Certificate Number - top: "50.5%", left: "87%"
      page.drawText(certificateNumber, {
        x: width * 0.855,
        y: getY(48),
        size: 18,
        font: boldFont,
        color: rgb(0.7, 0.2, 0.2),
      });

      // Course Time X marks - top: "35.8%", centered around left: "54.2%"
      const courseTimeY = getY(40.8);
      const courseTimeStartX = width * 0.50; // Starting position
      drawX(page, courseTimeStartX, courseTimeY, courseTime === "4hr", boldFont);
      drawX(page, courseTimeStartX + 78, courseTimeY, courseTime === "6hr", boldFont);
      drawX(page, courseTimeStartX + 154, courseTimeY, courseTime === "8hr", boldFont);

      // Citation/Case No - top: "47%", left: "19.5%"
      if (citationNumber) {
        page.drawText(citationNumber, {
          x: width * 0.195,
          y: getY(48),
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Court - top: "47%", left: "45%"
      if (court) {
        page.drawText(court, {
          x: width * 0.45,
          y: getY(48),
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // County - top: "47%", left: "65%"
      if (county) {
        page.drawText(county, {
          x: width * 0.65,
          y: getY(48),
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Attendance reason X marks - top: "50.5%", left: "60%"
      const reasonY = getY(55.5);
      const reasonStartX = width * 0.54; // Starting position
      drawX(page, reasonStartX, reasonY, attendanceReason === "court_order", boldFont);
      drawX(page, reasonStartX + 88, reasonY, attendanceReason === "volunteer", boldFont);
      drawX(page, reasonStartX + 201, reasonY, attendanceReason === "ticket", boldFont);

      // Name fields - top: "61.5%"
      const nameY = getY(61.5);

      if (firstName) {
        page.drawText(firstName.toUpperCase(), {
          x: width * 0.165,
          y: nameY,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      }

      if (middleInitial) {
        page.drawText(middleInitial.toUpperCase(), {
          x: width * 0.322,
          y: nameY,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      }

      if (lastName) {
        page.drawText(lastName.toUpperCase(), {
          x: width * 0.392,
          y: nameY,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      }

      // Drivers License No - top: "73.6%", left: "19.5%"
      if (licenseNumber) {
        page.drawText(licenseNumber, {
          x: width * 0.195,
          y: getY(73.6),
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Completion Date - top: "73.6%", left: "45.8%"
      if (completionDate) {
        page.drawText(completionDate, {
          x: width * 0.458,
          y: getY(73.6),
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Convert the PDF to bytes and create a blob
      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: "application/pdf" });
    },
    []
  );

  return { generateGovCertificatePDF };
}