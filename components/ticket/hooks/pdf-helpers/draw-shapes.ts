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
  borderWidthScale: number = 1,
  variables: Record<string, any> = {}
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

    // Check if this checkbox should be marked based on variables
    let shouldMarkCheckbox = false;
    if (shape.id) {
      // Course Time checkboxes
      if (shape.id === 'checkbox-4hr' && variables.courseTime === '4hr') {
        shouldMarkCheckbox = true;
      } else if (shape.id === 'checkbox-6hr' && variables.courseTime === '6hr') {
        shouldMarkCheckbox = true;
      } else if (shape.id === 'checkbox-8hr' && variables.courseTime === '8hr') {
        shouldMarkCheckbox = true;
      }
      // Attendance Reason checkboxes
      else if (shape.id === 'checkbox-court-order' && variables.attendanceReason === 'court_order') {
        shouldMarkCheckbox = true;
      } else if (shape.id === 'checkbox-volunteer' && variables.attendanceReason === 'volunteer') {
        shouldMarkCheckbox = true;
      } else if (shape.id === 'checkbox-ticket' && variables.attendanceReason === 'ticket') {
        shouldMarkCheckbox = true;
      }
    }

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

      // Draw checkmark if checkbox should be marked
      if (shouldMarkCheckbox) {
        const checkboxSize = scaledShape.width || 12;
        const centerX = scaledShape.x + checkboxSize / 2;
        const centerY = height - scaledShape.y - checkboxSize / 2;
        const checkSize = checkboxSize * 0.4;
        
        // Draw checkmark using two lines
        page.drawLine({
          start: { x: centerX - checkSize / 2, y: centerY },
          end: { x: centerX - checkSize / 6, y: centerY - checkSize / 2 },
          thickness: 1.5,
          color: rgb(borderColor.r, borderColor.g, borderColor.b),
        });
        page.drawLine({
          start: { x: centerX - checkSize / 6, y: centerY - checkSize / 2 },
          end: { x: centerX + checkSize / 2, y: centerY + checkSize / 2 },
          thickness: 1.5,
          color: rgb(borderColor.r, borderColor.g, borderColor.b),
        });
      }
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
