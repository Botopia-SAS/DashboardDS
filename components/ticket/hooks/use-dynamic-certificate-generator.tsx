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
      // Scale: Keep FULL WIDTH, only reduce HEIGHT proportionally
      const certScaleX = 1; // Full width - NO scaling horizontally
      const certScaleY = 1 / rows; // Divide height by number of rows
      const contentScale = certScaleY; // Use Y scale for uniform scaling

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

      // Calculate scaling factors to match canvas behavior
      const isLandscape = template.pageSize.orientation === 'landscape';
      const textScaleFactor = rows === 1 ? 1 : rows === 2 ? 0.85 : 0.795;
      const borderWidthScale = rows === 1 ? 1 : (!isLandscape && rows === 2) ? 0.85 : (!isLandscape && rows === 3) ? 0.795 : 1;

      // Draw all certificates according to template.certificatesPerPage
      for (let certIndex = 0; certIndex < certsPerPage; certIndex++) {
        const row = Math.floor(certIndex / cols);
        // offsetY is the start position of each certificate slot (top-down coordinates for shapes/text/images)
        const offsetY = row * (height / rows);
        console.log(`🎫 Drawing certificate ${certIndex + 1}/${certsPerPage} at position ${certIndex + 1}`);

        // Draw background for this certificate with scaled dimensions
        // For backgrounds, we need PDF coordinates (bottom-up), so invert the offsetY
        const certHeight = height / rows;
        const backgroundOffsetY = height - (row + 1) * certHeight;
        await drawBackground(template, page, width, certHeight, pdfDoc, backgroundOffsetY);

        // Draw shapes (filtrar checkboxes porque se generan dinámicamente)
        const nonCheckboxShapes = template.shapeElements.filter(shape => !shape.id?.startsWith('checkbox-'));
        drawShapes(nonCheckboxShapes, page, height, certScaleX, certScaleY, offsetY, borderWidthScale, variables, template.checkboxElements || [], getFont);

        // Draw images
        await drawImages(template.imageElements, page, height, certScaleX, certScaleY, offsetY, pdfDoc);

        // Draw text
        drawTexts(template.textElements, page, height, certScaleX, certScaleY, offsetY, getFont, replaceVariables, textScaleFactor);
        
        // Draw checkbox titles
        drawCheckboxTitles(template.checkboxElements || [], template.shapeElements, page, height, certScaleX, certScaleY, offsetY, getFont, textScaleFactor, certsPerPage);
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

  // Generate multiple certificates in one PDF (up to certificatesPerPage per page)
  const generateMultipleCertificatesPDF = useCallback(async (users: Student[], template: CertificateTemplate) => {
    console.log('🎨 Starting multiple certificates generation');
    console.log('👥 Users:', users.length);
    console.log('📋 Template:', template.name);

    try {
      const pdfDoc = await PDFDocument.create();
      const certsPerPage = template.certificatesPerPage || 1;
      const rows = certsPerPage;
      const cols = 1;
      const certScaleX = 1;
      const certScaleY = 1 / rows;

      // Embed fonts
      const fonts = {
        helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
        helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        timesRoman: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        timesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        courier: await pdfDoc.embedFont(StandardFonts.Courier),
      };

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

      // Calculate scaling factors to match canvas behavior
      const isLandscape = template.pageSize.orientation === 'landscape';
      const textScaleFactor = rows === 1 ? 1 : rows === 2 ? 0.85 : 0.795;
      const borderWidthScale = rows === 1 ? 1 : (!isLandscape && rows === 2) ? 0.85 : (!isLandscape && rows === 3) ? 0.795 : 1;

      // Process users in chunks of certsPerPage
      for (let pageIndex = 0; pageIndex < Math.ceil(users.length / certsPerPage); pageIndex++) {
        const page = pdfDoc.addPage([template.pageSize.width, template.pageSize.height]);
        const { width, height } = page.getSize();

        const startIdx = pageIndex * certsPerPage;
        const endIdx = Math.min(startIdx + certsPerPage, users.length);

        console.log(`📄 Page ${pageIndex + 1}: Drawing ${endIdx - startIdx} certificate(s)`);

        for (let i = startIdx; i < endIdx; i++) {
          const user = users[i];
          const positionInPage = i - startIdx;
          const row = Math.floor(positionInPage / cols);
          // offsetY is the start position of each certificate slot (top-down coordinates for shapes/text/images)
          const offsetY = row * (height / rows);

          console.log(`🎫 Certificate ${i + 1}/${users.length}: ${user.first_name} ${user.last_name} at position ${positionInPage + 1}`);

          const variables = getVariables(user);
          const replaceVariables = (text: string): string => {
            let result = text;
            Object.entries(variables).forEach(([key, value]) => {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
              result = result.replace(regex, value);
            });
            return result;
          };

          // Draw background for this certificate with scaled dimensions
          // For backgrounds, we need PDF coordinates (bottom-up), so invert the offsetY
          const certHeight = height / rows;
          const backgroundOffsetY = height - (row + 1) * certHeight;
          await drawBackground(template, page, width, certHeight, pdfDoc, backgroundOffsetY);

          // Draw shapes (filtrar checkboxes porque se generan dinámicamente)
          const nonCheckboxShapes = template.shapeElements.filter(shape => !shape.id?.startsWith('checkbox-'));
          drawShapes(nonCheckboxShapes, page, height, certScaleX, certScaleY, offsetY, borderWidthScale, variables, template.checkboxElements || [], getFont);

          // Draw images
          await drawImages(template.imageElements, page, height, certScaleX, certScaleY, offsetY, pdfDoc);

          // Draw text
          drawTexts(template.textElements, page, height, certScaleX, certScaleY, offsetY, getFont, replaceVariables, textScaleFactor);
          
          // Draw checkbox titles
          drawCheckboxTitles(template.checkboxElements || [], template.shapeElements, page, height, certScaleX, certScaleY, offsetY, getFont, textScaleFactor, certsPerPage);
        }
      }

      console.log('💾 Serializing multi-certificate PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log(`✅ PDF generated: ${pdfBytes.length} bytes`);

      const arrayBuffer = pdfBytes.slice().buffer as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      return blob;

    } catch (error) {
      console.error('Error generating multiple certificates:', error);
      throw error;
    }
  }, []);

  // Helper function to draw checkbox titles and labels
  const drawCheckboxTitles = (
    checkboxElements: any[],
    shapeElements: any[],
    page: any,
    height: number,
    certScaleX: number,
    certScaleY: number,
    offsetY: number,
    getFont: any,
    textScaleFactor: number,
    certsPerPage: number
  ) => {
    checkboxElements.forEach((checkbox) => {
      const font = getFont(checkbox.fontFamily || 'Times-Bold', 'bold');
      const textColor = hexToRgb(checkbox.color || '#c94a3a');
      
      const baseFontSize = checkbox.fontSize || 10;
      const scaledFontSize = baseFontSize * textScaleFactor;
      
      // Hacer que TODO sea proporcional al fontSize
      const fontSizeRatio = baseFontSize / 10;
      
      const baseCheckboxSize = (checkbox.checkboxSize || 12) * fontSizeRatio;
      const scaledCheckboxSize = baseCheckboxSize * textScaleFactor;
      
      // Escalar las distancias proporcionalmente al fontSize
      const scaledGap = 5 * fontSizeRatio * textScaleFactor;
      const scaledSpacing = 60 * fontSizeRatio * textScaleFactor;
      const scaledVerticalGap = 8 * fontSizeRatio * textScaleFactor;
      // Aumentar margen más cuando hay múltiples certificados por página
      const rows = certsPerPage;
      const baseTitleMargin = rows === 1 ? 20 : rows === 2 ? 28 : 32;
      const scaledTitleMargin = baseTitleMargin * fontSizeRatio * textScaleFactor;
      
      let currentY = checkbox.y;
      
      // Draw title
      if (checkbox.title) {
        const titleText = checkbox.title.endsWith(':') ? checkbox.title : `${checkbox.title}:`;
        
        // Calcular el ancho total de las opciones para la alineación
        let totalWidth = 0;
        if (checkbox.orientation === 'horizontal') {
          checkbox.options.forEach((option: string, index: number) => {
            const approxWidth = option.length * scaledFontSize * 0.6;
            totalWidth += scaledCheckboxSize + scaledGap + approxWidth;
            if (index < checkbox.options.length - 1) {
              totalWidth += scaledSpacing;
            }
          });
        }
        
        // Calcular posición X basada en la alineación
        let titleX = checkbox.x;
        const titleAlign = checkbox.titleAlign || 'left';
        const titleWidth = font.widthOfTextAtSize(titleText, scaledFontSize);
        
        if (titleAlign === 'center' && checkbox.orientation === 'horizontal') {
          titleX = checkbox.x + (totalWidth / 2) - (titleWidth / 2);
        } else if (titleAlign === 'right' && checkbox.orientation === 'horizontal') {
          titleX = checkbox.x + totalWidth - titleWidth;
        }
        
        const scaledX = titleX * certScaleX;
        const scaledY = currentY * certScaleY + offsetY;
        const pdfY = height - scaledY - scaledFontSize;
        
        page.drawText(titleText, {
          x: scaledX,
          y: pdfY,
          size: scaledFontSize,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
        
        // Mover Y hacia abajo ANTES de escalar: altura del texto + margen
        currentY += (scaledFontSize / textScaleFactor) + (scaledTitleMargin / textScaleFactor);
      }
      
      // Draw options
      checkbox.options.forEach((option: string, index: number) => {
        let optionX = checkbox.x;
        let optionY = currentY;
        
        if (checkbox.orientation === 'horizontal') {
          // Horizontal: calcular X acumulada con distancias escaladas
          if (index > 0) {
            for (let i = 0; i < index; i++) {
              const prevText = checkbox.options[i];
              const approxWidth = prevText.length * scaledFontSize * 0.6;
              optionX += scaledCheckboxSize + scaledGap + approxWidth + scaledSpacing;
            }
          }
        } else {
          // Vertical: calcular Y acumulada con distancias escaladas
          optionY += index * (scaledCheckboxSize + scaledVerticalGap);
        }
        
        // Dibujar texto de la opción
        const textX = optionX + scaledCheckboxSize + scaledGap;
        const textY = optionY + (scaledCheckboxSize / 2);
        
        const scaledTextX = textX * certScaleX;
        const scaledTextY = textY * certScaleY + offsetY;
        const pdfY = height - scaledTextY - (scaledFontSize * 0.3);
        
        page.drawText(option, {
          x: scaledTextX,
          y: pdfY,
          size: scaledFontSize,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
      });
    });
  };

  return { generateDynamicCertificatePDF, generateMultipleCertificatesPDF };
}
