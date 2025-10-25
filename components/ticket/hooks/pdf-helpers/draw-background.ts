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
