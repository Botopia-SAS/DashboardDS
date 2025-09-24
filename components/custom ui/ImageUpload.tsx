import { CldUploadWidget } from "next-cloudinary";
import { Plus, Trash } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

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
      <CldUploadWidget uploadPreset="uznprz18" onSuccess={onUpload}>
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
    </div>
  );
};

export default ImageUpload;
