import { useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import { saveAs } from 'file-saver';

export interface MultiCertificateData {
  certificateNumber: string;
  printDate: string;
  courseCompletionDate: string;
  citationNumber: string;
  citationCounty: string;
  driversLicenseNumber: string;
  studentName: string;
  dateOfBirth: string;
  reasonAttending: string;
}

export function useMultiCertificateDownloader() {
  const downloadMultipleCertificates = useCallback(async (certificates: MultiCertificateData[], targetPages: number = 1) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Dynamic layout based on target pages
      const numCertificates = certificates.length;
      let certificatesPerPage: number;
      
      if (targetPages === 1) {
        // All certificates on one page - adjust size dynamically
        certificatesPerPage = numCertificates;
      } else {
        // Distribute evenly across target pages
        certificatesPerPage = Math.ceil(numCertificates / targetPages);
      }
      
      const totalPages = Math.ceil(certificates.length / certificatesPerPage);

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
        const { width, height } = page.getSize();

        // Calculate certificate dimensions consistently - same proportions always
        const certificateWidth = width - 20; // Full width minus small margins
        const certificateHeight = (height - 30) / certificatesPerPage; // Consistent height calculation
        const marginX = 10;
        const marginY = 15;

        // Process certificates for this page (2 certificates stacked vertically)
        const startIndex = pageIndex * certificatesPerPage;
        const endIndex = Math.min(startIndex + certificatesPerPage, certificates.length);
        const pageCertificates = certificates.slice(startIndex, endIndex);

        pageCertificates.forEach((certData, index) => {
          // Position certificates stacked vertically (one above the other)
          const x = marginX;
          const y = height - marginY - (index * (certificateHeight + 20));

          // Draw certificate using official template
          drawOfficialCertificate(page, certData, x, y, certificateWidth, certificateHeight, font, boldFont);
        });
      }

      // Convert PDF to bytes
      const pdfBytes = await pdfDoc.save();

      // Create download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const fileName = `ADI_Certificates_Combined_${new Date().toISOString().split('T')[0]}.pdf`;
      

      // Try multiple download methods
      try {
        saveAs(blob, fileName);

      } catch (error) {
        console.error('saveAs failed, trying alternative method:', error);
        
        // Alternative download method
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

      }

      return true;
    } catch (error) {
      console.error('Error generating multi-certificate PDF:', error);
      return false;
    }
  }, []);

  return { downloadMultipleCertificates };
}

