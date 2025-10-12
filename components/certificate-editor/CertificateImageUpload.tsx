"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

interface CertificateImageUploadProps {
  onUpload: (url: string) => void;
}

// Definir el tipo esperado del resultado de Cloudinary
interface CloudinaryUploadResult {
  event?: string;
  info?: string | {
    secure_url?: string;
  };
}

export function CertificateImageUpload({ onUpload }: CertificateImageUploadProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

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

  const handleUpload = (result: CloudinaryUploadResult) => {
    if (typeof result.info === 'object' && result.info?.secure_url) {
      onUpload(result.info.secure_url);
    } else {
      console.error("Error: Upload result does not contain a secure URL.");
    }
  };

  if (!isScriptLoaded) {
    return (
      <Button
        type="button"
        disabled
        className="w-full bg-gray-400 text-white cursor-not-allowed"
        size="sm"
      >
        <Upload className="h-3 w-3 mr-1" />
        Loading...
      </Button>
    );
  }

  return (
    <CldUploadWidget
      uploadPreset="uznprz18"
      onSuccess={handleUpload}
      options={{
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        sources: ['local', 'url', 'camera', 'google_drive', 'dropbox'],
        multiple: false,
        maxFiles: 1,
        clientAllowedFormats: ['image'],
        maxImageFileSize: 5000000, // 5MB
        maxImageWidth: 2000,
        maxImageHeight: 2000,
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
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          <Upload className="h-3 w-3 mr-1" />
          Upload to Cloudinary
        </Button>
      )}
    </CldUploadWidget>
  );
}
