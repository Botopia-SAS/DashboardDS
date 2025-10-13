"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { CertificateTemplate, TextElement, ImageElement, ShapeElement, DEFAULT_VARIABLES } from "./types";
import { CertificateCanvas } from "./CertificateCanvas";
import { CertificateImageUpload } from "./CertificateImageUpload";

interface CertificateEditorProps {
  classType: string;
  onSave?: (template: CertificateTemplate) => void;
  onChange?: (template: CertificateTemplate) => void;
  initialTemplate?: CertificateTemplate;
  showVariables?: boolean;
  setShowVariables?: (show: boolean) => void;
  previewMode?: boolean;
  setPreviewMode?: (mode: boolean) => void;
}

export function CertificateEditor({
  classType,
  onSave,
  onChange,
  initialTemplate,
  showVariables = false,
  // setShowVariables,
  previewMode = false
  // setPreviewMode
}: CertificateEditorProps) {
  const router = useRouter();
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

  const [borderLineStyle, setBorderLineStyle] = useState<string>('solid');
  const [selectedFrameStyle, setSelectedFrameStyle] = useState<string>('');

  // History for undo/redo
  const [history, setHistory] = useState<CertificateTemplate[]>([template]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Clipboard for copy/paste functionality
  const [clipboard, setClipboard] = useState<{
    type: 'text' | 'image' | 'shape';
    element: TextElement | ImageElement | ShapeElement;
  } | null>(null);

  // Notify parent component when template changes
  useEffect(() => {
    if (onChange) {
      onChange(template);
    }
  }, [template, onChange]);

  // Keyboard shortcuts for undo/redo, copy/paste, and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } 
      // Redo
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Copy element
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelectedElement();
      }
      // Paste element
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteElement();
      }
      // Delete element
      else if (e.key === 'Delete' || e.key === 'Supr') {
        e.preventDefault();
        deleteSelectedElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, selectedElement, clipboard]);

  // Update history when template changes (but not during undo/redo)
  const pushToHistory = (newTemplate: CertificateTemplate) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);

    // Keep only last 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
    setTemplate(newTemplate);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
      toast.success('Undo');
    } else {
      toast.error('Nothing to undo');
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
      toast.success('Redo');
    } else {
      toast.error('Nothing to redo');
    }
  };

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

    pushToHistory({
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

    pushToHistory({
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

    pushToHistory({
      ...template,
      shapeElements: [...template.shapeElements, newElement],
    });

    setSelectedElement({ type: 'shape', id: newElement.id });
  };

  // Update element
  const updateElement = (type: 'text' | 'image' | 'shape', id: string, updates: any) => {
    if (type === 'text') {
      pushToHistory({
        ...template,
        textElements: template.textElements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    } else if (type === 'image') {
      pushToHistory({
        ...template,
        imageElements: template.imageElements.map(el =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    } else if (type === 'shape') {
      pushToHistory({
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
      pushToHistory({
        ...template,
        textElements: template.textElements.filter(el => el.id !== id),
      });
    } else if (type === 'image') {
      pushToHistory({
        ...template,
        imageElements: template.imageElements.filter(el => el.id !== id),
      });
    } else if (type === 'shape') {
      pushToHistory({
        ...template,
        shapeElements: template.shapeElements.filter(el => el.id !== id),
      });
    }

    if (selectedElement.id === id) {
      setSelectedElement({ type: null, id: null });
    }
  };

  // Copy selected element to clipboard
  const copySelectedElement = () => {
    if (!selectedElement.type || !selectedElement.id) {
      toast.error('No element selected to copy');
      return;
    }

    const element = getSelectedElement();
    if (!element) {
      toast.error('Selected element not found');
      return;
    }

    setClipboard({
      type: selectedElement.type,
      element: { ...element } // Create a copy to avoid reference issues
    });

    toast.success(`${selectedElement.type} element copied to clipboard`);
  };

  // Paste element from clipboard
  const pasteElement = () => {
    if (!clipboard) {
      toast.error('No element in clipboard to paste');
      return;
    }

    // Create a new element with a unique ID and slightly offset position
    const offsetX = 20;
    const offsetY = 20;

    if (clipboard.type === 'text') {
      const textElement = clipboard.element as TextElement;
      const newElement: TextElement = {
        ...textElement,
        id: `text-${Date.now()}`,
        x: textElement.x + offsetX,
        y: textElement.y + offsetY,
      };

      pushToHistory({
        ...template,
        textElements: [...template.textElements, newElement],
      });

      setSelectedElement({ type: 'text', id: newElement.id });
      toast.success('Text element pasted');
    } else if (clipboard.type === 'image') {
      const imageElement = clipboard.element as ImageElement;
      const newElement: ImageElement = {
        ...imageElement,
        id: `image-${Date.now()}`,
        x: imageElement.x + offsetX,
        y: imageElement.y + offsetY,
      };

      pushToHistory({
        ...template,
        imageElements: [...template.imageElements, newElement],
      });

      setSelectedElement({ type: 'image', id: newElement.id });
      toast.success('Image element pasted');
    } else if (clipboard.type === 'shape') {
      const shapeElement = clipboard.element as ShapeElement;
      const newElement: ShapeElement = {
        ...shapeElement,
        id: `shape-${Date.now()}`,
        x: shapeElement.x + offsetX,
        y: shapeElement.y + offsetY,
        x2: shapeElement.x2 ? shapeElement.x2 + offsetX : undefined,
        y2: shapeElement.y2 ? shapeElement.y2 + offsetY : undefined,
      };

      pushToHistory({
        ...template,
        shapeElements: [...template.shapeElements, newElement],
      });

      setSelectedElement({ type: 'shape', id: newElement.id });
      toast.success('Shape element pasted');
    }
  };

  // Delete selected element using keyboard shortcut
  const deleteSelectedElement = () => {
    if (!selectedElement.type || !selectedElement.id) {
      toast.error('No element selected to delete');
      return;
    }

    deleteElement(selectedElement.type, selectedElement.id);
    toast.success(`${selectedElement.type} element deleted`);
  };

  // Insert variable into selected text element
  const insertVariable = (variableKey: string) => {
    if (selectedElement.type === 'text' && selectedElement.id) {
      const textElement = template.textElements.find(el => el.id === selectedElement.id);
      if (textElement) {
        const variable = `{{${variableKey}}}`;
        const newContent = textElement.content + variable;

        pushToHistory({
          ...template,
          textElements: template.textElements.map(el =>
            el.id === selectedElement.id
              ? { ...el, content: newContent }
              : el
          ),
        });
      }
    } else {
      // If no text element selected, create a new one with the variable
      const newElement: TextElement = {
        id: `text-${Date.now()}`,
        content: `{{${variableKey}}}`,
        x: 100,
        y: 100,
        fontSize: 14,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        color: '#000000',
        align: 'left',
      };

      pushToHistory({
        ...template,
        textElements: [...template.textElements, newElement],
      });

      setSelectedElement({ type: 'text', id: newElement.id });
    }
  };

  // Quick frame functions - REPLACE existing frames
  const addTripleBorder = () => {
    // Remove existing frames first
    const nonFrameShapes = template.shapeElements.filter(shape => {
      if (shape.type === 'rectangle') {
        const isNearEdge = shape.x <= 50 && shape.y <= 50;
        const isFullWidth = (shape.width || 0) > template.pageSize.width * 0.8;
        const isFullHeight = (shape.height || 0) > template.pageSize.height * 0.8;
        return !(isNearEdge && (isFullWidth || isFullHeight));
      }
      if (shape.type === 'line') {
        const spansWidth = Math.abs((shape.x2 || 0) - shape.x) > template.pageSize.width * 0.8;
        const spansHeight = Math.abs((shape.y2 || 0) - shape.y) > template.pageSize.height * 0.8;
        return !(spansWidth || spansHeight);
      }
      return true;
    });

    const borders = [
      { id: `border-outer-${Date.now()}`, type: 'rectangle' as const, x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 6, borderStyle: borderLineStyle, color: 'transparent' },
      { id: `border-middle-${Date.now()}`, type: 'rectangle' as const, x: 30, y: 30, width: 782, height: 535, borderColor: '#000000', borderWidth: 4, borderStyle: borderLineStyle, color: 'transparent' },
      { id: `border-inner-${Date.now()}`, type: 'rectangle' as const, x: 40, y: 40, width: 762, height: 515, borderColor: '#000000', borderWidth: 2, borderStyle: borderLineStyle, color: 'transparent' }
    ];

    pushToHistory({
      ...template,
      shapeElements: [...nonFrameShapes, ...borders],
    });
    setSelectedFrameStyle('quick-triple');
  };

  const addDoubleBorder = () => {
    // Remove existing frames first
    const nonFrameShapes = template.shapeElements.filter(shape => {
      if (shape.type === 'rectangle') {
        const isNearEdge = shape.x <= 50 && shape.y <= 50;
        const isFullWidth = (shape.width || 0) > template.pageSize.width * 0.8;
        const isFullHeight = (shape.height || 0) > template.pageSize.height * 0.8;
        return !(isNearEdge && (isFullWidth || isFullHeight));
      }
      if (shape.type === 'line') {
        const spansWidth = Math.abs((shape.x2 || 0) - shape.x) > template.pageSize.width * 0.8;
        const spansHeight = Math.abs((shape.y2 || 0) - shape.y) > template.pageSize.height * 0.8;
        return !(spansWidth || spansHeight);
      }
      return true;
    });

    const borders = [
      { id: `border-outer-${Date.now()}`, type: 'rectangle' as const, x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 4, borderStyle: borderLineStyle, color: 'transparent' },
      { id: `border-inner-${Date.now()}`, type: 'rectangle' as const, x: 30, y: 30, width: 782, height: 535, borderColor: '#000000', borderWidth: 2, borderStyle: borderLineStyle, color: 'transparent' }
    ];

    pushToHistory({
      ...template,
      shapeElements: [...nonFrameShapes, ...borders],
    });
    setSelectedFrameStyle('quick-double');
  };

  const addSingleBorder = () => {
    // Remove existing frames first
    const nonFrameShapes = template.shapeElements.filter(shape => {
      if (shape.type === 'rectangle') {
        const isNearEdge = shape.x <= 50 && shape.y <= 50;
        const isFullWidth = (shape.width || 0) > template.pageSize.width * 0.8;
        const isFullHeight = (shape.height || 0) > template.pageSize.height * 0.8;
        return !(isNearEdge && (isFullWidth || isFullHeight));
      }
      if (shape.type === 'line') {
        const spansWidth = Math.abs((shape.x2 || 0) - shape.x) > template.pageSize.width * 0.8;
        const spansHeight = Math.abs((shape.y2 || 0) - shape.y) > template.pageSize.height * 0.8;
        return !(spansWidth || spansHeight);
      }
      return true;
    });

    const border = {
      id: `border-${Date.now()}`,
      type: 'rectangle' as const,
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: '#000000',
      borderWidth: 3,
      borderStyle: borderLineStyle,
      color: 'transparent'
    };

    pushToHistory({
      ...template,
      shapeElements: [...nonFrameShapes, border],
    });
    setSelectedFrameStyle('quick-single');
  };

  // Predefined frame styles - ALL BLACK
  const frameStyles = [
    {
      id: 'classic-triple',
      name: 'Classic Triple Border',
      description: 'Traditional certificate style',
      shapes: [
        { type: 'rectangle' as const, x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 6, color: 'transparent' },
        { type: 'rectangle' as const, x: 30, y: 30, width: 782, height: 535, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
        { type: 'rectangle' as const, x: 40, y: 40, width: 762, height: 515, borderColor: '#000000', borderWidth: 2, color: 'transparent' }
      ]
    },
    {
      id: 'elegant-double',
      name: 'Elegant Double',
      description: 'Clean double border',
      shapes: [
        { type: 'rectangle' as const, x: 15, y: 15, width: 812, height: 565, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
        { type: 'rectangle' as const, x: 25, y: 25, width: 792, height: 545, borderColor: '#000000', borderWidth: 2, color: 'transparent' }
      ]
    },
    {
      id: 'modern-single',
      name: 'Modern Single',
      description: 'Minimalist single border',
      shapes: [
        { type: 'rectangle' as const, x: 25, y: 25, width: 792, height: 545, borderColor: '#000000', borderWidth: 4, color: 'transparent' }
      ]
    },
    {
      id: 'decorative-corners',
      name: 'Decorative Corners',
      description: 'Corner accent design',
      shapes: [
        { type: 'rectangle' as const, x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
        { type: 'rectangle' as const, x: 20, y: 20, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
        { type: 'rectangle' as const, x: 742, y: 20, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
        { type: 'rectangle' as const, x: 20, y: 495, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
        { type: 'rectangle' as const, x: 742, y: 495, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' }
      ]
    },
    {
      id: 'thick-border',
      name: 'Thick Border',
      description: 'Bold single thick border',
      shapes: [
        { type: 'rectangle' as const, x: 10, y: 10, width: 822, height: 575, borderColor: '#000000', borderWidth: 8, color: 'transparent' },
        { type: 'rectangle' as const, x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
        { type: 'rectangle' as const, x: 30, y: 30, width: 782, height: 535, borderColor: '#000000', borderWidth: 1, color: 'transparent' }
      ]
    },
    {
      id: 'vintage-ornate',
      name: 'Vintage Ornate',
      description: 'Classic ornate style',
      shapes: [
        { type: 'rectangle' as const, x: 15, y: 15, width: 812, height: 565, borderColor: '#000000', borderWidth: 5, color: 'transparent' },
        { type: 'rectangle' as const, x: 25, y: 25, width: 792, height: 545, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
        { type: 'rectangle' as const, x: 35, y: 35, width: 772, height: 525, borderColor: '#000000', borderWidth: 1, color: 'transparent' }
      ]
    },
    {
      id: 'tech-modern',
      name: 'Tech Modern',
      description: 'Contemporary tech style',
      shapes: [
        { type: 'rectangle' as const, x: 30, y: 30, width: 782, height: 535, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
        { type: 'line' as const, x: 30, y: 30, x2: 130, y2: 30, borderColor: '#000000', borderWidth: 6 },
        { type: 'line' as const, x: 712, y: 30, x2: 812, y2: 30, borderColor: '#000000', borderWidth: 6 },
        { type: 'line' as const, x: 30, y: 565, x2: 130, y2: 565, borderColor: '#000000', borderWidth: 6 },
        { type: 'line' as const, x: 712, y: 565, x2: 812, y2: 565, borderColor: '#000000', borderWidth: 6 }
      ]
    },
    {
      id: 'academic-formal',
      name: 'Academic Formal',
      description: 'Traditional academic style',
      shapes: [
        { type: 'rectangle' as const, x: 25, y: 25, width: 792, height: 545, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
        { type: 'rectangle' as const, x: 35, y: 35, width: 772, height: 525, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
        { type: 'rectangle' as const, x: 45, y: 45, width: 752, height: 505, borderColor: '#000000', borderWidth: 1, color: 'transparent' }
      ]
    },
    {
      id: 'creative-wave',
      name: 'Creative Wave',
      description: 'Artistic wave design',
      shapes: [
        { type: 'rectangle' as const, x: 20, y: 20, width: 802, height: 555, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
        { type: 'line' as const, x: 20, y: 100, x2: 822, y2: 120, borderColor: '#000000', borderWidth: 4 },
        { type: 'line' as const, x: 20, y: 475, x2: 822, y2: 455, borderColor: '#000000', borderWidth: 4 }
      ]
    },
    {
      id: 'professional-clean',
      name: 'Professional Clean',
      description: 'Clean professional look',
      shapes: [
        { type: 'rectangle' as const, x: 40, y: 40, width: 762, height: 515, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
        { type: 'line' as const, x: 40, y: 60, x2: 802, y2: 60, borderColor: '#000000', borderWidth: 1 },
        { type: 'line' as const, x: 40, y: 535, x2: 802, y2: 535, borderColor: '#000000', borderWidth: 1 }
      ]
    }
  ];

  const applyFrameStyle = (styleId: string) => {
    const style = frameStyles.find(s => s.id === styleId);
    if (!style) return;

    // REMOVE ALL EXISTING BORDER/FRAME SHAPES
    const nonFrameShapes = template.shapeElements.filter(shape => {
      // Remove shapes that look like borders (rectangles near edges or lines that span width/height)
      if (shape.type === 'rectangle') {
        const isNearEdge = shape.x <= 50 && shape.y <= 50; // Near top-left corner
        const isFullWidth = (shape.width || 0) > template.pageSize.width * 0.8; // Spans most of width
        const isFullHeight = (shape.height || 0) > template.pageSize.height * 0.8; // Spans most of height
        return !(isNearEdge && (isFullWidth || isFullHeight));
      }
      if (shape.type === 'line') {
        const spansWidth = Math.abs((shape.x2 || 0) - shape.x) > template.pageSize.width * 0.8;
        const spansHeight = Math.abs((shape.y2 || 0) - shape.y) > template.pageSize.height * 0.8;
        return !(spansWidth || spansHeight);
      }
      return true; // Keep circles and other shapes
    });

    // ADD NEW FRAME SHAPES
    const newShapes = style.shapes.map(shape => ({
      ...shape,
      id: `${styleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    pushToHistory({
      ...template,
      shapeElements: [...nonFrameShapes, ...newShapes],
    });

    setSelectedFrameStyle(styleId);
  };

  // Clear all frame/border shapes
  const clearAllFrames = () => {
    const nonFrameShapes = template.shapeElements.filter(shape => {
      // Remove shapes that look like borders or corner decorations
      if (shape.type === 'rectangle') {
        const width = shape.width || 0;
        const height = shape.height || 0;
        
        // Check if it's near any corner (within 100px of any edge)
        const isNearTopLeft = shape.x <= 100 && shape.y <= 100;
        const isNearTopRight = shape.x >= template.pageSize.width - 100 - width && shape.y <= 100;
        const isNearBottomLeft = shape.x <= 100 && shape.y >= template.pageSize.height - 100 - height;
        const isNearBottomRight = shape.x >= template.pageSize.width - 100 - width && shape.y >= template.pageSize.height - 100 - height;
        
        const isNearAnyCorner = isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight;
        
        // Also check for full-width or full-height rectangles (borders)
        const isFullWidth = width > template.pageSize.width * 0.8;
        const isFullHeight = height > template.pageSize.height * 0.8;
        
        // Remove if it's near a corner OR if it's a full border
        return !(isNearAnyCorner || isFullWidth || isFullHeight);
      }
      if (shape.type === 'line') {
        const spansWidth = Math.abs((shape.x2 || 0) - shape.x) > template.pageSize.width * 0.8;
        const spansHeight = Math.abs((shape.y2 || 0) - shape.y) > template.pageSize.height * 0.8;
        return !(spansWidth || spansHeight);
      }
      return true; // Keep circles and other shapes
    });

    pushToHistory({
      ...template,
      shapeElements: nonFrameShapes,
    });

    setSelectedFrameStyle('');
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

      // Redirect to day-of-class page after successful save
      router.push(`/ticket/day-of-class/${classType.toLowerCase()}`);
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
    <div className="flex h-full bg-gray-50 overflow-hidden rounded-lg">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white border-r flex flex-col rounded-l-lg">
        <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={template.name}
                  onChange={(e) => pushToHistory({ ...template, name: e.target.value })}
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

              {/* Background Options */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold">Background</Label>
                <div className="mt-2 space-y-2">
                  <div>
                    <Label className="text-xs">Background Type</Label>
                    <Select
                      value={template.background.type}
                      onValueChange={(value) => pushToHistory({
                        ...template,
                        background: { ...template.background, type: value as 'color' | 'image' | 'pdf' }
                      })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="color" className="bg-white hover:bg-gray-50">Color</SelectItem>
                        <SelectItem value="image" className="bg-white hover:bg-gray-50">Image</SelectItem>
                        <SelectItem value="pdf" className="bg-white hover:bg-gray-50">PDF Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {template.background.type === 'color' && (
                    <div>
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={template.background.value || '#FFFFFF'}
                          onChange={(e) => pushToHistory({
                            ...template,
                            background: { ...template.background, value: e.target.value }
                          })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={template.background.value || '#FFFFFF'}
                          onChange={(e) => pushToHistory({
                            ...template,
                            background: { ...template.background, value: e.target.value }
                          })}
                          className="flex-1 h-8 text-xs"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  )}

                  {(template.background.type === 'image' || template.background.type === 'pdf') && (
                    <div>
                      <Label className="text-xs">URL</Label>
                      <Input
                        value={template.background.value || ''}
                        onChange={(e) => pushToHistory({
                          ...template,
                          background: { ...template.background, value: e.target.value }
                        })}
                        placeholder="/path/to/file.jpg"
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
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

          {/* Frame Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frame Styles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">Predefined Styles</Label>
                <Select value={selectedFrameStyle} onValueChange={applyFrameStyle}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Choose a frame style...">
                      {selectedFrameStyle && frameStyles.find(s => s.id === selectedFrameStyle)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64 bg-white border border-gray-200 shadow-lg z-50">
                    {frameStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id} className="py-3 px-3 bg-white hover:bg-gray-50 min-h-[60px]">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900 leading-tight">{style.name}</span>
                          <span className="text-xs text-gray-500 mt-1 leading-tight break-words">{style.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-semibold mb-2 block">Border Line Style</Label>
                <Select value={borderLineStyle} onValueChange={(value) => setBorderLineStyle(value)}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select line style...">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-0.5 bg-black" 
                          style={{
                            borderStyle: borderLineStyle === 'dashed' ? undefined : undefined,
                            backgroundImage: 
                              borderLineStyle === 'dashed' ? 'repeating-linear-gradient(to right, black 0, black 2px, transparent 2px, transparent 4px)' :
                              borderLineStyle === 'dotted' ? 'repeating-linear-gradient(to right, black 0, black 1px, transparent 1px, transparent 2px)' :
                              undefined,
                            borderTop: borderLineStyle === 'double' ? '1px solid black' : undefined,
                            borderBottom: borderLineStyle === 'double' ? '1px solid black' : undefined,
                            height: borderLineStyle === 'double' ? '4px' : undefined,
                            backgroundColor: borderLineStyle === 'double' ? 'transparent' : 'black',
                            boxShadow: 
                              borderLineStyle === 'groove' ? 'inset 0 1px 0 rgba(0,0,0,0.3)' :
                              borderLineStyle === 'ridge' ? '0 1px 0 rgba(0,0,0,0.3)' :
                              undefined
                          }}
                        ></div>
                        <span className="capitalize">{borderLineStyle}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="solid" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-black"></div>
                        <span>Solid</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dashed" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-black" style={{backgroundImage: 'repeating-linear-gradient(to right, black 0, black 2px, transparent 2px, transparent 4px)'}}></div>
                        <span>Dashed</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dotted" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-black" style={{backgroundImage: 'repeating-linear-gradient(to right, black 0, black 1px, transparent 1px, transparent 2px)'}}></div>
                        <span>Dotted</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="double" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1 border-t border-b border-black"></div>
                        <span>Double</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="groove" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-gray-400" style={{boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.3)'}}></div>
                        <span>Groove</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ridge" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-gray-300" style={{boxShadow: '0 1px 0 rgba(0,0,0,0.3)'}}></div>
                        <span>Ridge</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-2 border-t">
                <Label className="text-sm font-semibold mb-2 block">Frame Actions</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={clearAllFrames} className="w-full h-8 text-xs" variant="destructive" size="sm">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All Frames
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-semibold mb-2 block">Quick Frames</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={addTripleBorder} className="w-full h-8 text-xs" variant="outline" size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    Triple Border
                  </Button>
                  <Button onClick={addDoubleBorder} className="w-full h-8 text-xs" variant="outline" size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    Double Border
                  </Button>
                  <Button onClick={addSingleBorder} className="w-full h-8 text-xs" variant="outline" size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    Single Border
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-2 max-h-48 overflow-y-auto">
                <p className="text-gray-600 text-xs">Click to insert variable into selected text element</p>
                {DEFAULT_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="w-full text-left font-mono bg-gray-100 hover:bg-blue-100 p-2 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                    title={`Click to insert {{${v.key}}}`}
                  >
                    <div className="font-semibold text-blue-600">{`{{${v.key}}}`}</div>
                    <div className="text-gray-600 text-xs">{v.label}</div>
                    <div className="text-gray-500 text-xs italic">Example: {v.example}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Copy element:</span>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+C</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paste element:</span>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+V</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delete element:</span>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Supr</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Undo:</span>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Z</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Redo:</span>
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Y</kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 bg-gray-50 overflow-hidden rounded-r-lg">
          <CertificateCanvas
            template={template}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onUpdateElement={updateElement}
            previewMode={previewMode}
            showVariables={showVariables}
          />
        </div>
      </div>

      {/* Right Sidebar - Always visible */}
      {!previewMode && (
        <div className="w-72 bg-white border-l overflow-y-auto flex-shrink-0 rounded-r-lg">
          <div className="p-2">
            {selectedEl ? (
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
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Element Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-6xl mb-4">🖱️</div>
                    <p className="text-sm">Select an element to edit its properties</p>
                    <p className="text-xs mt-2 text-gray-400">Click on any text, image, or shape in the canvas</p>
                  </div>
                </CardContent>
              </Card>
            )}
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
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="Helvetica" className="bg-white hover:bg-gray-50">Helvetica</SelectItem>
            <SelectItem value="Times-Roman" className="bg-white hover:bg-gray-50">Times Roman</SelectItem>
            <SelectItem value="Courier" className="bg-white hover:bg-gray-50">Courier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Font Weight</Label>
        <Select value={element.fontWeight} onValueChange={(value) => onUpdate({ fontWeight: value as 'normal' | 'bold' })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="normal" className="bg-white hover:bg-gray-50">Normal</SelectItem>
            <SelectItem value="bold" className="bg-white hover:bg-gray-50">Bold</SelectItem>
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
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="left" className="bg-white hover:bg-gray-50">Left</SelectItem>
            <SelectItem value="center" className="bg-white hover:bg-gray-50">Center</SelectItem>
            <SelectItem value="right" className="bg-white hover:bg-gray-50">Right</SelectItem>
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
          placeholder="Enter image URL or upload to Cloudinary"
        />
      </div>

      <div>
        <CertificateImageUpload
          onUpload={(url) => onUpdate({ url })}
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

      <div>
        <Label>Border Style</Label>
        <Select value={element.borderStyle || 'solid'} onValueChange={(value) => onUpdate({ borderStyle: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="solid" className="bg-white hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-black"></div>
                <span>Solid</span>
              </div>
            </SelectItem>
            <SelectItem value="dashed" className="bg-white hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-black" style={{backgroundImage: 'repeating-linear-gradient(to right, black 0, black 2px, transparent 2px, transparent 4px)'}}></div>
                <span>Dashed</span>
              </div>
            </SelectItem>
            <SelectItem value="dotted" className="bg-white hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-black" style={{backgroundImage: 'repeating-linear-gradient(to right, black 0, black 1px, transparent 1px, transparent 2px)'}}></div>
                <span>Dotted</span>
              </div>
            </SelectItem>
            <SelectItem value="double" className="bg-white hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 border-t border-b border-black"></div>
                <span>Double</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
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
