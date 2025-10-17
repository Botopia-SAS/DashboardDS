import { PDFPage, rgb } from "pdf-lib";
import { TextElement } from "@/components/certificate-editor/types";
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
    const textWidth = font.widthOfTextAtSize(content, scaledFontSize);

    const scaledX = text.x * certScaleX;
    // Use certScaleY for Y position, then add offsetY
    const scaledY = text.y * certScaleY + offsetY;

    let xPos = scaledX;
    if (text.align === 'center') {
      xPos = scaledX - textWidth / 2;
    } else if (text.align === 'right') {
      xPos = scaledX - textWidth;
    }

    const baselineOffset = scaledFontSize * 0.8;
    const pdfY = height - scaledY - baselineOffset;

    page.drawText(content, {
      x: xPos,
      y: pdfY,
      size: scaledFontSize,
      font,
      color: rgb(textColor.r, textColor.g, textColor.b),
    });
  });
}
