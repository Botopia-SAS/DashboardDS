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
  variables: Record<string, any> = {},
  checkboxElements: any[] = [],
  getFont?: (fontFamily: string, fontWeight?: string) => any
) {
  console.log('🔲 drawShapes called with variables:', variables);
  
  // Calcular textScaleFactor basado en certificados por página
  const rows = 1 / certScaleY;
  let textScaleFactor = 1.0;
  if (rows === 1) {
    textScaleFactor = 1.0;
  } else if (rows === 2) {
    textScaleFactor = 0.85;
  } else if (rows === 3) {
    textScaleFactor = 0.795;
  }
  
  // Crear shapes dinámicamente para checkboxes
  const dynamicCheckboxShapes: ShapeElement[] = [];
  
  checkboxElements.forEach((checkbox) => {
    const baseFontSize = checkbox.fontSize || 10;
    const scaledFontSize = baseFontSize * textScaleFactor;
    
    // Hacer que TODO sea proporcional al fontSize
    const fontSizeRatio = baseFontSize / 10;
    
    const baseCheckboxSize = (checkbox.checkboxSize || 12) * fontSizeRatio;
    const scaledCheckboxSize = baseCheckboxSize * textScaleFactor;
    const baseBorderWidth = (checkbox.borderWidth || 1.5) * fontSizeRatio;
    const scaledBorderWidth = baseBorderWidth * textScaleFactor;
    
    // Escalar las distancias proporcionalmente al fontSize
    const scaledGap = 5 * fontSizeRatio * textScaleFactor;
    const scaledSpacing = 60 * fontSizeRatio * textScaleFactor;
    const scaledVerticalGap = 8 * fontSizeRatio * textScaleFactor;
    const scaledTitleMargin = 8 * fontSizeRatio * textScaleFactor;
    
    let currentY = checkbox.y;
    
    // Si hay título, ajustar Y con margen escalado
    if (checkbox.title) {
      console.log(`📦 Checkbox "${checkbox.title}": Y inicial=${currentY}, fontSize=${scaledFontSize}, margin=${scaledTitleMargin}`);
      currentY += scaledFontSize + scaledTitleMargin;
      console.log(`📦 Después del título: Y=${currentY}`);
    }
    
    // Crear un shape para cada opción
    checkbox.options.forEach((option: string, index: number) => {
      let optionX = checkbox.x;
      let optionY = currentY;
      
      if (checkbox.orientation === 'horizontal') {
        // Horizontal: calcular X acumulada con distancias escaladas
        if (index > 0) {
          for (let i = 0; i < index; i++) {
            const prevText = checkbox.options[i];
            const approxWidth = prevText.length * scaledFontSize * 0.6;
            optionX += scaledCheckboxSize + scaledGap + approxWidth + scaledSpacing;
          }
        }
      } else {
        // Vertical: calcular Y acumulada con distancias escaladas
        optionY += index * (scaledCheckboxSize + scaledVerticalGap);
      }
      
      // Crear el shape dinámicamente
      const shapeId = `checkbox-${checkbox.variableKey}-${option}`;
      dynamicCheckboxShapes.push({
        id: shapeId,
        type: 'rectangle',
        x: optionX,
        y: optionY,
        width: scaledCheckboxSize,
        height: scaledCheckboxSize,
        color: 'transparent',
        borderColor: checkbox.borderColor || '#c94a3a',
        borderWidth: scaledBorderWidth,
      });
    });
  });
  
  // Combinar shapes originales con los dinámicos de checkboxes
  const allShapes = [...shapes, ...dynamicCheckboxShapes];
  
  allShapes.forEach((shape: ShapeElement) => {
    // Para checkboxes, NO escalar porque ya vienen escalados
    const isCheckbox = shape.id && shape.id.startsWith('checkbox-');
    
    const scaledShape = {
      x: shape.x * certScaleX,
      y: shape.y * certScaleY + offsetY,
      width: shape.width ? (isCheckbox ? shape.width : shape.width * certScaleX) : undefined,
      height: shape.height ? (isCheckbox ? shape.height : shape.height * certScaleY) : undefined,
      x2: shape.x2 ? shape.x2 * certScaleX : undefined,
      y2: shape.y2 ? shape.y2 * certScaleY + offsetY : undefined,
      radius: shape.radius ? shape.radius * certScaleY : undefined,
      borderWidth: isCheckbox ? shape.borderWidth : (shape.borderWidth ? shape.borderWidth * borderWidthScale : undefined),
    };

    let color = undefined;
    if (shape.color && shape.color !== 'transparent') {
      const rgbColor = hexToRgb(shape.color);
      color = rgb(rgbColor.r, rgbColor.g, rgbColor.b);
    }

    const borderColor = shape.borderColor ? hexToRgb(shape.borderColor) : hexToRgb('#000000');

    // Verificar si el checkbox debe estar marcado
    let shouldMarkCheckbox = false;
    if (shape.id && shape.id.startsWith('checkbox-')) {
      const parts = shape.id.replace('checkbox-', '').split('-');
      if (parts.length >= 2) {
        const varKey = parts[0];
        const optionFromId = parts.slice(1).join('-');
        const varValue = String(variables[varKey] || '');
        if (varValue.toLowerCase() === optionFromId.toLowerCase()) {
          shouldMarkCheckbox = true;
          console.log(`✅ Marking ${optionFromId} for ${varKey}`);
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

      // Dibujar checkmark si está marcado
      if (shouldMarkCheckbox) {
        const checkboxSize = scaledShape.width || 12;
        const centerX = scaledShape.x + checkboxSize / 2;
        const centerY = height - scaledShape.y - checkboxSize / 2;
        const checkSize = checkboxSize * 0.4;
        
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
