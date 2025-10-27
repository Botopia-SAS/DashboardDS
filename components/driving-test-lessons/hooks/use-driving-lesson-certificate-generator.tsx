"use client";

import { useState, useCallback } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  getDrivingLessonFieldCoordinates,
  FieldDrivingLessonCoordinate,
} from "@/lib/certificateDrivingLessonsCoordinates";

export interface DrivingLessonCertificateData {
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  completionDate: string;
  instructorSignature?: string;
  hours: number;
  selectedClassIds?: string[]; // IDs of selected classes (slots)
}

export function useDrivingLessonCertificateGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Genera un PDF con múltiples certificados de Driving Lessons (hasta 3 por página)
   */
  const generateMultipleDrivingLessonCertificates = useCallback(
    async (
      students: DrivingLessonCertificateData[],
      pdfTemplatePath: string
    ) => {
      setIsGenerating(true);

      try {
        const pdfs: Blob[] = [];

        // Procesar en chunks de 3
        for (let i = 0; i < students.length; i += 3) {
          const chunk = students.slice(i, Math.min(i + 3, students.length));

          const pdfDoc = await PDFDocument.create();

          // Cargar el PDF template de fondo
          const templateBytes = await fetch(pdfTemplatePath).then((res) => {
            if (!res.ok)
              throw new Error(`Failed to load PDF: ${pdfTemplatePath}`);
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

          // Mapeo de nombres de campos
          const fieldMapping: Record<string, string> = {
            firstName: "firstName",
            lastName: "lastName",
            licenseNumber: "licenseNumber",
            completionDate: "completionDate",
            hours: "hours",
            instructorSignature: "instructorSignature",
          };

          // Dibujar cada estudiante en su posición (1, 2, o 3)
          for (let index = 0; index < chunk.length; index++) {
            const student = chunk[index];
            const position = (index + 1) as 1 | 2 | 3;

            for (const [fieldKey, studentKey] of Object.entries(fieldMapping)) {
              const coord = getDrivingLessonFieldCoordinates(fieldKey, position);
              if (coord) {
                const value = (student as any)[studentKey];
                if (value !== undefined && value !== null && value !== "") {
                  // Convert Y coordinate from top-based to bottom-based
                  const pdfY = height - coord.y;

                  // Handle different field types
                  if (fieldKey === "instructorSignature" && value) {
                    // Try to embed signature image if it's a URL (Cloudinary) or base64
                    try {
                      if (value.startsWith('data:image/')) {
                        // Base64 image
                        const base64Data = value.split(',')[1];
                        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        const image = await pdfDoc.embedPng(imageBytes);
                        
                        page.drawImage(image, {
                          x: coord.x,
                          y: pdfY - (coord.height || 30),
                          width: coord.width || 100,
                          height: coord.height || 30,
                        });
                      } else if (value.startsWith('http://') || value.startsWith('https://')) {
                        // URL image (Cloudinary)
                        const imageResponse = await fetch(value);
                        if (imageResponse.ok) {
                          const imageBytes = await imageResponse.arrayBuffer();
                          const uint8Array = new Uint8Array(imageBytes);
                          
                          // Try PNG first, then JPG
                          let image;
                          try {
                            image = await pdfDoc.embedPng(uint8Array);
                          } catch {
                            image = await pdfDoc.embedJpg(uint8Array);
                          }
                          
                          page.drawImage(image, {
                            x: coord.x,
                            y: pdfY - (coord.height || 30),
                            width: coord.width || 100,
                            height: coord.height || 30,
                          });
                        }
                      }
                    } catch (err) {
                      console.error('Error embedding signature image:', err);
                    }
                  } else if (fieldKey === "hours") {
                    // Display hours as number
                    const text = `${value}`;
                    const font = coord.fontFamily === "Times-Roman" ? timesRoman : helvetica;
                    page.drawText(text, {
                      x: coord.x,
                      y: pdfY,
                      size: coord.fontSize,
                      font: font,
                      color: rgb(0, 0, 0),
                    });
                  } else {
                    // Regular text field
                    const text = String(value);
                    const font = coord.fontFamily === "Times-Roman" ? timesRoman : helvetica;

                    // Handle max width truncation
                    let displayText = text;
                    if (coord.maxWidth) {
                      displayText = text.substring(
                        0,
                        Math.floor(coord.maxWidth / (coord.fontSize / 1.5))
                      );
                    }

                    page.drawText(displayText, {
                      x: coord.x,
                      y: pdfY,
                      size: coord.fontSize,
                      font: font,
                      color: rgb(0, 0, 0),
                    });
                  }
                }
              }
            }
          }

          // Guardar PDF
          const pdfBytes = await pdfDoc.save();
          pdfs.push(new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }));
        }

        setIsGenerating(false);
        return pdfs;
      } catch (error) {
        console.error("Error generating driving lesson certificates:", error);
        setIsGenerating(false);
        throw error;
      }
    },
    []
  );

  return {
    generateMultipleDrivingLessonCertificates,
    isGenerating,
  };
}

