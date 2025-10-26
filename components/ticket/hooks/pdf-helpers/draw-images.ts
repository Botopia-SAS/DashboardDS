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
  pdfDoc: PDFDocument,
  user?: any
) {
  for (const image of images) {
    try {
      // Use instructor signature from user data if this is a signature image
      let imageUrl = image.url;
      if (image.id?.includes('signature') && user?.instructorSignature) {
        imageUrl = user.instructorSignature;
      }
      
      // Fetch image
      const imageBytes = await fetch(imageUrl).then((res) => res.arrayBuffer());

      let embeddedImage;
      // Try to detect format from URL or try both formats
      const urlLower = imageUrl.toLowerCase();
      if (urlLower.endsWith('.png') || urlLower.includes('image/upload')) {
        try {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          // If PNG fails, try JPG (Cloudinary URLs might not have extension)
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
      } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        // Try PNG first, then JPG for unknown formats
        try {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
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
