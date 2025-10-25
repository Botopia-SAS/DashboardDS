import { PDFPage, rgb } from "pdf-lib";
import { TextElement } from "@/lib/certificateTypes";
import { hexToRgb } from "./utils";

export function drawTexts(
  texts: TextElement[],
  page: PDFPage,
  height: number,
  certScaleX: number,
  certScaleY: number,
  offsetY: number,
  getFont: any,
  replaceVariables: (text: string) => string,
  textScaleFactor: number
) {
  texts.forEach((textElement) => {
    // Replace variables in text content
    const content = replaceVariables(textElement.content);

    // Get font
    const font = getFont(textElement.fontFamily, textElement.fontWeight);

    // Calculate scaled font size
    const scaledFontSize = textElement.fontSize * textScaleFactor;

    // Parse color
    const textColor = hexToRgb(textElement.color || '#000000');

    // Calculate position based on alignment
    const scaledX = textElement.x * certScaleX;
    const scaledY = textElement.y * certScaleY + offsetY;

    // Get text width for alignment calculations
    const textWidth = font.widthOfTextAtSize(content, scaledFontSize);

    let finalX = scaledX;
    if (textElement.align === 'center') {
      finalX = scaledX - (textWidth / 2);
    } else if (textElement.align === 'right') {
      finalX = scaledX - textWidth;
    }

    // Convert Y coordinate from top-down to PDF bottom-up
    const pdfY = height - scaledY - scaledFontSize;

    // Draw text
    page.drawText(content, {
      x: finalX,
      y: pdfY,
      size: scaledFontSize,
      font,
      color: rgb(textColor.r, textColor.g, textColor.b),
    });
  });
}
