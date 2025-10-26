"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  getYouthfulOffenderFieldCoordinates,
  getYouthfulOffenderPositionCoordinates,
} from "@/lib/certificateYouthfulOffenderCoordinates";

/**
 * Generador específico para certificados Youthful Offender Class
 *
 * Este generador usa coordenadas exactas para cada campo en cada posición (1, 2, 3)
 * en lugar de dividir la página en filas iguales.
 *
 * Características:
 * - 1 estudiante: usa solo posición 1 (top)
 * - 2 estudiantes: usa posiciones 1 y 2 (top + middle)
 * - 3 estudiantes: usa posiciones 1, 2, y 3 (top + middle + bottom)
 */
export function useYouthfulOffenderCertificateGenerator() {
  /**
   * Genera un PDF con 1 estudiante en la posición 1
   */
  const generateSingleYouthfulOffenderCertificate = useCallback(
    async (student: Student, pdfTemplatePath: string) => {
      console.log("🎓 Youthful Offender: Generating single certificate");
      console.log(`   📋 Student: ${student.first_name} ${student.last_name}`);

      try {
        // Cargar el template PDF
        const templateResponse = await fetch(pdfTemplatePath);
        const templateBytes = await templateResponse.arrayBuffer();
        const pdfDoc = await PDFDocument.load(templateBytes);

        // Obtener la primera página
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        console.log(`   📄 PDF size: ${width}x${height}`);

        // Cargar fuentes
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Obtener coordenadas para la posición 1
        const coordinates = getYouthfulOffenderPositionCoordinates(1);

        // Dibujar cada campo en su posición
        for (const [fieldKey, coord] of Object.entries(coordinates)) {
          let value = (student as any)[fieldKey];

          // Manejar firma del instructor como imagen
          if (fieldKey === "instructorSignature") {
            if (value && coord.x !== undefined && coord.y !== undefined) {
              try {
                const signatureBytes = await fetch(value).then((res) => res.arrayBuffer());
                let signatureImage;
                try {
                  signatureImage = await pdfDoc.embedPng(signatureBytes);
                } catch {
                  signatureImage = await pdfDoc.embedJpg(signatureBytes);
                }
                
                const signatureDims = signatureImage.scale(0.15);
                const pdfY = height - coord.y - signatureDims.height;
                
                firstPage.drawImage(signatureImage, {
                  x: coord.x,
                  y: pdfY,
                  width: signatureDims.width,
                  height: signatureDims.height,
                });
                console.log(`  🖼️ ${fieldKey}: Image drawn at (${coord.x}, ${pdfY})`);
              } catch (error) {
                console.error(`  ❌ Error loading signature image:`, error);
              }
            }
            continue;
          }

          // Transformaciones especiales
          if (fieldKey === "courseDate" && value) {
            const date = new Date(value);
            value = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          }

          // Si no hay valor, omitir (no usar mock data)
          if (!value || value === "") {
            console.log(`  ⚠️ ${fieldKey} is empty, skipping`);
            continue;
          }

          // Campo de texto normal - usar Helvetica
          // Validar que x e y existen (no son opcionales para campos de texto)
          if (coord.x === undefined || coord.y === undefined) {
            console.log(`  ⚠️ ${fieldKey} missing coordinates, skipping`);
            continue;
          }

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

          // Truncar texto si es muy largo
          let finalText = String(value);
          if (coord.maxWidth && textWidth > coord.maxWidth) {
            // Calcular cuántos caracteres caben
            const avgCharWidth = textWidth / finalText.length;
            const maxChars = Math.floor(coord.maxWidth / avgCharWidth) - 3; // -3 para "..."
            finalText = finalText.substring(0, maxChars) + "...";
          }

          console.log(`  ✏️ ${fieldKey}: "${finalText}" at (${finalX}, ${pdfY})`);

          firstPage.drawText(finalText, {
            x: finalX,
            y: pdfY,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }

        // Generar el PDF
        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes as any], { type: "application/pdf" });
      } catch (error) {
        console.error("❌ Error generating Youthful Offender certificate:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Genera un PDF con múltiples estudiantes (hasta 3 por página)
   */
  const generateMultipleYouthfulOffenderCertificates = useCallback(
    async (students: Student[], pdfTemplatePath: string) => {
      console.log(`🎓 Youthful Offender: Generating certificates for ${students.length} students`);

      try {
        const pdfs: Blob[] = [];
        const studentsPerPage = 3;

        // Procesar estudiantes en grupos de 3
        for (let i = 0; i < students.length; i += studentsPerPage) {
          const studentsGroup = students.slice(i, i + studentsPerPage);
          console.log(`📄 Processing page ${Math.floor(i / studentsPerPage) + 1} with ${studentsGroup.length} students`);

          // Cargar el template PDF
          const templateResponse = await fetch(pdfTemplatePath);
          const templateBytes = await templateResponse.arrayBuffer();
          const pdfDoc = await PDFDocument.load(templateBytes);

          // Obtener la primera página
          const pages = pdfDoc.getPages();
          const firstPage = pages[0];
          const { width, height } = firstPage.getSize();

          // Cargar fuentes
          const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

          // Dibujar cada estudiante en su posición correspondiente
          for (let studentIndex = 0; studentIndex < studentsGroup.length; studentIndex++) {
            const student = studentsGroup[studentIndex];
            const position = (studentIndex + 1) as 1 | 2 | 3;
            console.log(`  👤 Student ${studentIndex + 1}: ${student.first_name} ${student.last_name} (position ${position})`);

            // Obtener coordenadas para esta posición
            const coordinates = getYouthfulOffenderPositionCoordinates(position);

            // Dibujar cada campo en su posición
            for (const [fieldKey, coord] of Object.entries(coordinates)) {
              let value = (student as any)[fieldKey];

              // Manejar firma del instructor como imagen
              if (fieldKey === "instructorSignature") {
                if (value && coord.x !== undefined && coord.y !== undefined) {
                  try {
                    const signatureBytes = await fetch(value).then((res) => res.arrayBuffer());
                    let signatureImage;
                    try {
                      signatureImage = await pdfDoc.embedPng(signatureBytes);
                    } catch {
                      signatureImage = await pdfDoc.embedJpg(signatureBytes);
                    }
                    
                    const signatureDims = signatureImage.scale(0.15);
                    const pdfY = height - coord.y - signatureDims.height;
                    
                    firstPage.drawImage(signatureImage, {
                      x: coord.x,
                      y: pdfY,
                      width: signatureDims.width,
                      height: signatureDims.height,
                    });
                    console.log(`    🖼️ ${fieldKey}: Image drawn at (${coord.x}, ${pdfY})`);
                  } catch (error) {
                    console.error(`    ❌ Error loading signature image:`, error);
                  }
                }
                continue;
              }

              // Transformaciones especiales
              if (fieldKey === "courseDate" && value) {
                const date = new Date(value);
                value = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }

              // Si no hay valor, omitir (no usar mock data)
              if (!value || value === "") {
                console.log(`    ⚠️ ${fieldKey} is empty, skipping`);
                continue;
              }

              // Campo de texto normal - usar Helvetica
              // Validar que x e y existen (no son opcionales para campos de texto)
              if (coord.x === undefined || coord.y === undefined) {
                console.log(`    ⚠️ ${fieldKey} missing coordinates, skipping`);
                continue;
              }

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

              // Truncar texto si es muy largo
              let finalText = String(value);
              if (coord.maxWidth && textWidth > coord.maxWidth) {
                // Calcular cuántos caracteres caben
                const avgCharWidth = textWidth / finalText.length;
                const maxChars = Math.floor(coord.maxWidth / avgCharWidth) - 3; // -3 para "..."
                finalText = finalText.substring(0, maxChars) + "...";
              }

              console.log(`    ✏️ ${fieldKey}: "${finalText}" at (${finalX}, ${pdfY})`);

              firstPage.drawText(finalText, {
                x: finalX,
                y: pdfY,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0),
              });
            }
          }

          // Generar el PDF para este grupo
          const pdfBytes = await pdfDoc.save();
          pdfs.push(new Blob([pdfBytes as any], { type: "application/pdf" }));
        }

        console.log(`✅ Youthful Offender: Generated ${pdfs.length} PDF(s) for ${students.length} students`);
        return pdfs.length === 1 ? pdfs[0] : pdfs;
      } catch (error) {
        console.error("❌ Error generating multiple Youthful Offender certificates:", error);
        throw error;
      }
    },
    []
  );

  return {
    generateSingleYouthfulOffenderCertificate,
    generateMultipleYouthfulOffenderCertificates,
  };
}
