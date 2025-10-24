/**
 * Test script for Youthful Offender Certificate Generation
 * 
 * This script generates a test PDF with sample student data to verify:
 * - All text fields are visible and correctly positioned
 * - Checkboxes are marked in correct positions
 * - Signature appears correctly
 * 
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { getYouthfulOffenderTemplate } from '../lib/defaultTemplates/youthfulOffenderTemplate';

// Test student data
const testStudent = {
  first_name: "TECHNOLOGY",
  middle_initial: "S",
  last_name: "BOTOPIA",
  license_number: "A1234567",
  citation_number: "TC-2024-001",
  court: "County Court",
  county: "Palm Beach County, FL",
  course_date: "10/18/2025",
  certn: "12345",
  course_time: "4 hr",
  attendance_reason: "Ticket/Citation"
};

// Helper functions (simplified versions from the generator)
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

function getVariables(user: typeof testStudent) {
  return {
    firstName: user.first_name || '',
    middleInitial: user.middle_initial || '',
    lastName: user.last_name || '',
    licenseNumber: user.license_number || '',
    citationNumber: user.citation_number || '',
    court: user.court || '',
    county: user.county || '',
    courseDate: user.course_date || '',
    certn: user.certn || '',
    courseTime4hr: user.course_time === '4 hr' ? 'true' : 'false',
    courseTime6hr: user.course_time === '6 hr' ? 'true' : 'false',
    courseTime8hr: user.course_time === '8 hr' ? 'true' : 'false',
    attendanceCourtOrder: user.attendance_reason === 'Court Order' ? 'true' : 'false',
    attendanceVolunteer: user.attendance_reason === 'Volunteer' ? 'true' : 'false',
    attendanceTicket: user.attendance_reason === 'Ticket/Citation' ? 'true' : 'false',
  };
}

async function generateTestCertificate() {
  console.log('🎨 Starting test certificate generation');
  console.log('👤 Test Student:', `${testStudent.first_name} ${testStudent.last_name}`);

  try {
    const template = getYouthfulOffenderTemplate();
    const pdfDoc = await PDFDocument.create();

    // Get certificates per page setting
    const certsPerPage = template.certificatesPerPage || 1;
    const rows = certsPerPage;
    const certScaleY = 1 / rows;

    // Create page
    const page = pdfDoc.addPage([template.pageSize.width, template.pageSize.height]);
    const { width, height } = page.getSize();
    console.log(`📄 Page: ${width}x${height}, Certificates: ${certsPerPage}`);

    // Embed fonts
    const fonts = {
      helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
      helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };

    const getFont = (fontFamily: string) => {
      return fontFamily === 'Helvetica-Bold' ? fonts.helveticaBold : fonts.helvetica;
    };

    // Get variables for text replacement
    const variables = getVariables(testStudent);

    // Helper to replace variables
    const replaceVariables = (text: string): string => {
      let result = text;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value);
      });
      return result;
    };

    // Load background PDF
    const backgroundPath = path.join(process.cwd(), 'public', 'templates_certificates', 'youthful-offender-class.pdf');
    if (fs.existsSync(backgroundPath)) {
      console.log('📄 Loading background PDF template');
      const backgroundBytes = fs.readFileSync(backgroundPath);
      const backgroundPdf = await PDFDocument.load(backgroundBytes);
      const [backgroundPage] = await pdfDoc.copyPages(backgroundPdf, [0]);
      
      // Copy background to our page
      const bgForm = await pdfDoc.embedPage(backgroundPage);
      page.drawPage(bgForm, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      console.log('✅ Background PDF loaded');
    } else {
      console.warn('⚠️  Background PDF not found, generating without template');
    }

    // Text scaling factor for 3-per-page
    const textScaleFactor = rows === 3 ? 0.795 : 1;

    // Draw all 3 certificates
    for (let certIndex = 0; certIndex < certsPerPage; certIndex++) {
      const row = certIndex;
      const offsetY = row * (height / rows);
      console.log(`🎫 Drawing certificate ${certIndex + 1}/${certsPerPage} at offsetY=${offsetY}`);

      // Draw text elements
      template.textElements.forEach((textEl) => {
        const content = replaceVariables(textEl.content);
        if (!content) return;

        const font = getFont(textEl.fontFamily);
        const color = hexToRgb(textEl.color);
        const fontSize = textEl.fontSize * textScaleFactor;

        // Calculate PDF Y position
        const scaledY = textEl.y * certScaleY + offsetY;
        const baselineOffset = fontSize * 0.3;
        const pdfY = height - scaledY - baselineOffset;

        // Calculate X position based on alignment
        let pdfX = textEl.x;
        if (textEl.align === 'center') {
          const textWidth = font.widthOfTextAtSize(content, fontSize);
          pdfX = textEl.x - textWidth / 2;
        } else if (textEl.align === 'right') {
          const textWidth = font.widthOfTextAtSize(content, fontSize);
          pdfX = textEl.x - textWidth;
        }

        console.log(`  📝 ${textEl.id}: "${content}" at (${pdfX.toFixed(1)}, ${pdfY.toFixed(1)})`);

        page.drawText(content, {
          x: pdfX,
          y: pdfY,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
        });
      });

      // Draw shape elements (checkboxes)
      template.shapeElements.forEach((shape) => {
        // Check if this shape should be drawn based on variables
        const shouldDraw = shape.id?.split('-').some(part => {
          const varValue = variables[part as keyof typeof variables];
          return varValue === 'true';
        });

        if (!shouldDraw) return;

        const color = hexToRgb(shape.borderColor || '#000000');
        const scaledY1 = shape.y * certScaleY + offsetY;
        const scaledY2 = shape.y2 * certScaleY + offsetY;
        const pdfY1 = height - scaledY1;
        const pdfY2 = height - scaledY2;

        console.log(`  ✓ ${shape.id}: line from (${shape.x}, ${pdfY1.toFixed(1)}) to (${shape.x2}, ${pdfY2.toFixed(1)})`);

        page.drawLine({
          start: { x: shape.x, y: pdfY1 },
          end: { x: shape.x2, y: pdfY2 },
          thickness: shape.borderWidth || 2,
          color: rgb(color.r, color.g, color.b),
        });
      });

      // Draw image elements (signature)
      const signaturePath = path.join(process.cwd(), 'public', 'firma_instructor.png');
      if (fs.existsSync(signaturePath)) {
        console.log('  🖊️  Loading signature image');
        const signatureBytes = fs.readFileSync(signaturePath);
        const signatureImage = await pdfDoc.embedPng(signatureBytes);

        template.imageElements.forEach((imgEl) => {
          const scaledY = imgEl.y * certScaleY + offsetY;
          const pdfY = height - scaledY - imgEl.height;

          console.log(`  🖊️  ${imgEl.id}: signature at (${imgEl.x}, ${pdfY.toFixed(1)})`);

          page.drawImage(signatureImage, {
            x: imgEl.x,
            y: pdfY,
            width: imgEl.width,
            height: imgEl.height,
          });
        });
      } else {
        console.warn('  ⚠️  Signature image not found');
      }
    }

    // Save PDF
    console.log('💾 Serializing PDF...');
    const pdfBytes = await pdfDoc.save();
    
    const outputPath = path.join(process.cwd(), 'test-youthful-offender-certificate.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ Test PDF generated successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Size: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
    
    return outputPath;

  } catch (error) {
    console.error('❌ Error generating test certificate:', error);
    throw error;
  }
}

// Run the test
generateTestCertificate()
  .then((outputPath) => {
    console.log('\n✅ Test completed successfully!');
    console.log(`\nPlease open the generated PDF to verify:`);
    console.log(`  1. All text fields are visible and correctly positioned`);
    console.log(`  2. Checkboxes are marked in correct positions (4hr and Ticket/Citation)`);
    console.log(`  3. Signature appears correctly`);
    console.log(`\nFile: ${outputPath}`);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
