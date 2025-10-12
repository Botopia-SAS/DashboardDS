"use client";

import { useRef, useState } from "react";
import { CertificateTemplate, DEFAULT_VARIABLES } from "./types";

interface CertificateCanvasProps {
  template: CertificateTemplate;
  selectedElement: { type: 'text' | 'image' | 'shape' | null; id: string | null };
  onSelectElement: (element: { type: 'text' | 'image' | 'shape' | null; id: string | null }) => void;
  onUpdateElement: (type: 'text' | 'image' | 'shape', id: string, updates: Record<string, any>) => void;
  previewMode?: boolean;
  showVariables?: boolean;
}

export function CertificateCanvas({
  template,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  previewMode = false,
  showVariables = false,
}: CertificateCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ type: 'text' | 'image' | 'shape'; id: string } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [potentialDrag, setPotentialDrag] = useState<{ type: 'text' | 'image' | 'shape'; id: string; x: number; y: number; startX: number; startY: number } | null>(null);

  // Scale factor for display - Optimized for better certificate visibility
  const getOptimalScale = () => {
    // const isLandscape = template.pageSize.orientation === 'landscape';
    
    // Get available space more precisely
    const sidebarWidth = 320; // w-80 = 320px (left sidebar)
    const propertiesWidth = selectedElement.id && !previewMode ? 288 : 0; // w-72 = 288px (right sidebar)
    const padding = 40; // More padding for better visual spacing
    const headerHeight = 120; // Account for header and margins
    
    const availableWidth = window.innerWidth - sidebarWidth - propertiesWidth - padding;
    const availableHeight = window.innerHeight - headerHeight;
    
    // Calculate scale to fit the available space with better proportions
    const widthScale = availableWidth / template.pageSize.width;
    const heightScale = availableHeight / template.pageSize.height;
    
    // Use the smaller scale to ensure it fits perfectly with some margin
    const optimalScale = Math.min(widthScale, heightScale, 0.9); // Max 90% scale for better fit
    
    // Ensure minimum scale for readability and maximum for usability
    const minScale = 0.4; // Minimum readable scale
    const maxScale = 0.9; // Maximum scale to prevent overflow
    
    return Math.min(Math.max(optimalScale, minScale), maxScale);
  };

  const scale = getOptimalScale();

  // Handle mouse down on element
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'text' | 'image' | 'shape',
    id: string,
    currentX: number,
    currentY: number
  ) => {
    if (previewMode) return;

    e.stopPropagation();

    // Toggle selection: if clicking on the same element, deselect it
    const isCurrentlySelected = selectedElement.type === type && selectedElement.id === id;

    if (isCurrentlySelected) {
      // Deselect if clicking on already selected element
      onSelectElement({ type: null, id: null });
      return; // Don't prepare for drag if deselecting
    } else {
      // Select the new element
      onSelectElement({ type, id });
    }

    // Prepare for potential drag (but don't start dragging yet)
    setPotentialDrag({
      type,
      id,
      x: currentX,
      y: currentY,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (previewMode) return;

    // If we have a potential drag but haven't started dragging yet
    if (potentialDrag && !dragging) {
      const deltaX = Math.abs(e.clientX - potentialDrag.startX);
      const deltaY = Math.abs(e.clientY - potentialDrag.startY);
      const threshold = 5; // Start dragging only if moved more than 5 pixels

      if (deltaX > threshold || deltaY > threshold) {
        // Start actual dragging
        setDragging({ type: potentialDrag.type, id: potentialDrag.id });
        setDragStart({
          x: e.clientX - potentialDrag.x * scale,
          y: e.clientY - potentialDrag.y * scale
        });
      }
      return;
    }

    // Continue dragging if already started
    if (dragging && dragStart) {
      const newX = (e.clientX - dragStart.x) / scale;
      const newY = (e.clientY - dragStart.y) / scale;

      onUpdateElement(dragging.type, dragging.id, { x: newX, y: newY });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setDragging(null);
    setDragStart(null);
    setPotentialDrag(null);
  };

  // Replace variables in text with example values or show variables
  const replaceVariables = (text: string): string => {
    if (showVariables) {
      // Show actual variable names
      return text;
    } else {
      // Show example values
      let result = text;
      DEFAULT_VARIABLES.forEach(variable => {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
        result = result.replace(regex, variable.example);
      });
      return result;
    }
  };

  return (
    <div className="flex justify-center items-center h-full w-full p-2 bg-gray-50 overflow-hidden">
      <div
        ref={canvasRef}
        className="relative bg-white shadow-2xl border-4 border-gray-200"
        style={{
          width: `${template.pageSize.width * scale}px`,
          height: `${template.pageSize.height * scale}px`,
          backgroundColor: template.background.type === 'color' ? template.background.value : '#FFFFFF',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => !previewMode && onSelectElement({ type: null, id: null })}
      >
        {/* Background Image */}
        {template.background.type === 'image' && template.background.value && (
          <img
            src={template.background.value}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* Render Shape Elements */}
        {template.shapeElements.map((shape) => (
          <div
            key={shape.id}
            className={`absolute cursor-move ${
              selectedElement.id === shape.id && !previewMode ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${shape.x * scale}px`,
              top: `${shape.y * scale}px`,
              pointerEvents: previewMode ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'shape', shape.id, shape.x, shape.y)}
          >
            {shape.type === 'rectangle' && (
              <div
                style={{
                  width: `${(shape.width || 0) * scale}px`,
                  height: `${(shape.height || 0) * scale}px`,
                  backgroundColor: shape.color || 'transparent',
                  border: `${(shape.borderWidth || 0) * scale}px ${shape.borderStyle || 'solid'} ${shape.borderColor || '#000'}`,
                }}
              />
            )}

            {shape.type === 'line' && (
              <svg
                width={`${Math.abs((shape.x2 || 0) - shape.x) * scale}px`}
                height={`${Math.abs((shape.y2 || 0) - shape.y) * scale}px`}
                style={{ overflow: 'visible' }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={`${((shape.x2 || 0) - shape.x) * scale}`}
                  y2={`${((shape.y2 || 0) - shape.y) * scale}`}
                  stroke={shape.borderColor || '#000'}
                  strokeWidth={(shape.borderWidth || 1) * scale}
                  strokeDasharray={
                    shape.borderStyle === 'dashed' ? `${4 * scale},${4 * scale}` :
                    shape.borderStyle === 'dotted' ? `${2 * scale},${2 * scale}` :
                    undefined
                  }
                />
              </svg>
            )}

            {shape.type === 'circle' && (
              <div
                style={{
                  width: `${(shape.radius || 0) * 2 * scale}px`,
                  height: `${(shape.radius || 0) * 2 * scale}px`,
                  borderRadius: '50%',
                  backgroundColor: shape.color || 'transparent',
                  border: `${(shape.borderWidth || 0) * scale}px ${shape.borderStyle || 'solid'} ${shape.borderColor || '#000'}`,
                }}
              />
            )}
          </div>
        ))}

        {/* Render Image Elements */}
        {template.imageElements.map((image) => (
          <div
            key={image.id}
            className={`absolute cursor-move ${
              selectedElement.id === image.id && !previewMode ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${image.x * scale}px`,
              top: `${image.y * scale}px`,
              width: `${image.width * scale}px`,
              height: `${image.height * scale}px`,
              pointerEvents: previewMode ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'image', image.id, image.x, image.y)}
          >
            <img
              src={image.url}
              alt="Certificate Element"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        ))}

        {/* Render Text Elements */}
        {template.textElements.map((text) => {
          const displayText = replaceVariables(text.content);

          // Calculate position based on alignment
          const leftPosition = text.x * scale;

          // For center-aligned text, we need to offset by half the width
          // This is handled by transform: translateX(-50%)

          return (
            <div
              key={text.id}
              className={`absolute cursor-move ${
                selectedElement.id === text.id && !previewMode ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              style={{
                left: `${leftPosition}px`,
                top: `${text.y * scale}px`,
                fontSize: `${text.fontSize * scale}px`,
                fontFamily: text.fontFamily,
                fontWeight: text.fontWeight === 'bold' ? 'bold' : 'normal',
                fontStyle: text.italic ? 'italic' : 'normal',
                textDecoration: text.underline ? 'underline' : 'none',
                color: text.color,
                pointerEvents: previewMode ? 'none' : 'auto',
                whiteSpace: 'nowrap',
                lineHeight: '1.2',
                // Apply transform for center alignment
                transform: text.align === 'center' ? 'translateX(-50%)' : text.align === 'right' ? 'translateX(-100%)' : 'none',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'text', text.id, text.x, text.y)}
            >
              {displayText}
            </div>
          );
        })}

        {/* Preview Mode Watermark */}
        {previewMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl font-bold text-gray-200 opacity-20 rotate-45">
              PREVIEW
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