// Function to draw the official certificate template
function drawOfficialCertificate(
  page: PDFPage,
  certData: MultiCertificateData,
  x: number,
  y: number,
  width: number,
  height: number,
  font: any,
  boldFont: any
) {
  // Draw border
  page.drawRectangle({
    x: x,
    y: y - height,
    width: width,
    height: height,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });

  // Inner border
  page.drawRectangle({
    x: x + 10,
    y: y - height + 10,
    width: width - 20,
    height: height - 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Base dimensions for a standard certificate (reference size)
  const BASE_WIDTH = 400;
  const BASE_HEIGHT = 500;
  
  // Calculate proportional scale factor - use average of width and height scaling for better balance
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  const scaleFactor = (widthScale + heightScale) / 2; // Average for balanced scaling
  
  // Base font sizes that will be scaled proportionally
  const BASE_TITLE_SIZE = 16;
  const BASE_HEADER_SIZE = 14;
  const BASE_LABEL_SIZE = 11;
  const BASE_VALUE_SIZE = 10;
  
  // Scaled font sizes - maintain proportions with minimum sizes for readability
  const titleSize = Math.max(10, BASE_TITLE_SIZE * scaleFactor);
  const headerSize = Math.max(9, BASE_HEADER_SIZE * scaleFactor);
  const labelSize = Math.max(8, BASE_LABEL_SIZE * scaleFactor);
  const valueSize = Math.max(7, BASE_VALUE_SIZE * scaleFactor);

  // Base spacing values that will be scaled proportionally
  const BASE_MARGIN_TOP = 25;
  const BASE_SPACING_SMALL = 10;
  const BASE_SPACING_MEDIUM = 15;
  const BASE_SPACING_LARGE = 20;
  
  let currentY = y - (BASE_MARGIN_TOP * scaleFactor);

  // Header - School Name
  page.drawText("AFFORDABLE DRIVING TRAFFIC SCHOOL", {
    x: x + width / 2 - (titleSize * 12),
    y: currentY,
    size: titleSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= titleSize + (BASE_SPACING_SMALL * scaleFactor);

  // Certificate Title
  page.drawText("CERTIFICATE OF COMPLETION", {
    x: x + width / 2 - (headerSize * 8),
    y: currentY,
    size: headerSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= headerSize + (BASE_SPACING_MEDIUM * scaleFactor);

  // Address
  page.drawText("3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406", {
    x: x + width / 2 - (valueSize * 15),
    y: currentY,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });
  currentY -= valueSize + (BASE_SPACING_SMALL * scaleFactor);

  // Phone
  page.drawText("561-969-0150 / 561-330-7007", {
    x: x + width / 2 - (valueSize * 8),
    y: currentY,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });
  currentY -= valueSize + (BASE_SPACING_LARGE * scaleFactor);

  // Certification Statement
  const statement = "This Certifies that the person named below has successfully completed the Florida Dept. Highway Safety and Motor Vehicles 'Drive Safety & Driver Improvement Course'";
  page.drawText(statement, {
    x: x + 15,
    y: currentY,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });
  currentY -= valueSize * 3 + 20;

  // Student Details - Two Column Layout
  const leftColumnX = x + 15;
  const rightColumnX = x + width / 2 + 15;
  const rightLabelX = x + width / 2 - 15;

  // Left Column
  const leftDetails = [
    { label: "Citation No:", value: certData.citationNumber },
    { label: "Driver License Number:", value: certData.driversLicenseNumber },
    { label: "Course Completion Date:", value: certData.courseCompletionDate },
    { label: "Name:", value: certData.studentName },
    { label: "Course Location:", value: "Boca Raton, FL" }
  ];

  // Base spacing for details - more balanced
  const BASE_DETAIL_SPACING = 22;
  
  leftDetails.forEach((detail, index) => {
    const spacing = BASE_DETAIL_SPACING * scaleFactor;
    page.drawText(detail.label, {
      x: leftColumnX,
      y: currentY - (index * spacing),
      size: labelSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Truncate long values
    const maxValueLength = Math.floor((width / 2 - 30) / (valueSize * 0.6));
    const valueText = detail.value.length > maxValueLength ? 
      detail.value.substring(0, maxValueLength - 3) + '...' : detail.value;
    
    page.drawText(valueText, {
      x: leftColumnX,
      y: currentY - (index * spacing) - labelSize - (2 * scaleFactor),
      size: valueSize,
      font: font,
      color: rgb(0, 0, 0),
    });
  });

  // Right Column - Certificate Number
  page.drawText("Certificate #:", {
    x: rightLabelX - (labelSize * 3),
    y: currentY,
    size: labelSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(certData.certificateNumber, {
    x: rightColumnX,
    y: currentY,
    size: labelSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Footer
  const footerY = y - height + 30;
  
  // Bottom Left
  page.drawText("N/A", {
    x: x + 15,
    y: footerY,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText("AFFORDABLE DRIVING INSTRUCTOR", {
    x: x + 15,
    y: footerY - valueSize - 5,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Bottom Right
  page.drawText("LICENSE #", {
    x: x + width - 80,
    y: footerY,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText("AFFORDABLE DRIVING", {
    x: x + width - 100,
    y: footerY - valueSize - 5,
    size: valueSize,
    font: font,
    color: rgb(0, 0, 0),
  });
}
