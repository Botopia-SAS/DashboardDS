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
  getFont: (family: string, weight?: string) => any,
  replaceVariables: (text: string) => string,
  textScaleFactor: number = 1
) {
  texts.forEach((text: TextElement) => {
    const content = replaceVariables(text.content);
    const font = getFont(text.fontFamily, text.fontWeight);
    const textColor = hexToRgb(text.color);

    const scaledFontSize = text.fontSize * textScaleFactor;
    
    // Split content by newlines to handle multi-line text
    const lines = content.split('\n');
    const lineHeight = scaledFontSize * 1.2; // Standard line height multiplier

    lines.forEach((line, lineIndex) => {
      // Skip empty lines but preserve spacing
      const lineContent = line || ' ';
      const textWidth = font.widthOfTextAtSize(lineContent, scaledFontSize);

      const scaledX = text.x * certScaleX;
      // Use certScaleY for Y position, then add offsetY and line offset
      const scaledY = text.y * certScaleY + offsetY + (lineIndex * lineHeight);

      let xPos = scaledX;
      if (text.align === 'center') {
        xPos = scaledX - textWidth / 2;
      } else if (text.align === 'right') {
        xPos = scaledX - textWidth;
      }

      const baselineOffset = scaledFontSize * 0.8;
      const pdfY = height - scaledY - baselineOffset;

      page.drawText(lineContent, {
        x: xPos,
        y: pdfY,
        size: scaledFontSize,
        font,
        color: rgb(textColor.r, textColor.g, textColor.b),
      });
    });
  });
}
