"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Save, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { CertificateTemplate, TextElement, ImageElement, ShapeElement, DEFAULT_VARIABLES } from "./types";
import { CertificateCanvas } from "./CertificateCanvas";

interface CertificateEditorProps {
  classType: string;
  onSave?: (template: CertificateTemplate) => void;
  initialTemplate?: CertificateTemplate;
}

export function CertificateEditor({ classType, onSave, initialTemplate }: CertificateEditorProps) {
  const [template, setTemplate] = useState<CertificateTemplate>(
    initialTemplate || {
      name: `${classType} Certificate`,
      classType: classType.toUpperCase(),
      pageSize: { width: 842, height: 595, orientation: 'landscape' },
      background: { type: 'color', value: '#FFFFFF' },
      textElements: [],
      imageElements: [],
      shapeElements: [],
      availableVariables: DEFAULT_VARIABLES,
      isDefault: false,
      isActive: true,
    }
  );

  const [selectedElement, setSelectedElement] = useState<{
    type: 'text' | 'image' | 'shape' | null;
    id: string | null;
  }>({ type: null, id: null });

  const [previewMode, setPreviewMode] = useState(false);

  // Add Text Element
  const addTextElement = () => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      content: 'New Text',
      x: 100,
      y: 100,
      fontSize: 14,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      color: '#000000',
      align: 'left',
    };

    setTemplate({
      ...template,
      textElements: [...template.textElements, newElement],
    });

    setSelectedElement({ type: 'text', id: newElement.id });
  };

  // Add Image Element
  const addImageElement = () => {
    const newElement: ImageElement = {
      id: `image-${Date.now()}`,
      url: '/logo.png',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    };

    setTemplate({
      ...template,
      imageElements: [...template.imageElements, newElement],
    });

    setSelectedElement({ type: 'image', id: newElement.id });
  };

  // Add Shape Element
  const addShapeElement = (type: 'rectangle' | 'line' | 'circle') => {
    const newElement: ShapeElement = {
      id: `shape-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type !== 'line' ? 200 : undefined,
      height: type === 'rectangle' ? 100 : undefined,
      x2: type === 'line' ? 300 : undefined,
      y2: type === 'line' ? 100 : undefined,
      radius: type === 'circle' ? 50 : undefined,
      borderColor: '#000000',
      borderWidth: 2,
    };

    setTemplate({
      ...template,
      shapeElements: [...template.shapeElements, newElement],
    });

    setSelectedElement({ type: 'shape', id: newElement.id });
  };

  // Update element
  const updateElement = (type: 'text' | 'image' | 'shape', id: string, updates: any) => {
    if (type === 'text') {
      setTemplate({
        ...template,
        textElements: template.textElements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    } else if (type === 'image') {
      setTemplate({
        ...template,
        imageElements: template.imageElements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    } else if (type === 'shape') {
      setTemplate({
        ...template,
        shapeElements: template.shapeElements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    }
  };

  // Delete element
  const deleteElement = (type: 'text' | 'image' | 'shape', id: string) => {
    if (type === 'text') {
      setTemplate({
        ...template,
        textElements: template.textElements.filter(el => el.id !== id),
      });
    } else if (type === 'image') {
      setTemplate({
        ...template,
        imageElements: template.imageElements.filter(el => el.id !== id),
      });
    } else if (type === 'shape') {
      setTemplate({
        ...template,
        shapeElements: template.shapeElements.filter(el => el.id !== id),
      });
    }

    if (selectedElement.id === id) {
      setSelectedElement({ type: null, id: null });
    }
  };

  // Save template
  const saveTemplate = async () => {
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

      if (onSave) {
        onSave(savedTemplate);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  // Get selected element
  const getSelectedElement = () => {
    if (!selectedElement.type || !selectedElement.id) return null;

    if (selectedElement.type === 'text') {
      return template.textElements.find(el => el.id === selectedElement.id);
    } else if (selectedElement.type === 'image') {
      return template.imageElements.find(el => el.id === selectedElement.id);
    } else if (selectedElement.type === 'shape') {
      return template.shapeElements.find(el => el.id === selectedElement.id);
    }

    return null;
  };

  const selectedEl = getSelectedElement();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Class Type</Label>
                <Input
                  value={template.classType}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Set as Default</Label>
                <Switch
                  checked={template.isDefault}
                  onCheckedChange={(checked) => setTemplate({ ...template, isDefault: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={template.isActive}
                  onCheckedChange={(checked) => setTemplate({ ...template, isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={addTextElement} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Text
              </Button>
              <Button onClick={addImageElement} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <Button onClick={() => addShapeElement('rectangle')} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Rectangle
              </Button>
              <Button onClick={() => addShapeElement('line')} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {DEFAULT_VARIABLES.map((v) => (
                  <div key={v.key} className="font-mono bg-gray-100 p-1 rounded">
                    {`{{${v.key}}}`} - {v.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Certificate Editor - {classType.toUpperCase()}</h1>
          <div className="flex gap-2">
            <Button onClick={() => setPreviewMode(!previewMode)} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          <CertificateCanvas
            template={template}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElement}
            previewMode={previewMode}
          />
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      {selectedEl && !previewMode && (
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Properties</CardTitle>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteElement(selectedElement.type!, selectedElement.id!)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedElement.type === 'text' && (
                  <TextElementProperties
                    element={selectedEl as TextElement}
                    onUpdate={(updates) => updateElement('text', selectedElement.id!, updates)}
                  />
                )}

                {selectedElement.type === 'image' && (
                  <ImageElementProperties
                    element={selectedEl as ImageElement}
                    onUpdate={(updates) => updateElement('image', selectedElement.id!, updates)}
                  />
                )}

                {selectedElement.type === 'shape' && (
                  <ShapeElementProperties
                    element={selectedEl as ShapeElement}
                    onUpdate={(updates) => updateElement('shape', selectedElement.id!, updates)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Text Element Properties Component
function TextElementProperties({ element, onUpdate }: { element: TextElement; onUpdate: (updates: Partial<TextElement>) => void }) {
  return (
    <>
      <div>
        <Label>Content</Label>
        <Textarea
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>X Position</Label>
          <Input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Y Position</Label>
          <Input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label>Font Size</Label>
        <Input
          type="number"
          value={element.fontSize}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
        />
      </div>

      <div>
        <Label>Font Family</Label>
        <Select value={element.fontFamily} onValueChange={(value) => onUpdate({ fontFamily: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Times-Roman">Times Roman</SelectItem>
            <SelectItem value="Courier">Courier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Font Weight</Label>
        <Select value={element.fontWeight} onValueChange={(value) => onUpdate({ fontWeight: value as 'normal' | 'bold' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Color</Label>
        <Input
          type="color"
          value={element.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
        />
      </div>

      <div>
        <Label>Alignment</Label>
        <Select value={element.align} onValueChange={(value) => onUpdate({ align: value as 'left' | 'center' | 'right' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

// Image Element Properties Component
function ImageElementProperties({ element, onUpdate }: { element: ImageElement; onUpdate: (updates: Partial<ImageElement>) => void }) {
  return (
    <>
      <div>
        <Label>Image URL</Label>
        <Input
          value={element.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>X Position</Label>
          <Input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Y Position</Label>
          <Input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Width</Label>
          <Input
            type="number"
            value={element.width}
            onChange={(e) => onUpdate({ width: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Height</Label>
          <Input
            type="number"
            value={element.height}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
          />
        </div>
      </div>
    </>
  );
}

// Shape Element Properties Component
function ShapeElementProperties({ element, onUpdate }: { element: ShapeElement; onUpdate: (updates: Partial<ShapeElement>) => void }) {
  return (
    <>
      <div>
        <Label>Shape Type</Label>
        <Input value={element.type} disabled className="bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>X Position</Label>
          <Input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Y Position</Label>
          <Input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
          />
        </div>
      </div>

      {element.type === 'rectangle' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Width</Label>
            <Input
              type="number"
              value={element.width || 0}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Height</Label>
            <Input
              type="number"
              value={element.height || 0}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {element.type === 'line' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>X2</Label>
            <Input
              type="number"
              value={element.x2 || 0}
              onChange={(e) => onUpdate({ x2: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Y2</Label>
            <Input
              type="number"
              value={element.y2 || 0}
              onChange={(e) => onUpdate({ y2: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {element.type === 'circle' && (
        <div>
          <Label>Radius</Label>
          <Input
            type="number"
            value={element.radius || 0}
            onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
          />
        </div>
      )}

      <div>
        <Label>Border Color</Label>
        <Input
          type="color"
          value={element.borderColor || '#000000'}
          onChange={(e) => onUpdate({ borderColor: e.target.value })}
        />
      </div>

      <div>
        <Label>Border Width</Label>
        <Input
          type="number"
          value={element.borderWidth || 0}
          onChange={(e) => onUpdate({ borderWidth: Number(e.target.value) })}
        />
      </div>

      {element.type === 'rectangle' && (
        <div>
          <Label>Fill Color</Label>
          <Input
            type="color"
            value={element.color || '#FFFFFF'}
            onChange={(e) => onUpdate({ color: e.target.value })}
          />
        </div>
      )}
    </>
  );
}
