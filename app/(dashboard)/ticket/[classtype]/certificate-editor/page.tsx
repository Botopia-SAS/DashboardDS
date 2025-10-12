"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CertificateEditor } from "@/components/certificate-editor";
import { CertificateTemplate } from "@/components/certificate-editor/types";
import Loader from "@/components/custom ui/Loader";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Eye, Save } from "lucide-react";
import toast from "react-hot-toast";
import { getDefaultBDITemplate } from "@/lib/defaultTemplates/bdiTemplate";

export default function CertificateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const classType = params.classtype as string;
  const decodedClassType = decodeURIComponent(classType);

  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [classType]);

  // Prevent body scroll when in certificate editor
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

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

  const saveTemplate = async () => {
    if (!template) return;
    
    try {
      const url = template._id
        ? `/api/certificate-templates/${template._id}`
        : '/api/certificate-templates';

      const method = template._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const savedTemplate = await response.json();
      toast.success('Template saved successfully!');
      setTemplate(savedTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="certificate-editor-page h-screen flex flex-col overflow-hidden">
      <div className="bg-gray-800 text-white px-6 py-2 flex items-center justify-between rounded-lg mx-2 mt-2 mb-1 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm" className="text-white border-white hover:bg-gray-700">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {decodedClassType.toUpperCase()} Certificate Editor
            </h1>
            <p className="text-sm text-gray-300">
              Design the certificate template for {decodedClassType} classes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowVariables(!showVariables)} variant="outline" className="text-white border-white hover:bg-gray-700">
            <Eye className="w-4 h-4 mr-2" />
            {showVariables ? 'Show Examples' : 'Show Variables'}
          </Button>
          <Button onClick={() => setPreviewMode(!previewMode)} variant="outline" className="text-white border-white hover:bg-gray-700">
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button onClick={saveTemplate} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-2 pb-2">
        <CertificateEditor
          classType={decodedClassType}
          onSave={handleSave}
          initialTemplate={template || undefined}
          showVariables={showVariables}
          setShowVariables={setShowVariables}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
        />
      </div>
    </div>
  );
}
