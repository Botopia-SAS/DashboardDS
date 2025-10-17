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
  const [justClickedElement, setJustClickedElement] = useState(false);
  const [manualZoom, setManualZoom] = useState<number>(1); // 1 = 100%

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

  const scale = getOptimalScale() * manualZoom;

  // Handle mouse down on element - simple click to select/deselect
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'text' | 'image' | 'shape',
    id: string,
    currentX: number,
    currentY: number
  ) => {
    if (previewMode) return;

    e.stopPropagation();
    setJustClickedElement(true);

    // Check if clicking on already selected element
    const isCurrentlySelected = selectedElement.type === type && selectedElement.id === id;

    if (isCurrentlySelected) {
      // If already selected, deselect immediately
      onSelectElement({ type: null, id: null });
    } else {
      // Select the new element immediately
      onSelectElement({ type, id });
    }

    // Always prepare for potential drag regardless of selection state
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
      const threshold = 3; // Reduced threshold for more responsive dragging

      if (deltaX > threshold || deltaY > threshold) {
        // Start actual dragging
        setDragging({ type: potentialDrag.type, id: potentialDrag.id });
        setDragStart({
          x: e.clientX - potentialDrag.x * scale,
          y: e.clientY - potentialDrag.y * scale
        });
        // Clear the justClickedElement flag when starting to drag
        setJustClickedElement(false);
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
    // Reset the flag after a short delay to prevent immediate deselection
    setTimeout(() => setJustClickedElement(false), 10);
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

  // Calculate layout for multiple certificates per page
  const certsPerPage = template.certificatesPerPage || 1;
  // 2, 3 certificates are stacked vertically in rows
  const rows = certsPerPage;
  const cols = 1;
  // FORCE: Keep content at original size, don't scale it down
  const certScaleX = 1; // Full width - no scaling
  const certScaleY = 1; // Full height - no scaling (content stays same size)

  // Render a single certificate instance
  const renderCertificate = (certIndex: number) => {
    const row = Math.floor(certIndex / cols);
    const col = certIndex % cols;
    const offsetX = col * (template.pageSize.width / cols);
    const offsetY = row * (template.pageSize.height / rows);

    return (
      <div
        key={`cert-${certIndex}`}
        className="absolute inset-0"
        style={{
          transform: `translate(${offsetX * scale}px, ${offsetY * scale}px)`,
          width: `${(template.pageSize.width / cols) * scale}px`,
          height: `${(template.pageSize.height / rows) * scale}px`,
          overflow: 'hidden',
          pointerEvents: certIndex === 0 ? 'auto' : 'none', // Only first certificate is editable
          opacity: certIndex === 0 ? 1 : 0.7, // Dim copies slightly
        }}
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
        {template.shapeElements.map((shape) => {
          const scaledShape = {
            ...shape,
            x: shape.x * certScaleX,
            y: shape.y * certScaleY,
            width: shape.width ? shape.width * certScaleX : undefined,
            height: shape.height ? shape.height * certScaleY : undefined,
            x2: shape.x2 ? shape.x2 * certScaleX : undefined,
            y2: shape.y2 ? shape.y2 * certScaleY : undefined,
            radius: shape.radius ? shape.radius * Math.min(certScaleX, certScaleY) : undefined,
            borderWidth: shape.borderWidth ? shape.borderWidth * Math.min(certScaleX, certScaleY) : undefined,
          };

          return (
          <div
            key={`${shape.id}-${certIndex}`}
            className={`absolute ${certIndex === 0 && dragging && dragging.id === shape.id ? 'cursor-move' : certIndex === 0 ? 'cursor-pointer' : ''} ${
              certIndex === 0 && selectedElement.id === shape.id && !previewMode ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${scaledShape.x * scale}px`,
              top: `${scaledShape.y * scale}px`,
              pointerEvents: previewMode || certIndex !== 0 ? 'none' : 'auto',
            }}
            onMouseDown={certIndex === 0 ? (e) => handleMouseDown(e, 'shape', shape.id, shape.x, shape.y) : undefined}
          >
            {shape.type === 'rectangle' && (
              <div
                style={{
                  width: `${(scaledShape.width || 0) * scale}px`,
                  height: `${(scaledShape.height || 0) * scale}px`,
                  backgroundColor: shape.color || 'transparent',
                  border: `${(scaledShape.borderWidth || 0) * scale}px ${shape.borderStyle || 'solid'} ${shape.borderColor || '#000'}`,
                }}
              />
            )}

            {shape.type === 'line' && (
              <svg
                width={`${Math.abs((scaledShape.x2 || 0) - scaledShape.x) * scale}px`}
                height={`${Math.abs((scaledShape.y2 || 0) - scaledShape.y) * scale}px`}
                style={{ overflow: 'visible' }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={`${((scaledShape.x2 || 0) - scaledShape.x) * scale}`}
                  y2={`${((scaledShape.y2 || 0) - scaledShape.y) * scale}`}
                  stroke={shape.borderColor || '#000'}
                  strokeWidth={(scaledShape.borderWidth || 1) * scale}
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
                  width: `${(scaledShape.radius || 0) * 2 * scale}px`,
                  height: `${(scaledShape.radius || 0) * 2 * scale}px`,
                  borderRadius: '50%',
                  backgroundColor: shape.color || 'transparent',
                  border: `${(scaledShape.borderWidth || 0) * scale}px ${shape.borderStyle || 'solid'} ${shape.borderColor || '#000'}`,
                }}
              />
            )}
          </div>
        );
        })}

        {/* Render Image Elements */}
        {template.imageElements.map((image) => {
          const scaledImage = {
            ...image,
            x: image.x * certScaleX,
            y: image.y * certScaleY,
            width: image.width * certScaleX,
            height: image.height * certScaleY,
          };

          return (
          <div
            key={`${image.id}-${certIndex}`}
            className={`absolute ${certIndex === 0 && dragging && dragging.id === image.id ? 'cursor-move' : certIndex === 0 ? 'cursor-pointer' : ''} ${
              certIndex === 0 && selectedElement.id === image.id && !previewMode ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: `${scaledImage.x * scale}px`,
              top: `${scaledImage.y * scale}px`,
              width: `${scaledImage.width * scale}px`,
              height: `${scaledImage.height * scale}px`,
              pointerEvents: previewMode || certIndex !== 0 ? 'none' : 'auto',
            }}
            onMouseDown={certIndex === 0 ? (e) => handleMouseDown(e, 'image', image.id, image.x, image.y) : undefined}
          >
            <img
              src={image.url}
              alt="Certificate Element"
              className="w-full h-full object-contain"
              draggable={false}
              style={{
                filter: image.grayscale ? 'grayscale(100%)' : 'none'
              }}
            />
          </div>
          );
        })}

        {/* Render Text Elements */}
        {template.textElements.map((text) => {
          const displayText = replaceVariables(text.content);
          const scaledText = {
            ...text,
            x: text.x * certScaleX,
            y: text.y * certScaleY,
            fontSize: text.fontSize * certScaleX, // Keep text proportional to width
          };

          // Calculate position based on alignment
          const leftPosition = scaledText.x * scale;

          return (
            <div
              key={`${text.id}-${certIndex}`}
              className={`absolute ${certIndex === 0 && dragging && dragging.id === text.id ? 'cursor-move' : certIndex === 0 ? 'cursor-pointer' : ''} ${
                certIndex === 0 && selectedElement.id === text.id && !previewMode ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              style={{
                left: `${leftPosition}px`,
                top: `${scaledText.y * scale}px`,
                fontSize: `${scaledText.fontSize * scale}px`,
                fontFamily: text.fontFamily,
                fontWeight: text.fontWeight === 'bold' ? 'bold' : 'normal',
                fontStyle: text.italic ? 'italic' : 'normal',
                textDecoration: text.underline ? 'underline' : 'none',
                color: text.color,
                pointerEvents: previewMode || certIndex !== 0 ? 'none' : 'auto',
                whiteSpace: 'nowrap',
                lineHeight: '1.2',
                // Apply transform for center alignment
                transform: text.align === 'center' ? 'translateX(-50%)' : text.align === 'right' ? 'translateX(-100%)' : 'none',
              }}
              onMouseDown={certIndex === 0 ? (e) => handleMouseDown(e, 'text', text.id, text.x, text.y) : undefined}
            >
              {displayText}
            </div>
          );
        })}
      </div>
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });

  // Handle viewport scroll to update minimap
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    setViewportPosition({
      x: container.scrollLeft,
      y: container.scrollTop
    });
  };

  // Handle minimap click to move viewport
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate scroll position based on minimap click
    const minimapScale = 0.15; // Minimap is 15% of actual size
    const scrollX = (clickX / minimapScale) - (containerRef.current.clientWidth / 2);
    const scrollY = (clickY / minimapScale) - (containerRef.current.clientHeight / 2);

    containerRef.current.scrollTo({
      left: Math.max(0, scrollX),
      top: Math.max(0, scrollY),
      behavior: 'smooth'
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-center h-full w-full p-2 bg-gray-50 overflow-auto"
      onScroll={handleScroll}
    >
      <div
        ref={canvasRef}
        className="relative bg-white shadow-2xl border-4 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          width: `${template.pageSize.width * scale}px`,
          height: `${template.pageSize.height * scale}px`,
          backgroundColor: template.background.type === 'color' ? template.background.value : '#FFFFFF',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => !previewMode && !justClickedElement && onSelectElement({ type: null, id: null })}
        tabIndex={0}
      >
        {/* Render all certificate instances */}
        {Array.from({ length: certsPerPage }).map((_, certIndex) => renderCertificate(certIndex))}

        {/* Preview Mode Watermark */}
        {previewMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl font-bold text-gray-200 opacity-20 rotate-45">
              PREVIEW
            </div>
          </div>
        )}
      </div>

      {/* Navigation Minimap - Above Zoom Controls */}
      {!previewMode && manualZoom > 1 && (
        <div
          className="absolute bottom-20 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-400 overflow-hidden cursor-pointer"
          onClick={handleMinimapClick}
          title="Click to navigate"
        >
          <div
            className="relative bg-gray-100"
            style={{
              width: `${template.pageSize.width * 0.15}px`,
              height: `${template.pageSize.height * 0.15}px`,
              maxWidth: '150px',
              maxHeight: '150px',
            }}
          >
            {/* Minimap representation of the certificate */}
            <div
              className="absolute inset-0 bg-white border border-gray-300"
              style={{
                backgroundColor: template.background.type === 'color' ? template.background.value : '#FFFFFF',
              }}
            />

            {/* Viewport indicator */}
            {containerRef.current && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                style={{
                  left: `${Math.min(100, (viewportPosition.x / Math.max(1, containerRef.current.scrollWidth - containerRef.current.clientWidth)) * 100)}%`,
                  top: `${Math.min(100, (viewportPosition.y / Math.max(1, containerRef.current.scrollHeight - containerRef.current.clientHeight)) * 100)}%`,
                  width: `${Math.min(100, (containerRef.current.clientWidth / containerRef.current.scrollWidth) * 100)}%`,
                  height: `${Math.min(100, (containerRef.current.clientHeight / containerRef.current.scrollHeight) * 100)}%`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Zoom Controls - Bottom Right Corner */}
      {!previewMode && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-lg border border-gray-300 px-3 py-2">
          <button
            onClick={() => setManualZoom(prev => Math.max(0.5, prev - 0.1))}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded transition-colors font-bold text-lg"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
            {Math.round(manualZoom * 100)}%
          </span>
          <button
            onClick={() => setManualZoom(prev => Math.min(2, prev + 0.1))}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded transition-colors font-bold text-lg"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setManualZoom(1)}
            className="ml-1 px-2 h-8 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
