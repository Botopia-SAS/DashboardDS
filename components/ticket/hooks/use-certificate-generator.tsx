"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function useCertificateGenerator() {
  const generateCertificatePDF = useCallback(async (user: Student) => {
    const {
      last_name,
      first_name,
      midl,
      birthDate,
      certn,
      courseDate,
      type, // now using type instead of courseType
    } = user;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // Landscape A4 dimensions in points
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw outer borders
    const borderWidths = [6, 4, 2];
    borderWidths.forEach((borderWidth, index) => {
      page.drawRectangle({
        x: 20 + index * 10,
        y: 20 + index * 10,
        width: width - 40 - index * 20,
        height: height - 40 - index * 20,
        borderColor: rgb(0, 0, 0),
        borderWidth,
      });
    });

    // Add title - mismo para ambos tipos
    page.drawText("AFFORDABLE DRIVING TRAFFIC SCHOOL", {
      x: width / 2 - 250,
      y: height - 70,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("CERTIFICATE OF COMPLETION", {
      x: width / 2 - 150,
      y: height - 100,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText("3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406", {
      x: width / 2 - 180,
      y: height - 130,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText("561-969-0150 / 561-330-7007", {
      x: width / 2 - 90,
      y: height - 150,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    // Add "This Certifies That"
    page.drawText(
      "This Certifies that the person named below has successfully completed the Florida Dept.",
      {
        x: width / 2 - 300,
        y: height - 180,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      }
    ); // Texto diferente según el tipo de certificado
    if (type === "bdi") {
      page.drawText(
        'Highway Safety and Motor Vehicles "Drive Safety & Driver Improvement Course"',
        {
          x: width / 2 - 270,
          y: height - 200,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        }
      );
    } else {
      // Certificado para date/class-records
      page.drawText(
        'Highway Safety and Motor Vehicles "Driver Education Program Course"',
        {
          x: width / 2 - 270,
          y: height - 200,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        }
      );
    } // Citation No - solo para BDI
    if (type === "bdi") {
      page.drawText("Citation No: 2337PHQ", {
        // Este campo debería ser dinámico en una implementación real
        x: 100,
        y: height - 230,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Driver License Number - solo para BDI
    if (type === "bdi") {
      page.drawText(
        `Driver License Number: ${user.licenseNumber || "D200-815-87-338-0"}`,
        {
          x: 100,
          y: height - 260,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        }
      );
    } // Course Completion Date
    if (type === "bdi") {
      page.drawText(`Course Completion Date: ${courseDate}`, {
        x: 100,
        y: height - 290,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    } else {
      // DATE certificate - Centered course completion date
      page.drawText(`Course Completion Date: ${courseDate}`, {
        x: width / 2 - 100,
        y: height - 240, // Moved down for better spacing
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Add student name
    if (type === "bdi") {
      page.drawText("Name:", {
        x: 100,
        y: height - 320,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${first_name} ${midl || ""} ${last_name}`, {
        x: 150,
        y: height - 320,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    } else {
      // DATE certificate - Centered student name with more visibility
      page.drawText("Name:", {
        x: width / 2 - 150,
        y: height - 270, // Moved down for better spacing
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${first_name} ${midl || ""} ${last_name}`, {
        x: width / 2 - 80,
        y: height - 270, // Aligned with the "Name:" label
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    } // Add certificate number
    if (type === "bdi") {
      page.drawText(`Certificate #: ${certn}`, {
        x: 500,
        y: height - 230,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    } else {
      // DATE certificate - Better positioned certificate number
      page.drawText(`Certificate #: ${certn}`, {
        x: width / 2 - 80,
        y: height - 300, // More space between name and certificate number
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    } // Address - solo visible en el certificado BDI según la imagen
    if (type === "bdi") {
      page.drawText("Address:", {
        x: 100,
        y: height - 350,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // City, State, ZIP - solo visible en el certificado BDI según la imagen
    if (type === "bdi") {
      page.drawText("City, State, Zip:", {
        x: 100,
        y: height - 380,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText("FL", {
        // Este dato debería ser dinámico en una implementación real
        x: 200,
        y: height - 380,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    } // Contenido específico para certificados DATE
    if (type !== "bdi") {
      // Add birth date with better spacing
      page.drawText("Date of Birth:", {
        x: width / 2 - 80,
        y: height - 330, // Increased space between elements
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${birthDate}`, {
        x: width / 2 + 30,
        y: height - 330, // Aligned with label
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Add program details - better centered and spaced
      page.drawText("Has successfully completed the", {
        x: width / 2 - 150,
        y: height - 370, // More space between birth date and this text
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });

      // Make D.A.T.E. more prominent and centered
      page.drawText("D.A.T.E.", {
        x: width / 2 - 50,
        y: height - 410, // More space below previous text
        size: 26, // Larger font size for emphasis
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("Drug, Alcohol and Traffic Education Program", {
        x: width / 2 - 200,
        y: height - 450, // More space below D.A.T.E.
        size: 18, // Larger font for better readability
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText("Pursuant to Section 322.095, Florida Statutes", {
        x: width / 2 - 200,
        y: height - 480, // More space below previous text
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });
    }

    // Add instructor signature image
    try {
      const instructorSignatureBytes = await fetch(
        "/firma_instructor.png"
      ).then((res) => res.arrayBuffer());
      const instructorSignature = await pdfDoc.embedPng(
        instructorSignatureBytes
      );
      const signatureDims = instructorSignature.scale(0.8);

      if (type === "bdi") {
        page.drawImage(instructorSignature, {
          x: 100,
          y: 100,
          width: signatureDims.width,
          height: signatureDims.height,
        });
      } else {
        // DATE certificate - Firma del instructor más abajo y en la esquina
        page.drawImage(instructorSignature, {
          x: 80, // Más a la izquierda
          y: 70, // Más abajo en la página
          width: signatureDims.width,
          height: signatureDims.height,
        });
      }
    } catch (error) {
      console.error("Error loading instructor signature:", error);
    } // Add footer with instructor info
    if (type === "bdi") {
      page.drawText("Instructor's Signature", {
        x: 130,
        y: 60,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
    } else {
      // DATE certificate - Texto de la firma del instructor más abajo y en la esquina
      page.drawText("Instructor's Signature", {
        x: 100,
        y: 50, // Más abajo en la página
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });
    } // Course Presented by line - solo para BDI
    if (type === "bdi") {
      page.drawText("Course Presented by:", {
        x: 450,
        y: 110,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // Línea para la firma
      page.drawLine({
        start: { x: 450, y: 90 },
        end: { x: 650, y: 90 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    } else {
      // Para certificados DATE, mostrar el director más abajo y en la esquina
      page.drawText("Nelson E. Guarin", {
        x: width - 180, // Más a la derecha
        y: 70, // Más abajo en la página
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("Director", {
        x: width - 180, // Más a la derecha
        y: 50, // Más abajo en la página
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });

      // Centrar la fecha en el documento
      page.drawText(`Date:`, {
        x: width / 2 - 30,
        y: 70, // Más abajo en la página para mantener alineación
        size: 16,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${courseDate}`, {
        x: width / 2 + 10,
        y: 70, // Más abajo en la página para mantener alineación
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }

    // Add seals/logos
    try {
      // Para BDI usamos el sello de la Florida
      if (type === "bdi") {
        const sealImageBytes = await fetch("/sello2.png").then((res) =>
          res.arrayBuffer()
        );
        const sealImage = await pdfDoc.embedPng(sealImageBytes);
        const sealDims = sealImage.scale(0.5);

        page.drawImage(sealImage, {
          x: width - 180,
          y: height - 180,
          width: sealDims.width,
          height: sealDims.height,
        });
      } else {
        // Para DATE, usamos ambos sellos con mejor ubicación y tamaño
        const sealImageBytes = await fetch("/sello1.png").then((res) =>
          res.arrayBuffer()
        );
        const sealImage = await pdfDoc.embedPng(sealImageBytes);
        const sealDims = sealImage.scale(0.65); // Slightly smaller seal

        page.drawImage(sealImage, {
          x: 120,
          y: height / 2 - 30, // Better vertical centered
          width: sealDims.width,
          height: sealDims.height,
        });

        const sealImageBytes2 = await fetch("/sello2.png").then((res) =>
          res.arrayBuffer()
        );
        const sealImage2 = await pdfDoc.embedPng(sealImageBytes2);
        const sealDims2 = sealImage2.scale(0.65); // Slightly smaller seal

        page.drawImage(sealImage2, {
          x: width - 220,
          y: height / 2 - 30, // Better vertical centered
          width: sealDims2.width,
          height: sealDims2.height,
        });
      }
    } catch (error) {
      console.error("Error loading seal images:", error);
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  }, []);

  return { generateCertificatePDF };
}
