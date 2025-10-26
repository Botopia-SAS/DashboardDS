"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  get8HoursFieldCoordinates,
  get8HoursPositionCoordinates,
} from "@/lib/certificate8HoursCoordinates";

/**
 * Generador específico para certificados de 8 horas
 *
 * Este generador usa coordenadas exactas para cada campo en cada posición (1, 2, 3)
 * en lugar de dividir la página en filas iguales.
 *
 * Características:
 * - 1 estudiante: usa solo posición 1 (top)
 * - 2 estudiantes: usa posiciones 1 y 2 (top + middle)
 * - 3 estudiantes: usa posiciones 1, 2, y 3 (top + middle + bottom)
 */
export function use8HoursCertificateGenerator() {
  /**
   * Genera un PDF con 1 estudiante en la posición 1
   */
  const generateSingle8HoursCertificate = useCallback(
    async (student: Student, pdfTemplatePath: string) => {
      console.log("🎓 Generating single 8-hours certificate");
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
        const coordinates = get8HoursPositionCoordinates(1);

        // Mapeo de nombres de campos (coordenadas -> base de datos)
        const fieldMapping: Record<string, string> = {
          firstName: 'first_name',
          lastName: 'last_name',
          middleName: 'midl',
          licenseNumber: 'licenseNumber',
          citationNumber: 'citationNumber',
          courseDate: 'courseDate',
          address: 'address',
          schoolOfficial: 'schoolOfficial',
          attendance: 'attendance',
          circuitCourtNo: 'circuitCourtNo',
          county: 'county',
          instructorSignature: 'instructorSignature'
        };

        // Dibujar cada campo en su posición
        for (const [fieldKey, coord] of Object.entries(coordinates)) {
          console.log(`  🔍 Processing field: ${fieldKey}`);

          // Obtener el nombre del campo en la base de datos
          const dbFieldKey = fieldMapping[fieldKey] || fieldKey;
          let value = (student as any)[dbFieldKey];
          console.log(`  📝 Field "${fieldKey}" -> DB "${dbFieldKey}" = "${value}"`);

          // Manejar firma del instructor como imagen
          if (fieldKey === "instructorSignature") {
            if (value && coord.x !== undefined && coord.y !== undefined) {
              try {
                console.log(`  📥 Loading signature from: ${value}`);
                const signatureResponse = await fetch(value);
                console.log(`  📥 Signature response status: ${signatureResponse.status}`);

                const signatureBytes = await signatureResponse.arrayBuffer();
                console.log(`  📥 Signature bytes loaded: ${signatureBytes.byteLength} bytes`);

                let signatureImage;
                try {
                  signatureImage = await pdfDoc.embedPng(signatureBytes);
                  console.log(`  ✅ Signature embedded as PNG`);
                } catch {
                  signatureImage = await pdfDoc.embedJpg(signatureBytes);
                  console.log(`  ✅ Signature embedded as JPG`);
                }

                const signatureDims = signatureImage.scale(0.15);
                const pdfY = height - coord.y - signatureDims.height;

                page.drawImage(signatureImage, {
                  x: coord.x,
                  y: pdfY,
                  width: signatureDims.width,
                  height: signatureDims.height,
                });
                console.log(`  🖼️ ${fieldKey}: Image drawn at (${coord.x}, ${pdfY}) with size ${signatureDims.width}x${signatureDims.height}`);
              } catch (error) {
                console.error(`  ❌ Error loading signature image:`, error);
                // NO lanzar el error, solo logging - continuar sin firma
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

          // Si no hay valor, saltar este campo (no usar datos mock)
          if (!value || value === "") {
            console.log(`  ⚠️ ${fieldKey} (${dbFieldKey}) is empty, skipping`);
            continue;
          }

          // Manejar checkboxes
          if (coord.isCheckbox && coord.checkboxOptions) {
            // Encontrar la opción que coincide con el valor
            const selectedOption = coord.checkboxOptions.find(opt => opt.value === value);

            if (selectedOption) {
              // Dibujar una X en el checkbox seleccionado
              const checkSize = coord.fontSize || 8;
              const pdfY = height - selectedOption.y - checkSize;

              page.drawText("X", {
                x: selectedOption.x,
                y: pdfY,
                size: checkSize,
                font: helvetica,
                color: rgb(0, 0, 0),
              });

              console.log(`  ✓ ${fieldKey} checkbox: "${value}" marked at (${selectedOption.x}, ${pdfY})`);
            }
          } else {
            // Campo de texto normal - usar Helvetica como aproximación a Montserrat
            // Validar que x e y existen (no son opcionales para campos de texto)
            if (coord.x === undefined || coord.y === undefined) {
              console.log(`  ⚠️ ${fieldKey} missing coordinates, skipping`);
              continue;
            }

            const font = helvetica;
            const fontSize = coord.fontSize || 8;
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
          }
        }

        console.log('💾 Saving PDF...');
        const pdfBytes = await pdfDoc.save();
        console.log(`✅ PDF saved: ${pdfBytes.length} bytes, type: ${pdfBytes.constructor.name}`);

        // Verificar que pdfBytes es un Uint8Array válido
        if (!(pdfBytes instanceof Uint8Array)) {
          console.error('❌ pdfBytes is not a Uint8Array:', typeof pdfBytes);
          throw new Error('PDF save did not return a Uint8Array');
        }

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        console.log(`✅ Blob created: ${blob.size} bytes, type: ${blob.type}`);

        return blob;
      } catch (error) {
        console.error("❌ Error generating single 8-hours certificate:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Genera un PDF con múltiples estudiantes (hasta 3 por página)
   * Si hay más de 3, genera múltiples PDFs en un ZIP
   */
  const generateMultiple8HoursCertificates = useCallback(
    async (students: Student[], pdfTemplatePath: string) => {
      console.log("🎓 Generating multiple 8-hours certificates");
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
            citationNumber: 'citationNumber',
            courseDate: 'courseDate',
            address: 'address',
            schoolOfficial: 'schoolOfficial',
            attendance: 'attendance',
            circuitCourtNo: 'circuitCourtNo',
            county: 'county',
            instructorSignature: 'instructorSignature'
          };

          // Dibujar cada estudiante en su posición
          for (let index = 0; index < chunk.length; index++) {
            const student = chunk[index];
            const position = (index + 1) as 1 | 2 | 3;
            const coordinates = get8HoursPositionCoordinates(position);

            console.log(`  🎫 ${student.first_name} ${student.last_name} at position ${position}`);

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
                    
                    page.drawImage(signatureImage, {
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

              // Si no hay valor, saltar este campo (no usar datos mock)
              if (!value || value === "") {
                console.log(`  ⚠️ ${fieldKey} (${dbFieldKey}) is empty, skipping`);
                continue;
              }

              // Manejar checkboxes
              if (coord.isCheckbox && coord.checkboxOptions) {
                // Encontrar la opción que coincide con el valor
                const selectedOption = coord.checkboxOptions.find(opt => opt.value === value);

                if (selectedOption) {
                  // Dibujar una X en el checkbox seleccionado
                  const checkSize = coord.fontSize || 8;
                  const pdfY = height - selectedOption.y - checkSize;

                  page.drawText("X", {
                    x: selectedOption.x,
                    y: pdfY,
                    size: checkSize,
                    font: helvetica,
                    color: rgb(0, 0, 0),
                  });

                  console.log(`  ✓ ${fieldKey} checkbox: "${value}" marked at (${selectedOption.x}, ${pdfY})`);
                }
              } else {
                // Campo de texto normal - usar Helvetica como aproximación a Montserrat
                // Validar que x e y existen (no son opcionales para campos de texto)
                if (coord.x === undefined || coord.y === undefined) {
                  console.log(`  ⚠️ ${fieldKey} missing coordinates, skipping`);
                  return;
                }

                const font = helvetica;
                const fontSize = coord.fontSize || 8;
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
              }
            }
          }

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
        console.error("❌ Error generating multiple 8-hours certificates:", error);
        throw error;
      }
    },
    []
  );

  return {
    generateSingle8HoursCertificate,
    generateMultiple8HoursCertificates,
  };
}
