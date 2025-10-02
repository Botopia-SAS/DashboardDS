"use client";

import { useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { GovCertificateData } from "../types";

export function usePdfGenerator() {
  const generatePDF = useCallback(async (
    data: GovCertificateData,
    previewElement: HTMLElement
  ): Promise<Blob> => {
    // Generate canvas from HTML element
    const canvas = await html2canvas(previewElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    // Create PDF with landscape orientation
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

    // Convert to blob
    return pdf.output("blob");
  }, []);

  return { generatePDF };
}
