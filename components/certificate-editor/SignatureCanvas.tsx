"use client";

import React, { useRef, useEffect, useState } from 'react';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
  width?: number;
  height?: number;
}

export function SignatureCanvas({ onSave, onClear, width = 400, height = 200 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.type === 'mousedown' 
      ? (e as React.MouseEvent).clientX - rect.left
      : (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = e.type === 'mousedown'
      ? (e as React.MouseEvent).clientY - rect.top
      : (e as React.TouchEvent).touches[0].clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.type === 'mousemove'
      ? (e as React.MouseEvent).clientX - rect.left
      : (e as React.TouchEvent).touches[0].clientX - rect.left;
    const y = e.type === 'mousemove'
      ? (e as React.MouseEvent).clientY - rect.top
      : (e as React.TouchEvent).touches[0].clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a temporary canvas with transparent background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;

    // Get image data from original canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Make white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel is white (or near white), make it transparent
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }

    // Put modified image data to temp canvas
    tempCtx.putImageData(imageData, 0, 0);

    // Convert temp canvas to blob and create a file
    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      
      // Create a File object from the blob
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'uznprz18');
      formData.append('folder', 'certificate-signatures');
      
      // Upload to Cloudinary
      fetch(`https://api.cloudinary.com/v1_1/dcljjtnxr/image/upload`, {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(result => {
        if (result.secure_url) {
          onSave(result.secure_url);
        } else {
          console.error('Upload failed:', result);
          // Fallback to data URL if upload fails
          const signatureData = tempCanvas.toDataURL('image/png');
          onSave(signatureData);
        }
      })
      .catch(error => {
        console.error('Upload error:', error);
        // Fallback to data URL if upload fails
        const signatureData = tempCanvas.toDataURL('image/png');
        onSave(signatureData);
      });
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: `${width}px`, height: `${height}px` }}
        />
        <p className="text-center text-sm text-gray-500 mt-2">
          {hasSignature ? "Signature ready to save" : "Draw your signature above"}
        </p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={clearCanvas}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={saveSignature}
          disabled={!hasSignature}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}
