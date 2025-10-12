"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CertificateEditor } from "@/components/certificate-editor";
import { CertificateTemplate } from "@/components/certificate-editor/types";
import Loader from "@/components/custom ui/Loader";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";
import { getDefaultBDITemplate } from "@/lib/defaultTemplates/bdiTemplate";

export default function CertificateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const classType = params.classtype as string;
  const decodedClassType = decodeURIComponent(classType);

  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [classType]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      // Try to get the saved template for this class type
      const response = await fetch(
        `/api/certificate-templates?classType=${decodedClassType.toUpperCase()}&default=true`
      );

      if (response.ok) {
        const templates = await response.json();
        if (templates.length > 0) {
          // Template exists in database, use it
          setTemplate(templates[0]);
        } else {
          // No template exists - Load BDI template as default for all types (except ADI)
          const upperClassType = decodedClassType.toUpperCase();

          if (upperClassType === 'ADI') {
            // For ADI, start with blank template
            setTemplate(null);
          } else {
            // For all other types (DATE, BDI, and any new classes), use BDI template
            const bdiTemplate = getDefaultBDITemplate(upperClassType);
            setTemplate(bdiTemplate as CertificateTemplate);
            console.log(`Loading BDI template as default for ${upperClassType}`);
          }
        }
      } else {
        // Error fetching - use BDI default
        const upperClassType = decodedClassType.toUpperCase();
        if (upperClassType !== 'ADI') {
          const bdiTemplate = getDefaultBDITemplate(upperClassType);
          setTemplate(bdiTemplate as CertificateTemplate);
        } else {
          setTemplate(null);
        }
      }
    } catch (error) {
      console.error("Error fetching template:", error);

      // Even on error, load BDI template as default
      const upperClassType = decodedClassType.toUpperCase();
      if (upperClassType !== 'ADI') {
        const bdiTemplate = getDefaultBDITemplate(upperClassType);
        setTemplate(bdiTemplate as CertificateTemplate);
        toast.success("Loaded default BDI template");
      } else {
        toast.error("Error loading certificate template");
        setTemplate(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (savedTemplate: CertificateTemplate) => {
    setTemplate(savedTemplate);
    toast.success("Certificate template saved successfully!");
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {decodedClassType.toUpperCase()} Certificate Editor
            </h1>
            <p className="text-sm text-gray-500">
              Design the certificate template for {decodedClassType} classes
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <CertificateEditor
          classType={decodedClassType}
          onSave={handleSave}
          initialTemplate={template || undefined}
        />
      </div>
    </div>
  );
}
