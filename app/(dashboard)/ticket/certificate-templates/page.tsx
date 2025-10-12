"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import Loader from "@/components/custom ui/Loader";
import toast from "react-hot-toast";
import { CertificateTemplate } from "@/components/certificate-editor/types";

export default function CertificateTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/certificate-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/certificate-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error deleting template');
    }
  };

  const handleSetDefault = async (template: CertificateTemplate) => {
    try {
      const response = await fetch(`/api/certificate-templates/${template._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, isDefault: true }),
      });

      if (response.ok) {
        toast.success('Template set as default');
        fetchTemplates();
      } else {
        toast.error('Failed to set template as default');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Error setting default template');
    }
  };

  const handleCreateNew = (classType?: string) => {
    if (classType) {
      router.push(`/ticket/${classType.toLowerCase()}/certificate-editor`);
    } else {
      const newClassType = prompt('Enter the class type (e.g., DATE, BDI, ADI, DEFENSIVE-DRIVING):');
      if (newClassType) {
        router.push(`/ticket/${newClassType.toLowerCase()}/certificate-editor`);
      }
    }
  };

  const handleEdit = (template: CertificateTemplate) => {
    router.push(`/ticket/${template.classType.toLowerCase()}/certificate-editor`);
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('This will create default templates for DATE, BDI, and ADI. Continue?')) return;

    try {
      const response = await fetch('/api/certificate-templates/initialize', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchTemplates();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to initialize templates');
      }
    } catch (error) {
      console.error('Error initializing templates:', error);
      toast.error('Error initializing templates');
    }
  };

  if (loading) {
    return <Loader />;
  }

  // Group templates by class type
  const groupedTemplates = templates.reduce((acc, template) => {
    const key = template.classType;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(template);
    return acc;
  }, {} as Record<string, CertificateTemplate[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="text-white border-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Certificate Templates</h1>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button onClick={handleInitializeDefaults} variant="outline" className="bg-blue-500 text-white hover:bg-blue-600 border-0">
              Initialize Defaults
            </Button>
          )}
          <Button onClick={() => handleCreateNew()} className="bg-white text-gray-800 hover:bg-gray-100">
            <Plus className="w-4 h-4 mr-2" />
            Create New Template
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTemplates).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No certificate templates found</p>
              <Button onClick={() => handleCreateNew()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedTemplates).map(([classType, classTemplates]) => (
            <Card key={classType}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">
                    {classType} Templates
                  </CardTitle>
                  <Button
                    onClick={() => handleCreateNew(classType)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classTemplates.map((template) => (
                    <Card key={template._id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            {template.isDefault && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {template.pageSize.orientation}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-500">
                            <div>Elements: {template.textElements.length} text, {template.imageElements.length} images, {template.shapeElements.length} shapes</div>
                            <div>Size: {template.pageSize.width} x {template.pageSize.height}</div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleEdit(template)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>

                            {!template.isDefault && (
                              <Button
                                onClick={() => handleSetDefault(template)}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Set Default
                              </Button>
                            )}

                            <Button
                              onClick={() => handleDelete(template._id!)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <h3 className="font-semibold mb-2">How to use Certificate Templates:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Create a new template for each class type (DATE, BDI, ADI, etc.)</li>
            <li>Use the visual editor to design your certificate layout</li>
            <li>Add text, images, and shapes. Use variables like {`{{studentName}}`} or {`{{certn}}`}</li>
            <li>Set one template as default for each class type</li>
            <li>When generating certificates, the system will use the default template for that class type</li>
            <li>If no template exists, the system falls back to the legacy certificate generators</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
