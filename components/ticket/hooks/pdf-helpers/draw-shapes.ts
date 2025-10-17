import { PDFPage, rgb } from "pdf-lib";
import { ShapeElement } from "@/components/certificate-editor/types";
import { hexToRgb } from "./utils";

export function drawShapes(
  shapes: ShapeElement[],
  page: PDFPage,
  height: number,
  certScaleX: number,
  certScaleY: number,
  offsetY: number,
  borderWidthScale: number = 1
) {
  shapes.forEach((shape: ShapeElement) => {
    const scaledShape = {
      x: shape.x * certScaleX,
      y: shape.y * certScaleY + offsetY,
      width: shape.width ? shape.width * certScaleX : undefined,
      height: shape.height ? shape.height * certScaleY : undefined,
      x2: shape.x2 ? shape.x2 * certScaleX : undefined,
      y2: shape.y2 ? shape.y2 * certScaleY + offsetY : undefined,
      radius: shape.radius ? shape.radius * certScaleY : undefined,
      borderWidth: shape.borderWidth ? shape.borderWidth * borderWidthScale : undefined,
    };

    let color = undefined;
    if (shape.color && shape.color !== 'transparent') {
      const rgbColor = hexToRgb(shape.color);
      color = rgb(rgbColor.r, rgbColor.g, rgbColor.b);
    }

    const borderColor = shape.borderColor ? hexToRgb(shape.borderColor) : hexToRgb('#000000');

    if (shape.type === 'rectangle') {
      page.drawRectangle({
        x: scaledShape.x,
        y: height - scaledShape.y - (scaledShape.height || 0),
        width: scaledShape.width || 0,
        height: scaledShape.height || 0,
        color: color,
        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
        borderWidth: scaledShape.borderWidth || 0,
      });
    } else if (shape.type === 'line') {
      const thickness = scaledShape.borderWidth || 1;
      const startX = scaledShape.x;
      const startY = height - scaledShape.y;
      const endX = scaledShape.x2 || scaledShape.x;
      const endY = height - (scaledShape.y2 || scaledShape.y);
      page.drawLine({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        thickness: thickness,
        color: rgb(borderColor.r, borderColor.g, borderColor.b),
      });
    } else if (shape.type === 'circle') {
      page.drawEllipse({
        x: scaledShape.x + (scaledShape.radius || 0),
        y: height - scaledShape.y - (scaledShape.radius || 0),
        xScale: scaledShape.radius || 0,
        yScale: scaledShape.radius || 0,
        color: color,
        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
        borderWidth: scaledShape.borderWidth || 0,
      });
    }
  });
}
