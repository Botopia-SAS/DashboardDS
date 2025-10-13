"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Pen, Eraser } from "lucide-react";

interface SignatureInputProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label: string;
}

export function SignatureInput({
  value,
  onChange,
  label,
}: SignatureInputProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [activeTab, setActiveTab] = useState<string>("draw");
  const [saved, setSaved] = useState(false);

  const handleClear = () => {
    sigCanvas.current?.clear();
    onChange("");
    setSaved(false);
  };

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      // Get canvas and create transparent version
      const canvas = sigCanvas.current.getCanvas();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Create a new canvas with transparent background
      const newCanvas = document.createElement("canvas");
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const newCtx = newCanvas.getContext("2d");
      if (!newCtx) return;

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Make white pixels transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is white or near white, make it transparent
        if (r > 250 && g > 250 && b > 250) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      newCtx.putImageData(imageData, 0, 0);
      const dataUrl = newCanvas.toDataURL("image/png");
      onChange(dataUrl);
      setSaved(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Process image to remove white background
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Make white pixels transparent
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 250 && g > 250 && b > 250) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          onChange(canvas.toDataURL("image/png"));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pen className="h-4 w-4" />
            Draw Signature
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-2">
          <div className="border-2 border-gray-300 rounded-md bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: "w-full h-32 cursor-crosshair",
              }}
              backgroundColor="white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex items-center gap-1"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
            <div
              className={`rounded px-3 py-1 flex items-center transition-colors duration-300 ${
                saved
                  ? "bg-green-200 border-2 border-green-400"
                  : "bg-yellow-200 border-2 border-yellow-400 animate-pulse"
              }`}
            >
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                className={`flex items-center gap-1 font-bold ${
                  saved ? "text-green-900" : "text-yellow-900"
                }`}
                style={
                  saved
                    ? { background: "#b9fbc0", borderColor: "#38d996" }
                    : { background: "#ffe066", borderColor: "#ffd43b" }
                }
              >
                Save Signature
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-500">
            Upload a signature image (PNG, JPG, etc.)
          </p>
        </TabsContent>
      </Tabs>

      {value && (
        <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Preview:</p>
          <img
            src={value}
            alt="Signature preview"
            className="max-h-16 bg-white border border-gray-200 rounded"
          />
        </div>
      )}
    </div>
  );
}
