import { PDFPage, rgb } from "pdf-lib";
import { ShapeElement } from "@/lib/certificateTypes";
import { hexToRgb } from "./utils";

export function drawShapes(
  shapes: ShapeElement[],
  page: PDFPage,
  height: number,
  certScaleX: number,
  certScaleY: number,
  offsetY: number,
  borderWidthScale: number,
  variables: Record<string, string>,
  checkboxElements: any[],
  getFont: any
) {
  shapes.forEach((shape) => {
    // Only handle rectangles with width and height
    if (shape.type !== 'rectangle' || !shape.width || !shape.height) {
      console.warn('Skipping non-rectangle or incomplete shape:', shape);
      return;
    }

    const scaledX = shape.x * certScaleX;
    const scaledY = shape.y * certScaleY + offsetY;
    const scaledWidth = shape.width * certScaleX;
    const scaledHeight = shape.height * certScaleY;

    // Convert Y coordinate from top-down to PDF bottom-up
    const pdfY = height - scaledY - scaledHeight;

    // Parse color
    const fillColor = hexToRgb(shape.color || '#ffffff');
    const borderColor = hexToRgb(shape.borderColor || '#000000');

    // Draw rectangle
    if (shape.borderWidth && shape.borderWidth > 0) {
      page.drawRectangle({
        x: scaledX,
        y: pdfY,
        width: scaledWidth,
        height: scaledHeight,
        color: rgb(fillColor.r, fillColor.g, fillColor.b),
        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
        borderWidth: shape.borderWidth * borderWidthScale,
      });
    } else {
      page.drawRectangle({
        x: scaledX,
        y: pdfY,
        width: scaledWidth,
        height: scaledHeight,
        color: rgb(fillColor.r, fillColor.g, fillColor.b),
      });
    }
  });

  // Draw checkbox shapes dynamically based on checkboxElements
  checkboxElements.forEach((checkbox) => {
    const baseFontSize = checkbox.fontSize || 10;
    const fontSizeRatio = baseFontSize / 10;
    const baseCheckboxSize = (checkbox.checkboxSize || 12) * fontSizeRatio;
    const scaledCheckboxSize = baseCheckboxSize * certScaleY;

    const textScaleFactor = certScaleY === 1 ? 1 : certScaleY === 0.5 ? 0.85 : 0.795;
    const scaledGap = 5 * fontSizeRatio * textScaleFactor;
    const scaledSpacing = 60 * fontSizeRatio * textScaleFactor;
    const scaledVerticalGap = 8 * fontSizeRatio * textScaleFactor;

    const rows = Math.round(1 / certScaleY);
    const baseTitleMargin = rows === 1 ? 20 : rows === 2 ? 28 : 32;
    const scaledTitleMargin = baseTitleMargin * fontSizeRatio * textScaleFactor;

    let currentY = checkbox.y;

    // Skip title height if present
    if (checkbox.title) {
      currentY += (scaledCheckboxSize / textScaleFactor) + (scaledTitleMargin / textScaleFactor);
    }

    // Draw checkbox squares for each option
    checkbox.options.forEach((option: string, index: number) => {
      let optionX = checkbox.x;
      let optionY = currentY;

      if (checkbox.orientation === 'horizontal') {
        // Horizontal layout
        if (index > 0) {
          for (let i = 0; i < index; i++) {
            const prevText = checkbox.options[i];
            const approxWidth = prevText.length * scaledCheckboxSize * 0.6;
            optionX += scaledCheckboxSize + scaledGap + approxWidth + scaledSpacing;
          }
        }
      } else {
        // Vertical layout
        optionY += index * (scaledCheckboxSize + scaledVerticalGap);
      }

      // Draw the checkbox square
      const scaledX = optionX * certScaleX;
      const scaledY = optionY * certScaleY + offsetY;
      const pdfY = height - scaledY - scaledCheckboxSize;

      page.drawRectangle({
        x: scaledX,
        y: pdfY,
        width: scaledCheckboxSize,
        height: scaledCheckboxSize,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
    });
  });
}
