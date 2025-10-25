"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { getCertificateConfig } from "@/lib/certificateConfig";

/**
 * Unified Certificate Generator Hook
 *
 * This hook generates PDF certificates dynamically based on class type configuration.
 * No more separate hooks for each class type!
 *
 * Usage:
 * const { generateCertificatePDF } = useUnifiedCertificateGenerator();
 * const blob = await generateCertificatePDF(student);
 */
export function useUnifiedCertificateGenerator() {
  const generateCertificatePDF = useCallback(async (student: Student) => {
    const { classType } = student;

    // Get configuration for this class type
    const config = getCertificateConfig(classType || 'DATE');

    console.log('🎓 Generating certificate:', {
      classType: config.classType,
      studentName: `${student.first_name} ${student.last_name}`,
      pdfPath: config.pdfPath
    });

    try {
      // Import pdf-lib for PDF manipulation
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

      // Load the PDF template for this class type
      const existingPdfBytes = await fetch(config.pdfPath).then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load PDF template: ${config.pdfPath}`);
        }
        return res.arrayBuffer();
      });

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Get page dimensions
      const { width, height } = firstPage.getSize();

      // Embed fonts
      const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Helper function to draw text based on configuration
      const drawText = (
        text: string,
        x: number,
        y: number,
        fontSize: number = 12,
        fontFamily: 'Times-Roman' | 'Helvetica' | 'Courier' = 'Times-Roman',
        align: 'left' | 'center' | 'right' = 'left'
      ) => {
        const font = fontFamily === 'Helvetica' ? helveticaFont : timesFont;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let finalX = x;
        if (align === 'center') {
          finalX = x - (textWidth / 2);
        } else if (align === 'right') {
          finalX = x - textWidth;
        }

        firstPage.drawText(text, {
          x: finalX,
          y: height - y - (textHeight / 2),
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
      };

      // Process each variable from configuration
      config.variables.forEach(variable => {
        let value = (student as any)[variable.key];

        // Apply transformation if defined
        if (variable.transform) {
          value = variable.transform(value, student);
        } else if (value === undefined || value === null) {
          value = '';
        } else {
          value = String(value);
        }

        // Draw the text on PDF
        drawText(
          value,
          variable.x,
          variable.y,
          variable.fontSize || 12,
          variable.fontFamily || 'Times-Roman',
          variable.align || 'left'
        );

        console.log(`  ✓ ${variable.label}: "${value}" at (${variable.x}, ${variable.y})`);
      });

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();

      // Create blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      console.log('✅ Certificate generated successfully');
      return blob;

    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      throw error;
    }
  }, []);

  return { generateCertificatePDF };
}
