import { PDFDocument, PDFPage } from "pdf-lib";
import { ImageElement } from "@/components/certificate-editor/types";
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
      let imageBytes = await fetch(image.url).then(res => res.arrayBuffer());
      if (image.grayscale) {
        imageBytes = await applyGrayscaleFilter(imageBytes);
      }

      let pdfImage;
      if (image.url.toLowerCase().endsWith('.png')) {
        pdfImage = await pdfDoc.embedPng(imageBytes);
      } else {
        pdfImage = await pdfDoc.embedJpg(imageBytes);
      }

      const scaledImage = {
        x: image.x * certScaleX,
        y: image.y * certScaleY + offsetY,
        width: image.width * certScaleX,
        height: image.height * certScaleY,
      };

      page.drawImage(pdfImage, {
        x: scaledImage.x,
        y: height - scaledImage.y - scaledImage.height,
        width: scaledImage.width,
        height: scaledImage.height,
      });
    } catch (error) {
      console.error('Error loading image:', image.url, error);
    }
  }
}
