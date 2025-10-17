"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CertificateEditor } from "@/components/certificate-editor";
import { CertificateTemplate } from "@/components/certificate-editor/types";
import Loader from "@/components/custom ui/Loader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeftIcon, Eye, Save, FileText, Edit3, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { getDefaultBDITemplate } from "@/lib/defaultTemplates/bdiTemplate";
import { useDynamicCertificateGenerator } from "@/components/ticket/hooks/use-dynamic-certificate-generator";
import { Student } from "@/components/ticket/columns";

export default function CertificateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const classType = params.classtype as string;
  const decodedClassType = decodeURIComponent(classType);

  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editMode, setEditMode] = useState(false); // Modo edición desactivado por defecto
  const { generateDynamicCertificatePDF } = useDynamicCertificateGenerator();

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      // Try to get the saved template for this class type (only by classType, not default)
      const response = await fetch(
        `/api/certificate-templates?classType=${decodedClassType.toUpperCase()}`
      );

      if (response.ok) {
        const templates = await response.json();
        if (templates.length > 0) {
          // Template exists in database, use it
          const fetchedTemplate = templates[0];
          // Force 1 certificate per page in edit mode
          if (editMode) {
            fetchedTemplate.certificatesPerPage = 1;
          }
          setTemplate(fetchedTemplate);
        } else {
          // No template exists - Load BDI template as default for ALL types (including ADI)
          const upperClassType = decodedClassType.toUpperCase();
          const bdiTemplate = getDefaultBDITemplate(upperClassType);
          // Force 1 certificate per page in edit mode
          if (editMode) {
            bdiTemplate.certificatesPerPage = 1;
          }
          setTemplate(bdiTemplate as CertificateTemplate);
          console.log(`Loading BDI template as default for ${upperClassType}`);
        }
      } else {
        // Error fetching - use BDI default for all types
        const upperClassType = decodedClassType.toUpperCase();
        const bdiTemplate = getDefaultBDITemplate(upperClassType);
        // Force 1 certificate per page in edit mode
        if (editMode) {
          bdiTemplate.certificatesPerPage = 1;
        }
        setTemplate(bdiTemplate as CertificateTemplate);
      }
    } catch (error) {
      console.error("Error fetching template:", error);

      // Even on error, load BDI template as default for all types
      const upperClassType = decodedClassType.toUpperCase();
      const bdiTemplate = getDefaultBDITemplate(upperClassType);
      // Force 1 certificate per page in edit mode
      if (editMode) {
        bdiTemplate.certificatesPerPage = 1;
      }
      setTemplate(bdiTemplate as CertificateTemplate);
      toast.success("Loaded default BDI template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classType]);

  // Force 1 certificate per page when in edit mode
  useEffect(() => {
    if (template && editMode) {
      setTemplate(prev => prev ? { ...prev, certificatesPerPage: 1 } : null);
    }
  }, [editMode]);

  // Prevent body scroll when in certificate editor
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleSave = (savedTemplate: CertificateTemplate) => {
    setTemplate(savedTemplate);
    toast.success("Certificate template saved successfully!");
  };

  const handleBack = () => {
    // Navigate specifically to the correct classtype page instead of using router.back()
    const normalizedClassType = classType.toLowerCase().replace(/\s+/g, '-');
    router.push(`/ticket/${normalizedClassType}`);
  };

  const saveTemplate = async () => {
    if (!template) return;

    try {
      // Always use POST - it will upsert (update existing or create new) based on classType
      const response = await fetch('/api/certificate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const savedTemplate = await response.json();
      toast.success('Certificate template saved successfully!');
      setTemplate(savedTemplate);

      // Redirect to day-of-class page after successful save
      router.push(`/ticket/day-of-class/${classType.toLowerCase()}`);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handlePreviewPDF = async () => {
    if (!template) {
      toast.error('No template to preview');
      return;
    }

    try {
      toast.loading('Generating preview PDF...');

      // Create a mock student with example data
      const mockStudent: Student = {
        id: 'preview',
        first_name: 'JOHN',
        midl: 'MICHAEL',
        last_name: 'DOE',
        birthDate: '1990-01-15',
        certn: 12345,
        courseDate: new Date().toISOString(),
        classTitle: 'Drive Safety & Driver Improvement Course',
        classType: decodedClassType.toUpperCase(),
        licenseNumber: 'D123-456-78-910-0',
        citation_number: 'CIT-2025-001',
        address: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406',
        courseAddress: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406',
        courseTime: '9:00 AM - 5:00 PM',
        instructorName: 'N/A',
        type: decodedClassType.toUpperCase(),
        payedAmount: 150.00,
      };

      // Generate PDF using the dynamic generator
      const pdfBlob = await generateDynamicCertificatePDF(mockStudent, template);

      // Create URL and open in new tab
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      toast.dismiss();
      toast.success('Preview PDF generated!');
    } catch (error) {
      console.error('Error generating preview PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate preview PDF');
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
        <div className="flex items-center gap-4">
          {/* Edit Mode Switch */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
            editMode 
              ? 'bg-green-600/20 border border-green-500 shadow-lg shadow-green-500/20' 
              : 'bg-gray-700 border border-gray-600'
          }`}>
            <Switch
              checked={editMode}
              onCheckedChange={(checked) => setEditMode(checked)}
            />
            <Label 
              className={`text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 ${
                editMode ? 'text-green-400' : 'text-gray-300'
              }`}
            >
              {editMode ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Mode: ON</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Edit Mode: OFF</span>
                </>
              )}
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setShowVariables(!showVariables)} variant="outline" className="text-white border-white hover:bg-gray-700">
              <Eye className="w-4 h-4 mr-2" />
              {showVariables ? 'Show Examples' : 'Show Variables'}
            </Button>
            <Button 
              onClick={handlePreviewPDF} 
              variant="outline" 
              className="text-white border-white hover:bg-gray-700"
              disabled={editMode}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview PDF
            </Button>
            <Button 
              onClick={saveTemplate} 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={editMode}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-2 pb-2">
        <CertificateEditor
          classType={decodedClassType}
          onSave={handleSave}
          onChange={(updatedTemplate) => setTemplate(updatedTemplate)}
          initialTemplate={template || undefined}
          showVariables={showVariables}
          setShowVariables={setShowVariables}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          editMode={editMode}
        />
      </div>
    </div>
  );
}
