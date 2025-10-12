"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { CertificateTemplate, TextElement, ShapeElement } from "@/components/certificate-editor/types";

export function useDynamicCertificateGenerator() {
  const generateDynamicCertificatePDF = useCallback(async (user: Student, template: CertificateTemplate) => {
    console.log('🎨 Starting dynamic certificate generation');
    console.log('👤 User data:', { 
      name: `${user.first_name} ${user.last_name}`, 
      classType: user.classType,
      certn: user.certn 
    });
    console.log('📋 Template info:', { 
      name: template.name, 
      classType: template.classType,
      elements: {
        text: template.textElements.length,
        images: template.imageElements.length,
        shapes: template.shapeElements.length
      }
    });

    const {
      last_name,
      first_name,
      midl,
      birthDate,
      certn,
      courseDate,
      classTitle,
      classType,
      licenseNumber,
      citation_number,
      address,
      courseAddress,
      courseTime,
      instructorName,
    } = user;

    try {
      // Create PDF document
      const pdfDoc = await PDFDocument.create();

      // Add page with template dimensions
      const page = pdfDoc.addPage([template.pageSize.width, template.pageSize.height]);
      const { width, height } = page.getSize();
      
      console.log(`📄 Created PDF page: ${width}x${height} (${template.pageSize.orientation})`);

      // Embed fonts
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);

      const fontMap: Record<string, any> = {
        'Helvetica': helvetica,
        'Helvetica-Bold': helveticaBold,
        'Times-Roman': timesRoman,
        'Times-Bold': timesBold,
        'Courier': courier,
      };

      // Helper function to get font
      const getFont = (fontFamily: string, fontWeight: string = 'normal') => {
        if (fontFamily === 'Helvetica' && fontWeight === 'bold') return helveticaBold;
        if (fontFamily === 'Times-Roman' && fontWeight === 'bold') return timesBold;
        return fontMap[fontFamily] || helvetica;
      };

      // Helper function to convert hex color to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16) / 255,
              g: parseInt(result[2], 16) / 255,
              b: parseInt(result[3], 16) / 255,
            }
          : { r: 0, g: 0, b: 0 };
      };

      // Helper function to replace variables
      const replaceVariables = (text: string): string => {
        const studentName = `${(first_name || '').toUpperCase()} ${(midl || '').toUpperCase()} ${(last_name || '').toUpperCase()}`.trim();
        const formattedBirthDate = birthDate ? new Date(birthDate).toLocaleDateString('en-US') : "";
        const formattedCourseDate = courseDate
          ? new Date(courseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' });

        const variables: Record<string, string> = {
          studentName,
          firstName: (first_name || '').toUpperCase(),
          lastName: (last_name || '').toUpperCase(),
          middleName: (midl || '').toUpperCase(),
          certn: String(certn || ''),
          birthDate: formattedBirthDate,
          courseDate: formattedCourseDate,
          printDate,
          classTitle: classTitle || '',
          classType: (classType || '').toUpperCase(),
          licenseNumber: licenseNumber || '',
          citationNumber: citation_number || '',
          address: address || '',
          courseAddress: courseAddress || '',
          courseTime: courseTime || '',
          instructorName: instructorName || '',
        };

        let result = text;
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          result = result.replace(regex, value);
        });

        return result;
      };

      // Draw background
      console.log(`🎨 Drawing background: ${template.background.type} = ${template.background.value}`);
      if (template.background.type === 'color' && template.background.value) {
        const bgColor = hexToRgb(template.background.value);
        console.log(`🌈 Background color:`, bgColor);
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(bgColor.r, bgColor.g, bgColor.b),
        });
      } else if (template.background.type === 'pdf' && template.background.value) {
        try {
          // Load existing PDF template
          const existingPdfBytes = await fetch(template.background.value).then(res => res.arrayBuffer());
          const existingPdf = await PDFDocument.load(existingPdfBytes);
          const [existingPage] = await pdfDoc.copyPages(existingPdf, [0]);

          // Replace the page with the existing one
          pdfDoc.removePage(0);
          pdfDoc.insertPage(0, existingPage);
        } catch (error) {
          console.error('Error loading background PDF:', error);
        }
      } else if (template.background.type === 'image' && template.background.value) {
        try {
          const imageBytes = await fetch(template.background.value).then(res => res.arrayBuffer());
          let bgImage;

          if (template.background.value.toLowerCase().endsWith('.png')) {
            bgImage = await pdfDoc.embedPng(imageBytes);
          } else {
            bgImage = await pdfDoc.embedJpg(imageBytes);
          }

          page.drawImage(bgImage, {
            x: 0,
            y: 0,
            width,
            height,
          });
        } catch (error) {
          console.error('Error loading background image:', error);
        }
      }

      // Draw shapes
      console.log(`🔲 Drawing ${template.shapeElements.length} shapes`);
      template.shapeElements.forEach((shape: ShapeElement, index) => {
        // Handle transparent colors properly
        let color = undefined;
        if (shape.color && shape.color !== 'transparent') {
          const rgbColor = hexToRgb(shape.color);
          color = rgb(rgbColor.r, rgbColor.g, rgbColor.b);
        }

        const borderColor = shape.borderColor ? hexToRgb(shape.borderColor) : hexToRgb('#000000');
        console.log(`🔲 Shape ${index + 1}: ${shape.type} at (${shape.x}, ${shape.y}) with border ${shape.borderWidth}px`);

        if (shape.type === 'rectangle') {
          page.drawRectangle({
            x: shape.x,
            y: height - shape.y - (shape.height || 0),
            width: shape.width || 0,
            height: shape.height || 0,
            color: color,
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: shape.borderWidth || 0,
            // Note: pdf-lib doesn't support border styles like dashed/dotted for rectangles
          });
        } else if (shape.type === 'line') {
          const thickness = shape.borderWidth || 1;
          const startX = shape.x;
          const startY = height - shape.y;
          const endX = shape.x2 || shape.x;
          const endY = height - (shape.y2 || shape.y);
          
          if (shape.borderStyle === 'dashed' || shape.borderStyle === 'dotted') {
            // Simulate dashed/dotted lines by drawing multiple small segments
            const dashLength = shape.borderStyle === 'dotted' ? 2 : 8;
            const gapLength = shape.borderStyle === 'dotted' ? 2 : 4;
            const totalLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const segments = Math.floor(totalLength / (dashLength + gapLength));
            
            for (let i = 0; i < segments; i++) {
              const segmentStart = i * (dashLength + gapLength) / totalLength;
              const segmentEnd = (i * (dashLength + gapLength) + dashLength) / totalLength;
              
              const segStartX = startX + (endX - startX) * segmentStart;
              const segStartY = startY + (endY - startY) * segmentStart;
              const segEndX = startX + (endX - startX) * segmentEnd;
              const segEndY = startY + (endY - startY) * segmentEnd;
              
              page.drawLine({
                start: { x: segStartX, y: segStartY },
                end: { x: segEndX, y: segEndY },
                thickness: thickness,
                color: rgb(borderColor.r, borderColor.g, borderColor.b),
              });
            }
          } else {
            // Solid line (default)
            page.drawLine({
              start: { x: startX, y: startY },
              end: { x: endX, y: endY },
              thickness: thickness,
              color: rgb(borderColor.r, borderColor.g, borderColor.b),
            });
          }
        } else if (shape.type === 'circle') {
          // PDF-lib doesn't have a direct circle drawing, so we use an ellipse
          page.drawEllipse({
            x: shape.x + (shape.radius || 0),
            y: height - shape.y - (shape.radius || 0),
            xScale: shape.radius || 0,
            yScale: shape.radius || 0,
            color: color,
            borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
            borderWidth: shape.borderWidth || 0,
            // Note: pdf-lib doesn't support border styles like dashed/dotted for ellipses
          });
        }
      });

      // Draw images
      for (const image of template.imageElements) {
        try {
          const imageBytes = await fetch(image.url).then(res => res.arrayBuffer());
          let pdfImage;

          if (image.url.toLowerCase().endsWith('.png')) {
            pdfImage = await pdfDoc.embedPng(imageBytes);
          } else {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
          }

          page.drawImage(pdfImage, {
            x: image.x,
            y: height - image.y - image.height,
            width: image.width,
            height: image.height,
          });
        } catch (error) {
          console.error('Error loading image:', image.url, error);
        }
      }

      // Draw text
      console.log(`📝 Drawing ${template.textElements.length} text elements`);
      template.textElements.forEach((text: TextElement, index) => {
        const content = replaceVariables(text.content);
        const font = getFont(text.fontFamily, text.fontWeight);
        const textColor = hexToRgb(text.color);

        const textWidth = font.widthOfTextAtSize(content, text.fontSize);
        let xPos = text.x;

        if (text.align === 'center') {
          xPos = text.x - textWidth / 2;
        } else if (text.align === 'right') {
          xPos = text.x - textWidth;
        }

        // In HTML, text.y is the top of the text element
        // In PDF, drawText positions by baseline (roughly 80% down from top of text)
        // So we convert: PDF_y = height - (HTML_y + fontSize * 0.8)
        const baselineOffset = text.fontSize * 0.8;
        const pdfY = height - text.y - baselineOffset;

        console.log(`📝 Text ${index + 1}: "${content}" at (${xPos}, ${pdfY.toFixed(1)}) size ${text.fontSize}`);

        page.drawText(content, {
          x: xPos,
          y: pdfY,
          size: text.fontSize,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
      });

      // Serialize the PDF
      console.log('💾 Serializing PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log(`✅ PDF generated successfully: ${pdfBytes.length} bytes`);

      // Create blob - create a new Uint8Array to ensure it's an ArrayBuffer
      const arrayBuffer = pdfBytes.slice().buffer as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      console.log('📄 PDF blob created');
      return blob;

    } catch (error) {
      console.error('Error generating dynamic certificate:', error);
      throw error;
    }
  }, []);

  return { generateDynamicCertificatePDF };
}
