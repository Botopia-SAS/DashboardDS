"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Generador específico para certificados DATE
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

        // Cargar fuente
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Coordenadas básicas para certificado DATE (ajusta según tu template)
        const fields = [
          {
            key: 'firstName',
            value: student.first_name,
            x: 200,
            y: 300,
            fontSize: 12
          },
          {
            key: 'lastName',
            value: student.last_name,
            x: 200,
            y: 280,
            fontSize: 12
          },
          {
            key: 'courseDate',
            value: student.courseDate ? new Date(student.courseDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) : '',
            x: 200,
            y: 260,
            fontSize: 12
          },
          {
            key: 'certn',
            value: student.certn,
            x: 200,
            y: 240,
            fontSize: 12
          }
        ];

        // Dibujar cada campo
        fields.forEach(field => {
          if (!field.value || field.value === "") {
            console.log(`  ⚠️ ${field.key} is empty, skipping`);
            return;
          }

          const pdfY = height - field.y - field.fontSize;

          console.log(`  ✏️ ${field.key}: "${field.value}" at (${field.x}, ${pdfY})`);

          firstPage.drawText(String(field.value), {
            x: field.x,
            y: pdfY,
            size: field.fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        });

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

  return {
    generateDateCertificatePDF,
  };
}
