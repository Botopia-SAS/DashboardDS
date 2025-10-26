"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, X, Pen } from "lucide-react";

interface SignatureCanvasProps {
  onSave: (signatureUrl: string) => void;
  currentSignature?: string;
  studentName?: string;
}

export function SignatureCanvas({
  onSave,
  currentSignature,
  studentName = "Student",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Set up canvas for drawing
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
      }
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);

    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Failed to create image blob");
        }

        // Create form data for Cloudinary upload
        const formData = new FormData();
        formData.append("file", blob, "signature.png");
        formData.append("upload_preset", "ml_default"); // Asegúrate de tener un upload preset en Cloudinary
        formData.append("folder", "signatures"); // Carpeta en Cloudinary

        // Upload to Cloudinary
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

        const response = await fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload signature");
        }

        const data = await response.json();
        const signatureUrl = data.secure_url;

        // Call the onSave callback with the URL
        onSave(signatureUrl);
        setIsOpen(false);
        setIsUploading(false);
      }, "image/png");
    } catch (error) {
      console.error("Error uploading signature:", error);
      alert("Error uploading signature. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Button to open signature modal */}
      <div className="flex items-center gap-2">
        {currentSignature ? (
          <div className="flex items-center gap-2">
            <img
              src={currentSignature}
              alt="Signature"
              className="h-12 border border-gray-300 rounded"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(true)}
            >
              <Pen className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="w-full"
          >
            <Pen className="h-4 w-4 mr-2" />
            Add Signature
          </Button>
        )}
      </div>

      {/* Signature Canvas Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Instructor Signature</DialogTitle>
            <DialogDescription>
              Draw your signature for {studentName} using your mouse or touchscreen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="cursor-crosshair"
              />
            </div>

            <div className="text-sm text-gray-500">
              Draw your signature above
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearCanvas}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              type="button"
              onClick={saveSignature}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Save Signature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
