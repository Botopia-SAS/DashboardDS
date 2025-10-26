"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Pen, X } from "lucide-react";
import { SignatureCanvas as DrawingCanvas } from "../signature/SignatureCanvas";

interface SignatureCanvasProps {
  onSave: (signatureUrl: string, applyToAll?: boolean) => void;
  currentSignature?: string;
  studentName?: string;
  showApplyToAll?: boolean;
}

export function SignatureCanvas({
  onSave,
  currentSignature,
  studentName = "Student",
  showApplyToAll = false,
}: SignatureCanvasProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);

  const handleSignatureChange = (signatureData: string | null) => {
    setTempSignature(signatureData);
  };

  const handleSaveDrawnSignature = async () => {
    if (!tempSignature) return;

    try {
      const formData = new FormData();
      formData.append('file', tempSignature);
      formData.append('upload_preset', 'uznprz18');
      formData.append('folder', 'signatures');

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        onSave(data.secure_url, applyToAll);
        setIsOpen(false);
        setTempSignature(null);
        setApplyToAll(false);
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
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

      {/* Draw Signature Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Instructor Signature</DialogTitle>
            <DialogDescription>
              Draw your signature for {studentName} using your mouse or touchscreen.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <DrawingCanvas
              onSignatureChange={handleSignatureChange}
              width={600}
              height={250}
            />
          </div>

          {showApplyToAll && (
            <div className="flex items-center space-x-2 px-6 pb-2">
              <Checkbox
                id="applyToAll"
                checked={applyToAll}
                onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
              />
              <label
                htmlFor="applyToAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Apply this signature to all students
              </label>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setTempSignature(null);
                setApplyToAll(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveDrawnSignature}
              disabled={!tempSignature}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
