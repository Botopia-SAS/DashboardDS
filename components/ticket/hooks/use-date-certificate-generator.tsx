"use client";

import { Student } from "../columns";
import { useCallback } from "react";

export function useDateCertificateGenerator() {
  const generateDateCertificatePDF = useCallback(async (user: Student) => {
    const { last_name, first_name, midl, birthDate, certn, courseDate, classTitle, classType } = user;

    // Debug logs
    console.log('Generating certificate for:', {
      studentName: `${first_name} ${last_name}`,
      classTitle,
      classType,
      certn
    });

    try {
      // Import pdf-lib for PDF manipulation
      const { PDFDocument, rgb } = await import('pdf-lib');

      // Load the existing PDF template (same as test-date page)
      const existingPdfBytes = await fetch('/templates_certificates/date.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      
      // Get page dimensions
      const { width, height } = firstPage.getSize();
      
      // Embed fonts - Use Times-Roman for a more formal serif look like the original
      const timesFont = await pdfDoc.embedFont('Times-Roman');
      const helveticaFont = await pdfDoc.embedFont('Helvetica');
      
      // Helper function to draw centered text
      const drawCenteredText = (text: string, x: number, y: number, size: number = 12, useSerif: boolean = true) => {
        const font = useSerif ? timesFont : helveticaFont;
        const textWidth = font.widthOfTextAtSize(text, size);
        const textHeight = font.heightAtSize(size);
        
        firstPage.drawText(text, {
          x: x - (textWidth / 2), // Center horizontally - x coordinate is now the true center
          y: height - y - (textHeight / 2), // Center vertically - y coordinate is now the true center
          size: size,
          font: font,
          color: rgb(0, 0, 0)
        });
      };
      
      // Format student name (same as test-date)
      const studentName = `${(first_name || '').toUpperCase()} ${(last_name || '').toUpperCase()}`;
      
      // Format birth date
      const formattedBirthDate = birthDate ? new Date(birthDate).toLocaleDateString('en-US') : "";
      
      // Format course completion date
      const formattedCourseDate = courseDate ? new Date(courseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Format print date
      const printDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/New_York'
      });
      
      // Add text at the same coordinates as test-date page
      // Nombre + Apellido: x=390, y=242 (center)
      drawCenteredText(studentName, 390, 242, 14, true);

      // Cumpleaños: x=390, y=284 (center)
      if (formattedBirthDate) {
        drawCenteredText(formattedBirthDate, 390, 295, 12, true);
      }

      // Class Type: x=390, y=241 (center) - Positioned after "Has successfully completed the"
      const displayClassType = (classType || 'DATE').toUpperCase();
      drawCenteredText(displayClassType, 413, 241, 18, true);

      // Class Title: x=390, y=293 (center) - Below class type
      const displayClassTitle = classTitle || '4hr Traffic Law & Substance Abuse Class';
      drawCenteredText(displayClassTitle, 413, 293, 11, true);

      // Número de Certificado: x=163, y=394 (center)
      drawCenteredText(String(certn), 163, 394, 12, true);

      // Fecha de Generación: x=403, y=387 (center) - Aligned with "Date" label
      drawCenteredText(printDate, 403, 387, 12, true);

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();

      // Create blob
      const arrayBuffer = new ArrayBuffer(pdfBytes.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(pdfBytes);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

      return blob;

    } catch (error) {
      console.error('Error generating certificate with PDF template:', error);
      throw error;
    }
  }, []);

  return { generateDateCertificatePDF };
}
