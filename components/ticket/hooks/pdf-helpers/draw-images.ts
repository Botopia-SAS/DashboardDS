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
      console.log('🖼️ Drawing image:', image.url);
      
      // Fetch image with proper headers for Cloudinary
      const response = await fetch(image.url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        console.error('❌ Failed to fetch image:', image.url, response.status);
        continue;
      }
      
      let imageBytes = await response.arrayBuffer();
      
      if (image.grayscale) {
        imageBytes = await applyGrayscaleFilter(imageBytes);
      }

      let pdfImage;
      if (image.url.toLowerCase().endsWith('.png') || image.url.includes('image/png')) {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      }

      // Get original image dimensions
      const imgOrigWidth = pdfImage.width;
      const imgOrigHeight = pdfImage.height;

      // Calculate the container size (where the image should fit)
      const containerWidth = image.width * certScaleX;
      const containerHeight = image.height * certScaleY;

      // Calculate scale factors to fit the image in the container (object-contain behavior)
      const scaleToFitWidth = containerWidth / imgOrigWidth;
      const scaleToFitHeight = containerHeight / imgOrigHeight;

      // Use the smaller scale to maintain aspect ratio
      const actualScale = Math.min(scaleToFitWidth, scaleToFitHeight);

      // Calculate final dimensions preserving aspect ratio
      const finalWidth = imgOrigWidth * actualScale;
      const finalHeight = imgOrigHeight * actualScale;

      // Calculate position (center the image in its container)
      const containerX = image.x * certScaleX;
      const containerY = image.y * certScaleY + offsetY;
      const drawX = containerX - (finalWidth / 2) + (containerWidth / 2);
      const drawY = containerY - (finalHeight / 2) + (containerHeight / 2);

      page.drawImage(pdfImage, {
        x: drawX,
        y: height - drawY - finalHeight,
        width: finalWidth,
        height: finalHeight,
      });
      
      console.log('✅ Image drawn successfully');
    } catch (error) {
      console.error('❌ Error loading image:', image.url, error);
    }
  }
}
