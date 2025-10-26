"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generador específico para certificados DATE
 * USA LAS MISMAS COORDENADAS QUE useUnifiedCertificateGenerator
 */
export function useDateCertificateGenerator() {
  /**
   * Genera un PDF para certificado DATE
   */
  const generateDateCertificatePDF = useCallback(
    async (student: Student) => {
      console.log("🎓 DATE: Generating certificate");
      console.log(`   📋 Student: ${student.first_name} ${student.last_name}`);

      try {
        // Usar el template por defecto para DATE
        const pdfTemplatePath = '/templates_certificates/date.pdf';

        // Cargar el template PDF
        const templateResponse = await fetch(pdfTemplatePath);
        if (!templateResponse.ok) {
          throw new Error(`Failed to load PDF template: ${pdfTemplatePath}`);
        }

        const templateBytes = await templateResponse.arrayBuffer();
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Obtener la primera página
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        console.log(`   📄 PDF size: ${width}x${height}`);

        // Cargar fuente Times-Roman (MISMA que unified generator)
        const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

        // Helper para dibujar texto centrado (MISMA lógica que unified generator)
        const drawText = (text: string, x: number, y: number, fontSize: number, align: 'left' | 'center' | 'right' = 'left') => {
          const textWidth = timesFont.widthOfTextAtSize(text, fontSize);
          const textHeight = timesFont.heightAtSize(fontSize);

          let finalX = x;
          if (align === 'center') {
            finalX = x - (textWidth / 2);
          } else if (align === 'right') {
            finalX = x - textWidth;
          }

          const pdfY = height - y - (textHeight / 2);

          firstPage.drawText(text, {
            x: finalX,
            y: pdfY,
            size: fontSize,
            font: timesFont,
            color: rgb(0, 0, 0),
          });
        };

        // COORDENADAS EXACTAS DEL CERTIFICADO INDIVIDUAL (de certificateConfig.ts)
        // studentName (firstName + lastName juntos, centrado)
        const studentName = `${student.first_name.toUpperCase()} ${student.last_name.toUpperCase()}`;
        drawText(studentName, 390, 242, 14, 'center');
        console.log(`  ✏️ studentName: "${studentName}" at (390, 242)`);

        // birthDate (centrado)
        if (student.birthDate) {
          const birthDate = new Date(student.birthDate).toLocaleDateString('en-US');
          drawText(birthDate, 390, 290, 12, 'center');
          console.log(`  ✏️ birthDate: "${birthDate}" at (390, 290)`);
        }

        // classType (centrado)
        const classType = (student.classType || 'DATE').toUpperCase();
        drawText(classType, 385, 385, 18, 'center');
        console.log(`  ✏️ classType: "${classType}" at (385, 385)`);

        // classTitle (centrado) - puede ser "4hr Traffic Law & Substance Abuse Class"
        const classTitle = '4hr Traffic Law & Substance Abuse Class';
        drawText(classTitle, 390, 415, 12, 'center');
        console.log(`  ✏️ classTitle: "${classTitle}" at (390, 415)`);

        // certn - Certificate Number (centrado)
        if (student.certn !== null && student.certn !== undefined) {
          drawText(String(student.certn), 163, 394, 12, 'center');
          console.log(`  ✏️ certn: "${student.certn}" at (163, 394)`);
        }

        // courseDate (centrado)
        if (student.courseDate) {
          const courseDate = new Date(student.courseDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
          });
          drawText(courseDate, 390, 487, 12, 'center');
          console.log(`  ✏️ courseDate: "${courseDate}" at (390, 487)`);
        }

        // Generar el PDF
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes as any], { type: "application/pdf" });
      } catch (error) {
        console.error("❌ Error generating DATE certificate:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Genera PDFs individuales para múltiples estudiantes (para ZIP)
   * Retorna un array de Blobs, uno por cada estudiante
   */
  const generateMultipleDateCertificates = useCallback(
    async (students: Student[]) => {
      console.log(`🎓 DATE: Generating ${students.length} individual certificates for ZIP`);

      const pdfBlobs: Blob[] = [];

      for (const student of students) {
        const pdfBlob = await generateDateCertificatePDF(student);
        pdfBlobs.push(pdfBlob);
      }

      console.log(`✅ DATE: Generated ${pdfBlobs.length} individual PDFs`);
      return pdfBlobs;
    },
    [generateDateCertificatePDF]
  );

  /**
   * Genera un solo PDF con múltiples páginas (para Combined PDF)
   * Retorna un solo Blob con todas las páginas
   */
  const generateCombinedDateCertificates = useCallback(
    async (students: Student[]) => {
      console.log(`🎓 DATE: Generating combined PDF with ${students.length} pages`);

      try {
        const combinedPdf = await PDFDocument.create();
        const pdfTemplatePath = '/templates_certificates/date.pdf';

        // Cargar el template una vez
        const templateResponse = await fetch(pdfTemplatePath);
        if (!templateResponse.ok) {
          throw new Error(`Failed to load PDF template: ${pdfTemplatePath}`);
        }
        const templateBytes = await templateResponse.arrayBuffer();

        // Generar cada certificado y agregarlo al PDF combinado
        for (const student of students) {
          console.log(`  📄 Adding page for: ${student.first_name} ${student.last_name}`);

          const pdfDoc = await PDFDocument.load(templateBytes);
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const { height } = firstPage.getSize();

          const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

          // Helper para dibujar texto centrado (MISMA lógica que la función individual)
          const drawText = (text: string, x: number, y: number, fontSize: number, align: 'left' | 'center' | 'right' = 'left') => {
            const textWidth = timesFont.widthOfTextAtSize(text, fontSize);
            const textHeight = timesFont.heightAtSize(fontSize);

            let finalX = x;
            if (align === 'center') {
              finalX = x - (textWidth / 2);
            } else if (align === 'right') {
              finalX = x - textWidth;
            }

            const pdfY = height - y - (textHeight / 2);

            firstPage.drawText(text, {
              x: finalX,
              y: pdfY,
              size: fontSize,
              font: timesFont,
              color: rgb(0, 0, 0),
            });
          };

          // COORDENADAS EXACTAS (MISMAS que la función individual)
          // studentName (firstName + lastName juntos, centrado)
          const studentName = `${student.first_name.toUpperCase()} ${student.last_name.toUpperCase()}`;
          drawText(studentName, 390, 242, 14, 'center');

          // birthDate (centrado)
          if (student.birthDate) {
            const birthDate = new Date(student.birthDate).toLocaleDateString('en-US');
            drawText(birthDate, 390, 290, 12, 'center');
          }

          // classType (centrado)
          const classType = (student.classType || 'DATE').toUpperCase();
          drawText(classType, 385, 385, 18, 'center');

          // classTitle (centrado)
          const classTitle = '4hr Traffic Law & Substance Abuse Class';
          drawText(classTitle, 390, 415, 12, 'center');

          // certn - Certificate Number (centrado)
          if (student.certn !== null && student.certn !== undefined) {
            drawText(String(student.certn), 163, 394, 12, 'center');
          }

          // courseDate (centrado)
          if (student.courseDate) {
            const courseDate = new Date(student.courseDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC'
            });
            drawText(courseDate, 390, 487, 12, 'center');
          }

          // Copiar la página al PDF combinado
          const [copiedPage] = await combinedPdf.copyPages(pdfDoc, [0]);
          combinedPdf.addPage(copiedPage);
        }

        const pdfBytes = await combinedPdf.save();
        console.log(`✅ DATE: Generated combined PDF with ${students.length} pages`);
        return new Blob([pdfBytes as any], { type: "application/pdf" });
      } catch (error) {
        console.error("❌ Error generating combined DATE certificates:", error);
        throw error;
      }
    },
    []
  );

  return {
    generateDateCertificatePDF,
    generateMultipleDateCertificates,
    generateCombinedDateCertificates,
  };
}
