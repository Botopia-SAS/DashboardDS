"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { CertificateTemplate, TextElement, ShapeElement, ImageElement } from "@/components/certificate-editor/types";
import { applyGrayscaleFilter } from "./pdf-helpers/image-filters";
import { hexToRgb, getVariables } from "./pdf-helpers/utils";
import { drawShapes } from "./pdf-helpers/draw-shapes";
import { drawImages } from "./pdf-helpers/draw-images";
import { drawTexts } from "./pdf-helpers/draw-text";
import { drawBackground } from "./pdf-helpers/draw-background";

export function useDynamicCertificateGenerator() {
  const generateDynamicCertificatePDF = useCallback(async (user: Student, template: CertificateTemplate) => {
    console.log('🎨 Starting dynamic certificate generation');
    console.log('👤 User:', `${user.first_name} ${user.last_name}`);
    console.log('📋 Template:', template.name);

    try {
      const pdfDoc = await PDFDocument.create();

      // Get certificates per page setting
      const certsPerPage = template.certificatesPerPage || 1;
      const rows = certsPerPage;
      const cols = 1;
      // FORCE: Keep content at original size
      const certScaleX = 1;
      const certScaleY = 1;

      // Create page
      const page = pdfDoc.addPage([template.pageSize.width, template.pageSize.height]);
      const { width, height } = page.getSize();
      console.log(`📄 Page: ${width}x${height}, Certificates: ${certsPerPage}`);

      // Embed fonts
      const fonts = {
        helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
        helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        timesRoman: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        timesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        courier: await pdfDoc.embedFont(StandardFonts.Courier),
      };

      // Helper to get font
      const getFont = (fontFamily: string, fontWeight: string = 'normal') => {
        if (fontFamily === 'Helvetica' && fontWeight === 'bold') return fonts.helveticaBold;
        if (fontFamily === 'Times-Roman' && fontWeight === 'bold') return fonts.timesBold;
        const fontMap: Record<string, any> = {
          'Helvetica': fonts.helvetica,
          'Helvetica-Bold': fonts.helveticaBold,
          'Times-Roman': fonts.timesRoman,
          'Times-Bold': fonts.timesBold,
          'Courier': fonts.courier,
        };
        return fontMap[fontFamily] || fonts.helvetica;
      };

      // Get variables for text replacement
      const variables = getVariables(user);

      // Helper to replace variables
      const replaceVariables = (text: string): string => {
        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          result = result.replace(regex, value);
        });
        return result;
      };

      // Draw background once
      await drawBackground(template, page, width, height, pdfDoc);

      // Draw each certificate instance
      for (let i = 0; i < certsPerPage; i++) {
        const row = Math.floor(i / cols);
        const offsetY = row * (height / rows);
        console.log(`🎫 Drawing certificate ${i + 1}/${certsPerPage}`);

        // Draw shapes
        drawShapes(template.shapeElements, page, height, certScaleX, certScaleY, offsetY);

        // Draw images
        await drawImages(template.imageElements, page, height, certScaleX, certScaleY, offsetY, pdfDoc);

        // Draw text
        drawTexts(template.textElements, page, height, certScaleX, certScaleY, offsetY, getFont, replaceVariables);
      }

      // Serialize PDF
      console.log('💾 Serializing PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log(`✅ PDF generated: ${pdfBytes.length} bytes`);

      const arrayBuffer = pdfBytes.slice().buffer as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      return blob;

    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }, []);

  return { generateDynamicCertificatePDF };
}
