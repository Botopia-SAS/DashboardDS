import { CldUploadWidget } from "next-cloudinary";
import { Plus, Trash } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ImageUploadProps {
  value: string[];
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  defaultImageUrl?: string; // Nueva prop para la URL de imagen por defecto
}

// Definir el tipo esperado del resultado de Cloudinary
interface CloudinaryUploadResult {
  event?: string;
  info?: string | {
    secure_url?: string;
  };
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onChange, onRemove, value, defaultImageUrl }) => {
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

  const onUpload = (result: CloudinaryUploadResult) => {
    if (typeof result.info === 'object' && result.info?.secure_url) {
      onChange(result.info.secure_url);
    } else {
      console.error("Error: Upload result does not contain a secure URL.");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {value.map((url) => {
          // No mostrar la caneca si es la imagen por defecto
          const isDefaultImage = defaultImageUrl && url === defaultImageUrl;
          
          return (
            <div key={url} className="relative w-[200px] h-[200px]">
              {!isDefaultImage && (
                <div className="absolute top-0 right-0 z-10">
                  <Button
                    type="button"
                    onClick={() => onRemove(url)}
                    size="sm"
                    className="bg-red-500 text-white"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Image src={url} alt="uploaded" className="object-cover rounded-lg" fill />
            </div>
          );
        })}
      </div>

      {/* ✅ Verificación antes de ejecutar `open` */}
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
              className="bg-gray-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          )}
        </CldUploadWidget>
      ) : (
        <Button
          type="button"
          disabled
          className="bg-gray-400 text-white cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Loading...
        </Button>
      )}
    </div>
  );
};

export default ImageUpload;
