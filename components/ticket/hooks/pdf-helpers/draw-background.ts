import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { CertificateTemplate } from "@/lib/certificateTypes";
import { hexToRgb } from "./utils";

export async function drawBackground(
  template: CertificateTemplate,
  page: PDFPage,
  width: number,
  height: number,
  pdfDoc: PDFDocument,
  offsetY: number = 0
) {
  console.log(`🎨 Drawing background: ${template.background.type}`);

  if (template.background.type === 'color' && template.background.value) {
    const bgColor = hexToRgb(template.background.value);
    page.drawRectangle({
      x: 0,
      y: offsetY,
      width,
      height,
      color: rgb(bgColor.r, bgColor.g, bgColor.b),
    });
  } else if (template.background.type === 'pdf' && template.background.value) {
    try {
      const existingPdfBytes = await fetch(template.background.value).then(res => res.arrayBuffer());
      const existingPdf = await PDFDocument.load(existingPdfBytes);
      const [existingPage] = await pdfDoc.copyPages(existingPdf, [0]);
      pdfDoc.removePage(0);
      pdfDoc.insertPage(0, existingPage);
    } catch (error) {
      console.error('Error loading background PDF:', error);
    }
  } else if (template.background.type === 'image' && template.background.value) {
    try {
      const imageBytes = await fetch(template.background.value).then(res => res.arrayBuffer());
      let bgImage;
      if (template.background.value.toLowerCase().endsWith('.png')) {
        bgImage = await pdfDoc.embedPng(imageBytes);
      } else {
        bgImage = await pdfDoc.embedJpg(imageBytes);
      }

      // Draw image to fill the entire area (like object-fill in CSS)
      // This stretches the image to cover the full width and height
      page.drawImage(bgImage, {
        x: 0,
        y: offsetY,
        width: width,
        height: height
      });
    } catch (error) {
      console.error('Error loading background image:', error);
    }
  }
}
