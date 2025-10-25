import { PDFDocument, PDFPage } from "pdf-lib";
import { ImageElement } from "@/lib/certificateTypes";
import { applyGrayscaleFilter } from "./image-filters";

export async function drawImages(
  images: ImageElement[],
  page: PDFPage,
  height: number,
  certScaleX: number,
  certScaleY: number,
  offsetY: number,
  pdfDoc: PDFDocument
) {
  for (const image of images) {
    try {
      // Fetch image
      const imageBytes = await fetch(image.url).then((res) => res.arrayBuffer());

      let embeddedImage;
      if (image.url.toLowerCase().endsWith('.png')) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (image.url.toLowerCase().endsWith('.jpg') || image.url.toLowerCase().endsWith('.jpeg')) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        console.warn(`Unsupported image format: ${image.url}`);
        continue;
      }

      // Apply grayscale filter if specified
      if (image.grayscale) {
        // Note: pdf-lib doesn't support grayscale filters directly
        // This would need to be applied to the image before embedding
        console.log('Grayscale filter requested but not implemented for:', image.url);
      }

      // Calculate scaled dimensions
      const scaledX = image.x * certScaleX;
      const scaledY = image.y * certScaleY + offsetY;
      const scaledWidth = image.width * certScaleX;
      const scaledHeight = image.height * certScaleY;

      // Convert Y coordinate from top-down to PDF bottom-up
      const pdfY = height - scaledY - scaledHeight;

      // Draw image
      page.drawImage(embeddedImage, {
        x: scaledX,
        y: pdfY,
        width: scaledWidth,
        height: scaledHeight,
      });
    } catch (error) {
      console.error(`Error drawing image ${image.url}:`, error);
    }
  }
}
