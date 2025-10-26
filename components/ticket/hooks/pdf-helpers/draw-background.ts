import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { CertificateTemplate } from "@/lib/certificateTypes";
import { hexToRgb } from "./utils";

export async function drawBackground(
  template: CertificateTemplate,
  page: PDFPage,
  width: number,
  height: number,
  pdfDoc: PDFDocument,
  offsetY: number
) {
  // Draw background based on template.background configuration
  if (template.background) {
    if (template.background.type === 'color' && template.background.value) {
      // Draw background color
      const bgColor = hexToRgb(template.background.value);
      page.drawRectangle({
        x: 0,
        y: offsetY,
        width: width,
        height: height,
        color: rgb(bgColor.r, bgColor.g, bgColor.b),
      });
    } else if (template.background.type === 'pdf' && template.background.value) {
      // Load existing PDF as background
      try {
        const pdfBytes = await fetch(template.background.value).then((res) =>
          res.arrayBuffer()
        );

        const existingPdf = await PDFDocument.load(pdfBytes);
        const [existingPage] = await pdfDoc.copyPages(existingPdf, [0]);

        // Draw the existing page as background
        const { width: bgWidth, height: bgHeight } = existingPage.getSize();

        // Calculate scale to fit the page
        const scaleX = width / bgWidth;
        const scaleY = height / bgHeight;
        const scale = Math.min(scaleX, scaleY);

        // Embed the page as a form object and draw it
        const embeddedPage = await pdfDoc.embedPage(existingPage);
        page.drawPage(embeddedPage, {
          x: 0,
          y: offsetY,
          width: width,
          height: height,
        });
      } catch (error) {
        console.error('Error loading PDF background:', error);
      }
    } else if (template.background.type === 'image' && template.background.value) {
      // Draw background image
      try {
        const imageBytes = await fetch(template.background.value).then((res) =>
          res.arrayBuffer()
        );

        let embeddedImage;
        if (template.background.value.toLowerCase().endsWith('.png')) {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (
          template.background.value.toLowerCase().endsWith('.jpg') ||
          template.background.value.toLowerCase().endsWith('.jpeg')
        ) {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
          console.warn(`Unsupported background image format: ${template.background.value}`);
          return;
        }

        // Draw background image to fill the certificate area
        page.drawImage(embeddedImage, {
          x: 0,
          y: offsetY,
          width: width,
          height: height,
        });
      } catch (error) {
        console.error('Error drawing background image:', error);
      }
    }
  }
}
