"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  getAdiFieldCoordinates,
  getAdiPositionCoordinates,
} from "@/lib/certificateAdiCoordinates";

/**
 * Generador específico para certificados ADI
 *
 * Este generador usa coordenadas exactas para cada campo en cada posición (1, 2, 3)
 * en lugar de dividir la página en filas iguales.
 *
 * Características:
 * - 1 estudiante: usa solo posición 1 (top)
 * - 2 estudiantes: usa posiciones 1 y 2 (top + middle)
 * - 3 estudiantes: usa posiciones 1, 2, y 3 (top + middle + bottom)
 */
export function useAdiCertificateGenerator() {
  /**
   * Genera un PDF con 1 estudiante en la posición 1
   */
  const generateSingleAdiCertificate = useCallback(
    async (student: Student, pdfTemplatePath: string) => {
      console.log("🎓 Generating single ADI certificate");
      console.log(`👤 Student: ${student.first_name} ${student.last_name}`);

      try {
        const pdfDoc = await PDFDocument.create();

        // Cargar el PDF template de fondo
        const templateBytes = await fetch(pdfTemplatePath).then((res) => {
          if (!res.ok) throw new Error(`Failed to load PDF: ${pdfTemplatePath}`);
          return res.arrayBuffer();
        });
        const templatePdf = await PDFDocument.load(templateBytes);
        const [templatePage] = await pdfDoc.copyPages(templatePdf, [0]);
        pdfDoc.addPage(templatePage);

        const page = pdfDoc.getPages()[0];
        const { height } = page.getSize();

        // Embed fonts
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);

        // Usar coordenadas de la posición 1
        const coordinates = getAdiPositionCoordinates(1);

        // Mapeo de nombres de campos (coordenadas -> base de datos)
        const fieldMapping: Record<string, string> = {
          firstName: 'first_name',
          lastName: 'last_name',
          middleName: 'midl',
          licenseNumber: 'licenseNumber',
          licenseNumber2: 'licenseNumber', // Segunda aparición del mismo número
          citationNumber: 'citationNumber',
          courseDate: 'courseDate',
          certn: 'certn', // Certificate number
          address: 'address',
          instructorSignature: 'instructorSignature'
        };

        // Dibujar cada campo en su posición
        Object.entries(coordinates).forEach(([fieldKey, coord]) => {
          // Obtener el nombre del campo en la base de datos
          const dbFieldKey = fieldMapping[fieldKey] || fieldKey;
          let value = (student as any)[dbFieldKey];

          // Transformaciones especiales
          if (fieldKey === "courseDate" && value) {
            const date = new Date(value);
            value = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }

          // Si no hay valor, saltar este campo (no usar datos mock)
          if (!value || value === "") {
            console.log(`  ⚠️ ${fieldKey} (${dbFieldKey}) is empty, skipping`);
            return;
          }

          // Validar que x e y existen (no son opcionales para campos de texto)
          if (coord.x === undefined || coord.y === undefined) {
            console.log(`  ⚠️ ${fieldKey} missing coordinates, skipping`);
            return;
          }

          // Campo de texto normal - usar Helvetica
          const font = helvetica;
          const fontSize = coord.fontSize || 10;
          const textWidth = font.widthOfTextAtSize(String(value), fontSize);

          // Calcular X según alineación
          let finalX = coord.x;
          if (coord.align === "center") {
            finalX = coord.x - textWidth / 2;
          } else if (coord.align === "right") {
            finalX = coord.x - textWidth;
          }

          // PDF usa coordenadas bottom-up
          const pdfY = height - coord.y - fontSize;

          page.drawText(String(value), {
            x: finalX,
            y: pdfY,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });

          console.log(`  ✓ ${fieldKey}: "${value}" at (${finalX}, ${pdfY})`);
        });

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes as any], { type: "application/pdf" });
      } catch (error) {
        console.error("❌ Error generating single ADI certificate:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Genera un PDF con múltiples estudiantes (hasta 3 por página)
   * Si hay más de 3, genera múltiples PDFs en un ZIP
   */
  const generateMultipleAdiCertificates = useCallback(
    async (students: Student[], pdfTemplatePath: string) => {
      console.log("🎓 Generating multiple ADI certificates");
      console.log(`👥 Students: ${students.length}`);

      const pdfs: Blob[] = [];

      try {
        // Procesar en chunks de 3
        for (let i = 0; i < students.length; i += 3) {
          const chunk = students.slice(i, Math.min(i + 3, students.length));
          console.log(`📄 PDF ${Math.floor(i / 3) + 1}: ${chunk.length} certificate(s)`);

          const pdfDoc = await PDFDocument.create();

          // Cargar el PDF template de fondo
          const templateBytes = await fetch(pdfTemplatePath).then((res) => {
            if (!res.ok) throw new Error(`Failed to load PDF: ${pdfTemplatePath}`);
            return res.arrayBuffer();
          });
          const templatePdf = await PDFDocument.load(templateBytes);
          const [templatePage] = await pdfDoc.copyPages(templatePdf, [0]);
          pdfDoc.addPage(templatePage);

          const page = pdfDoc.getPages()[0];
          const { height } = page.getSize();

          // Embed fonts
          const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);

          // Mapeo de nombres de campos (coordenadas -> base de datos)
          const fieldMapping: Record<string, string> = {
            firstName: 'first_name',
            lastName: 'last_name',
            middleName: 'midl',
            licenseNumber: 'licenseNumber',
            licenseNumber2: 'licenseNumber', // Segunda aparición del mismo número
            citationNumber: 'citationNumber',
            courseDate: 'courseDate',
            certn: 'certn', // Certificate number
            address: 'address',
            instructorSignature: 'instructorSignature'
          };

          // Dibujar cada estudiante en su posición
          chunk.forEach((student, index) => {
            const position = (index + 1) as 1 | 2 | 3;
            const coordinates = getAdiPositionCoordinates(position);

            console.log(`  🎫 ${student.first_name} ${student.last_name} at position ${position}`);

            Object.entries(coordinates).forEach(([fieldKey, coord]) => {
              // Obtener el nombre del campo en la base de datos
              const dbFieldKey = fieldMapping[fieldKey] || fieldKey;
              let value = (student as any)[dbFieldKey];

              // Transformaciones especiales
              if (fieldKey === "courseDate" && value) {
                const date = new Date(value);
                value = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }

              // Si no hay valor, saltar este campo (no usar datos mock)
              if (!value || value === "") {
                console.log(`  ⚠️ ${fieldKey} (${dbFieldKey}) is empty, skipping`);
                return;
              }

              // Validar que x e y existen (no son opcionales para campos de texto)
              if (coord.x === undefined || coord.y === undefined) {
                console.log(`  ⚠️ ${fieldKey} missing coordinates, skipping`);
                return;
              }

              // Campo de texto normal - usar Helvetica
              const font = helvetica;
              const fontSize = coord.fontSize || 10;
              const textWidth = font.widthOfTextAtSize(String(value), fontSize);

              // Calcular X según alineación
              let finalX = coord.x;
              if (coord.align === "center") {
                finalX = coord.x - textWidth / 2;
              } else if (coord.align === "right") {
                finalX = coord.x - textWidth;
              }

              // PDF usa coordenadas bottom-up
              const pdfY = height - coord.y - fontSize;

              page.drawText(String(value), {
                x: finalX,
                y: pdfY,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
              });
            });
          });

          const pdfBytes = await pdfDoc.save();
          pdfs.push(new Blob([pdfBytes as any], { type: "application/pdf" }));
        }

        // Si solo hay 1 PDF, retornarlo directamente
        if (pdfs.length === 1) {
          return pdfs[0];
        }

        // Si hay múltiples PDFs, retornar array para crear ZIP
        return pdfs;
      } catch (error) {
        console.error("❌ Error generating multiple ADI certificates:", error);
        throw error;
      }
    },
    []
  );

  return {
    generateSingleAdiCertificate,
    generateMultipleAdiCertificates,
  };
}