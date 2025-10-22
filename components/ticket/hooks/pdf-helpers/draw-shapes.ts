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
  console.log('🔲 drawShapes called with variables:', variables);
  console.log('🔲 courseTime:', variables.courseTime, 'attendanceReason:', variables.attendanceReason);
  
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
      console.log('🔍 Processing shape:', shape.id, 'type:', shape.type);
      
      // Dynamic checkbox matching - works for any checkbox variable
      if (shape.id.startsWith('checkbox-')) {
        // Extract variable key and option from shape ID (e.g., checkbox-courseTime-4hr -> courseTime, 4hr)
        const parts = shape.id.replace('checkbox-', '').split('-');
        if (parts.length >= 2) {
          const varKey = parts[0];
          const optionFromId = parts.slice(1).join('-'); // Handle options with hyphens
          
          // Check if this specific variable matches this option (case-insensitive)
          const varValue = String(variables[varKey] || '');
          if (varValue.toLowerCase() === optionFromId.toLowerCase()) {
            shouldMarkCheckbox = true;
            console.log(`✅ Marking ${optionFromId} checkbox for ${varKey} (value: ${varValue})`);
          }
        }
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
