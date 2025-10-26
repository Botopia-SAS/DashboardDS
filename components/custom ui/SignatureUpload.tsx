'use client';

import { CldUploadWidget } from "next-cloudinary";
import { Upload, Pencil, Trash, X } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { SignatureCanvas } from "@/components/signature/SignatureCanvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SignatureUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onRemove: () => void;
}

// Definir el tipo esperado del resultado de Cloudinary
interface CloudinaryUploadResult {
  event?: string;
  info?: string | {
    secure_url?: string;
  };
}

const SignatureUpload: React.FC<SignatureUploadProps> = ({ onChange, onRemove, value }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [tempSignature, setTempSignature] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si el script de Cloudinary está cargado
    const checkCloudinaryScript = () => {
      if (typeof window !== 'undefined' && (window as any).cloudinary) {
        setIsScriptLoaded(true);
      } else {
        // Reintentar después de un breve delay
        setTimeout(checkCloudinaryScript, 100);
      }
    };

    checkCloudinaryScript();
  }, []);

  const onUpload = (result: CloudinaryUploadResult) => {
    if (typeof result.info === 'object' && result.info?.secure_url) {
      onChange(result.info.secure_url);
    } else {
      console.error("Error: Upload result does not contain a secure URL.");
    }
  };

  const handleDrawSignature = () => {
    setShowDrawModal(true);
    setTempSignature(null);
  };

  const handleSignatureChange = (signatureData: string | null) => {
    setTempSignature(signatureData);
  };

  const handleSaveDrawnSignature = async () => {
    if (!tempSignature) return;

    try {
      // Subir la firma dibujada a Cloudinary
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
        onChange(data.secure_url);
        setShowDrawModal(false);
        setTempSignature(null);
      } else {
        console.error('Error uploading signature to Cloudinary');
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
    }
  };

  const handleCancelDraw = () => {
    setShowDrawModal(false);
    setTempSignature(null);
  };

  return (
    <div>
      {/* Preview de la firma si existe */}
      {value && (
        <div className="mb-4 flex flex-col items-center gap-4">
          <div className="relative w-[400px] h-[200px] border-2 border-gray-300 rounded-lg">
            <Image 
              src={value} 
              alt="Signature" 
              className="object-contain rounded-lg" 
              fill 
            />
          </div>
          <Button
            type="button"
            onClick={onRemove}
            size="sm"
            variant="destructive"
            className="bg-red-500 text-white hover:bg-red-600"
          >
            <Trash className="h-4 w-4 mr-2" />
            Remove Signature
          </Button>
        </div>
      )}

      {/* Botones de acción */}
      {!value && (
        <div className="flex flex-col gap-3">
          {/* Botón para dibujar firma */}
          <Button
            type="button"
            onClick={handleDrawSignature}
            className="bg-blue-600 text-white hover:bg-blue-700 w-full"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Draw Signature
          </Button>

          {/* Botón para subir imagen */}
          {isScriptLoaded ? (
            <CldUploadWidget
              uploadPreset="uznprz18"
              onSuccess={onUpload}
              options={{
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                sources: ['local', 'url', 'camera', 'google_drive', 'dropbox'],
                multiple: false,
                maxFiles: 1,
                clientAllowedFormats: ['image'],
                maxImageFileSize: 5000000, // 5MB
                folder: 'signatures',
                showPoweredBy: false,
                styles: {
                  palette: {
                    window: "#FFFFFF",
                    windowBorder: "#90A0B3",
                    tabIcon: "#0078FF",
                    menuIcons: "#5A616A",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#0078FF",
                    action: "#0078FF",
                    inactiveTabIcon: "#0E2F5A",
                    error: "#F44235",
                    inProgress: "#0078FF",
                    complete: "#20B832",
                    sourceBg: "#E4EBF1"
                  },
                  frame: {
                    background: "rgba(0,0,0,0.5)"
                  }
                }
              }}
            >
              {({ open }) => (
                <Button
                  type="button"
                  onClick={() => {
                    if (open) {
                      open();
                    } else {
                      console.error("Upload widget is not ready yet.");
                    }
                  }}
                  className="bg-gray-600 text-white hover:bg-gray-700 w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              )}
            </CldUploadWidget>
          ) : (
            <Button
              type="button"
              disabled
              className="bg-gray-400 text-white cursor-not-allowed w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Loading...
            </Button>
          )}
        </div>
      )}

      {/* Modal para dibujar firma */}
      <Dialog open={showDrawModal} onOpenChange={setShowDrawModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Draw Your Signature</DialogTitle>
            <DialogDescription>
              Draw your signature using your mouse or touchscreen.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <SignatureCanvas
              onSignatureChange={handleSignatureChange}
              width={600}
              height={250}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDraw}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignatureUpload;
