"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  getInsuranceFieldCoordinates,
  getInsurancePositionCoordinates,
} from "@/lib/certificateInsuranceCoordinates";

/**
 * Generador específico para certificados Insurance Discount Class
 *
 * Este generador usa coordenadas exactas para cada campo en cada posición (1, 2, 3)
 * en lugar de dividir la página en filas iguales.
 *
 * Características:
 * - 1 estudiante: usa solo posición 1 (top)
 * - 2 estudiantes: usa posiciones 1 y 2 (top + middle)
 * - 3 estudiantes: usa posiciones 1, 2, y 3 (top + middle + bottom)
 */
export function useInsuranceCertificateGenerator() {
  /**
   * Genera un PDF con 1 estudiante en la posición 1
   */
  const generateSingleInsuranceCertificate = useCallback(
    async (student: Student, pdfTemplatePath: string) => {

      try {
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

        // Obtener coordenadas para la posición 1
        const coordinates = getInsurancePositionCoordinates(1);

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
        for (const [fieldKey, coord] of Object.entries(coordinates)) {
          // Obtener el nombre del campo en la base de datos
          const dbFieldKey = fieldMapping[fieldKey] || fieldKey;
          let value = (student as any)[dbFieldKey];

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

            continue;
          }

          // Campo de texto normal - usar Helvetica
          // Validar que x e y existen (no son opcionales para campos de texto)
          if (coord.x === undefined || coord.y === undefined) {

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
        console.error("❌ Error generating Insurance certificate:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Genera un PDF con múltiples estudiantes (hasta 3 por página)
   */
  const generateMultipleInsuranceCertificates = useCallback(
    async (students: Student[], pdfTemplatePath: string) => {

      try {
        const pdfs: Blob[] = [];
        const studentsPerPage = 3;

        // Procesar estudiantes en grupos de 3
        for (let i = 0; i < students.length; i += studentsPerPage) {
          const studentsGroup = students.slice(i, i + studentsPerPage);

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

          // Mapeo de nombres de campos (coordenadas -> base de datos)
          const fieldMapping: Record<string, string> = {
            firstName: 'first_name',
            lastName: 'last_name',
            middleName: 'midl',
            licenseNumber: 'licenseNumber',
            licenseNumber2: 'licenseNumber', // Segunda aparición del mismo número
            citationNumber: 'citationNumber',
            courseDate: 'courseDate',
            certn: 'certn',
            address: 'address',
            instructorSignature: 'instructorSignature'
          };

          // Dibujar cada estudiante en su posición correspondiente
          for (let studentIndex = 0; studentIndex < studentsGroup.length; studentIndex++) {
            const student = studentsGroup[studentIndex];
            const position = (studentIndex + 1) as 1 | 2 | 3;

            // Obtener coordenadas para esta posición
            const coordinates = getInsurancePositionCoordinates(position);

            // Dibujar cada campo en su posición
            for (const [fieldKey, coord] of Object.entries(coordinates)) {
              // Obtener el nombre del campo en la base de datos
              const dbFieldKey = fieldMapping[fieldKey] || fieldKey;
              let value = (student as any)[dbFieldKey];

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

                continue;
              }

              // Campo de texto normal - usar Helvetica
              // Validar que x e y existen (no son opcionales para campos de texto)
              if (coord.x === undefined || coord.y === undefined) {

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


        return pdfs.length === 1 ? pdfs[0] : pdfs;
      } catch (error) {
        console.error("❌ Error generating multiple Insurance certificates:", error);
        throw error;
      }
    },
    []
  );

  return {
    generateSingleInsuranceCertificate,
    generateMultipleInsuranceCertificates,
  };
}
