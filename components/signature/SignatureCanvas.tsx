'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SignatureCanvasProps {
  onSignatureChange: (signatureData: string | null) => void;
  initialSignature?: string;
  disabled?: boolean;
  width?: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureChange,
  initialSignature,
  disabled = false,
  width = 400,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Initialize canvas context and setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas properties for smooth drawing
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // NO llenar con fondo blanco - dejar transparente para PNG
    // ctx.fillStyle = '#ffffff';
    // ctx.fillRect(0, 0, width, height);
    
    setContext(ctx);

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        // NO llenar con fondo blanco - mantener transparente
        // ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature, width, height]);

  // Get coordinates relative to canvas
  const getCoordinates = useCallback((event: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      // Mouse event
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    }
  }, []);

  // Draw smooth line between two points
  const drawLine = useCallback((from: Point, to: Point) => {
    if (!context) return;

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }, [context]);

  // Start drawing
  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    const point = getCoordinates(event);
    setIsDrawing(true);
    setLastPoint(point);
    setHasSignature(true);

    // Draw a dot for single clicks/taps
    if (context) {
      context.beginPath();
      context.arc(point.x, point.y, 1, 0, 2 * Math.PI);
      context.fill();
    }
  }, [disabled, getCoordinates, context]);

  // Continue drawing
  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled || !lastPoint) return;
    
    event.preventDefault();
    const currentPoint = getCoordinates(event);
    drawLine(lastPoint, currentPoint);
    setLastPoint(currentPoint);
  }, [isDrawing, disabled, lastPoint, getCoordinates, drawLine]);

  // Función para recortar el canvas (auto-crop)
  const trimCanvas = useCallback((canvas: HTMLCanvasElement): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Encontrar los límites de la firma (bounding box)
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Buscar píxeles no transparentes
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = pixels[index + 3]; // Canal alpha

        if (alpha > 0) { // Si no es transparente
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Si no se encontró nada, devolver canvas original
    if (minX > maxX || minY > maxY) {
      return canvas.toDataURL('image/png');
    }

    // Agregar un pequeño padding (margen)
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width - 1, maxX + padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);

    // Calcular dimensiones del recorte
    const trimWidth = maxX - minX + 1;
    const trimHeight = maxY - minY + 1;

    // Crear un nuevo canvas con las dimensiones recortadas
    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = trimWidth;
    trimmedCanvas.height = trimHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');

    if (!trimmedCtx) return canvas.toDataURL('image/png');

    // Copiar solo la parte con la firma
    trimmedCtx.drawImage(
      canvas,
      minX, minY, trimWidth, trimHeight, // source
      0, 0, trimWidth, trimHeight         // destination
    );

    return trimmedCanvas.toDataURL('image/png');
  }, []);

  // Stop drawing
  const stopDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;

    event.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);

    // Notify parent component of signature change
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      // Recortar el canvas antes de exportar
      const trimmedDataURL = trimCanvas(canvas);
      onSignatureChange(trimmedDataURL);
    }
  }, [isDrawing, hasSignature, onSignatureChange, trimCanvas]);

  // Clear signature
  const clearSignature = useCallback(() => {
    if (!context || disabled) return;

    context.clearRect(0, 0, width, height);
    // NO llenar con fondo blanco - mantener transparente
    // context.fillRect(0, 0, width, height);
    setHasSignature(false);
    onSignatureChange(null);
  }, [context, disabled, width, height, onSignatureChange]);

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    startDrawing(event.nativeEvent);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    draw(event.nativeEvent);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    stopDrawing(event.nativeEvent);
  };

  // Touch event handlers
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    startDrawing(event.nativeEvent);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    draw(event.nativeEvent);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    stopDrawing(event.nativeEvent);
  };

  return (
    <div className="signature-canvas-container">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`
            border-2 border-gray-400 rounded-md
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}
            touch-none
          `}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'none',
            background: 'repeating-linear-gradient(45deg, #f9f9f9, #f9f9f9 10px, #ffffff 10px, #ffffff 20px)',
          }}
        />
        
        {/* Status message */}
        <div className="mt-2 text-sm text-gray-600">
          {!hasSignature && !disabled && "Draw your signature above"}
          {hasSignature && !disabled && "Signature ready"}
          {disabled && "Signature canvas disabled"}
        </div>

        {/* Clear button */}
        {hasSignature && !disabled && (
          <button
            type="button"
            onClick={clearSignature}
            className="mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
          >
            Clear Signature
          </button>
        )}
      </div>
    </div>
  );
};

export default SignatureCanvas;
