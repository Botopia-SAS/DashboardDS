"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Settings, Type, Square, Keyboard, Upload, PenTool, X } from "lucide-react";
import toast from "react-hot-toast";
import { CertificateTemplate, TextElement, ImageElement, ShapeElement, DEFAULT_VARIABLES, PAGE_SIZE_OPTIONS } from "./types";
import { CertificateCanvas } from "./CertificateCanvas";
import { CertificateImageUpload } from "./CertificateImageUpload";
import { SignatureCanvas } from "./SignatureCanvas";

interface CertificateEditorProps {
  classType: string;
  onSave?: (template: CertificateTemplate) => void;
  onChange?: (template: CertificateTemplate) => void;
  initialTemplate?: CertificateTemplate;
  showVariables?: boolean;
  setShowVariables?: (show: boolean) => void;
  previewMode?: boolean;
  setPreviewMode?: (mode: boolean) => void;
  editMode?: boolean;
}

export function CertificateEditor({
  classType,
  onSave,
  onChange,
  initialTemplate,
  showVariables = false,
  // setShowVariables,
  previewMode = false,
  // setPreviewMode
  editMode = false
}: CertificateEditorProps) {
  const router = useRouter();

  // Initialize with a function to ensure certificatesPerPage is properly set
  const [template, setTemplate] = useState<CertificateTemplate>(() => {
    if (initialTemplate) {
      console.log('🎯 Initializing with initialTemplate, certificatesPerPage:', initialTemplate.certificatesPerPage);
      return initialTemplate;
    }
    console.log('🎯 Initializing with default template, certificatesPerPage: 1');
    return {
      name: `${classType} Certificate`,
      classType: classType.toUpperCase(),
      pageSize: { width: 792, height: 612, orientation: 'landscape' },
      certificatesPerPage: 1, // Default to 1 certificate per page
      background: { type: 'color', value: '#FFFFFF' },
      textElements: [],
      imageElements: [],
      shapeElements: [],
      availableVariables: DEFAULT_VARIABLES,
      isDefault: false,
      isActive: true,
    };
  });

  const [selectedElement, setSelectedElement] = useState<{
    type: 'text' | 'image' | 'shape' | null;
    id: string | null;
  }>({ type: null, id: null });

  const [borderLineStyle, setBorderLineStyle] = useState<string>('solid');
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [selectedFrameStyle, setSelectedFrameStyle] = useState<string>('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Store original template state for each orientation to prevent cumulative scaling
  const [orientationStates, setOrientationStates] = useState<{
    landscape: CertificateTemplate | null;
    portrait: CertificateTemplate | null;
  }>({
    landscape: template.pageSize.orientation === 'landscape' ? template : null,
    portrait: template.pageSize.orientation === 'portrait' ? template : null,
  });

  // History for undo/redo
  const [history, setHistory] = useState<CertificateTemplate[]>([template]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Clipboard for copy/paste functionality
  const [clipboard, setClipboard] = useState<{
    type: 'text' | 'image' | 'shape';
    element: TextElement | ImageElement | ShapeElement;
  } | null>(null);

  // Track the initial template to detect when a NEW template is loaded from DB
  const initialTemplateRef = useRef(initialTemplate);
  const hasLoadedFromDb = useRef(false);

  // Normalize template on first load - apply the same logic as orientation change
  const [isInitialized, setIsInitialized] = useState(false);

  // Update template when a NEW initialTemplate is loaded (by checking _id)
  useEffect(() => {
    if (initialTemplate && !isInitialized) {
      console.log('🎯 Initial template load:', {
        hasId: !!initialTemplate._id,
        orientation: initialTemplate.pageSize.orientation,
        dimensions: `${initialTemplate.pageSize.width}x${initialTemplate.pageSize.height}`
      });

      // For templates WITHOUT _id (default BDI template), apply normalization
      if (!initialTemplate._id) {
        // This is a default template - force a "refresh" by toggling orientation logic
        // This ensures proper scaling is applied
        const currentOrientation = initialTemplate.pageSize.orientation;
        const oppositeOrientation: 'portrait' | 'landscape' = currentOrientation === 'landscape' ? 'portrait' : 'landscape';

        // Temporarily swap to opposite orientation
        const tempW = initialTemplate.pageSize.height;
        const tempH = initialTemplate.pageSize.width;
        const scaleX = tempW / initialTemplate.pageSize.width;
        const scaleY = tempH / initialTemplate.pageSize.height;

        const tempTextElements = initialTemplate.textElements.map(el => ({
          ...el,
          x: el.x * scaleX,
          y: el.y * scaleY,
          fontSize: el.fontSize
        }));

        const tempImageElements = initialTemplate.imageElements.map(el => ({
          ...el,
          x: el.x * scaleX,
          y: el.y * scaleY,
          width: el.width * scaleX,
          height: el.height * scaleY
        }));

        const tempShapeElements = initialTemplate.shapeElements.map(el => {
          const scaled: ShapeElement = {
            ...el,
            x: el.x * scaleX,
            y: el.y * scaleY
          };
          if (el.width) scaled.width = el.width * scaleX;
          if (el.height) scaled.height = el.height * scaleY;
          if (el.x2) scaled.x2 = el.x2 * scaleX;
          if (el.y2) scaled.y2 = el.y2 * scaleY;
          if (el.radius) scaled.radius = el.radius * Math.min(scaleX, scaleY);
          if (el.borderWidth) scaled.borderWidth = el.borderWidth;
          return scaled;
        });

        // Save both states in orientationStates
        const tempTemplate = {
          ...initialTemplate,
          pageSize: {
            width: tempW,
            height: tempH,
            orientation: oppositeOrientation
          },
          textElements: tempTextElements,
          imageElements: tempImageElements,
          shapeElements: tempShapeElements
        };

        setOrientationStates({
          landscape: currentOrientation === 'landscape' ? initialTemplate : tempTemplate,
          portrait: currentOrientation === 'portrait' ? initialTemplate : tempTemplate
        });

        setTemplate(initialTemplate);
        setHistory([initialTemplate]);
        setHistoryIndex(0);
        initialTemplateRef.current = initialTemplate;
        setIsInitialized(true);
        console.log('✅ Default template initialized with orientation states');
      } else {
        // Template with _id (from database)
        const currentId = initialTemplateRef.current?._id;
        const newId = initialTemplate._id;

        if (!hasLoadedFromDb.current || currentId !== newId) {
          console.log('✅ Database template loaded');
          setTemplate(initialTemplate);
          setHistory([initialTemplate]);
          setHistoryIndex(0);
          initialTemplateRef.current = initialTemplate;
          hasLoadedFromDb.current = true;
          setIsInitialized(true);
        }
      }
    }
  }, [initialTemplate, isInitialized]);

  // Update the saved orientation state whenever template changes
  // This ensures changes persist across orientation switches
  useEffect(() => {
    const currentOrientation = template.pageSize.orientation;
    const otherOrientation = currentOrientation === 'landscape' ? 'portrait' : 'landscape';
    const otherState = orientationStates[otherOrientation];

    // Always update current orientation state
    const updatedStates: typeof orientationStates = {
      ...orientationStates,
      [currentOrientation]: template
    };

    // If the other orientation already has a state, synchronize element changes to it
    if (otherState) {
      // Calculate scale factors for the other orientation
      const currentW = template.pageSize.width;
      const currentH = template.pageSize.height;
      const otherW = otherState.pageSize.width;
      const otherH = otherState.pageSize.height;
      const scaleX = otherW / currentW;
      const scaleY = otherH / currentH;

      // Sync all elements to the other orientation with proper scaling
      const syncedTextElements = template.textElements.map(el => ({
        ...el,
        x: el.x * scaleX,
        y: el.y * scaleY,
        // Keep font size proportional but don't scale too much
        fontSize: el.fontSize
      }));

      const syncedImageElements = template.imageElements.map(el => ({
        ...el,
        x: el.x * scaleX,
        y: el.y * scaleY,
        width: el.width * scaleX,
        height: el.height * scaleY
      }));

      const syncedShapeElements = template.shapeElements.map(el => {
        const synced: ShapeElement = {
          ...el,
          x: el.x * scaleX,
          y: el.y * scaleY
        };

        if (el.width) synced.width = el.width * scaleX;
        if (el.height) synced.height = el.height * scaleY;
        if (el.x2) synced.x2 = el.x2 * scaleX;
        if (el.y2) synced.y2 = el.y2 * scaleY;
        if (el.radius) synced.radius = el.radius * Math.min(scaleX, scaleY);
        if (el.borderWidth) synced.borderWidth = el.borderWidth * Math.min(scaleX, scaleY);

        return synced;
      });

      updatedStates[otherOrientation] = {
        ...otherState,
        textElements: syncedTextElements,
        imageElements: syncedImageElements,
        shapeElements: syncedShapeElements,
        background: template.background // Sync background too
      };
    }

    setOrientationStates(updatedStates);
  }, [template]);

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

  // Add Signature Element
  const addSignatureElement = () => {
    setShowSignatureModal(true);
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

  // Quick frame functions - REPLACE existing frames AND remove background image
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

        // Also remove lines that are positioned near top or bottom edges (decorative corner lines)
        const isHorizontalLine = Math.abs((shape.y2 || 0) - shape.y) < 5; // Nearly horizontal
        const isNearTopEdge = shape.y <= 50 || (shape.y2 && shape.y2 <= 50);
        const isNearBottomEdge = shape.y >= template.pageSize.height - 50 || (shape.y2 && shape.y2 >= template.pageSize.height - 50);
        const isEdgeLine = isHorizontalLine && (isNearTopEdge || isNearBottomEdge);

        return !(spansWidth || spansHeight || isEdgeLine);
      }
      return true;
    });

    const borders = [
      { id: `border-outer-${Date.now()}`, type: 'rectangle' as const, x: 20, y: 20, width: template.pageSize.width - 40, height: template.pageSize.height - 40, borderColor: borderColor, borderWidth: 6, borderStyle: borderLineStyle, color: 'transparent' },
      { id: `border-middle-${Date.now()}`, type: 'rectangle' as const, x: 30, y: 30, width: template.pageSize.width - 60, height: template.pageSize.height - 60, borderColor: borderColor, borderWidth: 4, borderStyle: borderLineStyle, color: 'transparent' },
      { id: `border-inner-${Date.now()}`, type: 'rectangle' as const, x: 40, y: 40, width: template.pageSize.width - 80, height: template.pageSize.height - 80, borderColor: borderColor, borderWidth: 2, borderStyle: borderLineStyle, color: 'transparent' }
    ];

    pushToHistory({
      ...template,
      background: { type: 'color', value: '#FFFFFF' }, // Remove background image
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

        // Also remove lines that are positioned near top or bottom edges (decorative corner lines)
        const isHorizontalLine = Math.abs((shape.y2 || 0) - shape.y) < 5; // Nearly horizontal
        const isNearTopEdge = shape.y <= 50 || (shape.y2 && shape.y2 <= 50);
        const isNearBottomEdge = shape.y >= template.pageSize.height - 50 || (shape.y2 && shape.y2 >= template.pageSize.height - 50);
        const isEdgeLine = isHorizontalLine && (isNearTopEdge || isNearBottomEdge);

        return !(spansWidth || spansHeight || isEdgeLine);
      }
      return true;
    });

    const borders = [
      { id: `border-outer-${Date.now()}`, type: 'rectangle' as const, x: 20, y: 20, width: template.pageSize.width - 40, height: template.pageSize.height - 40, borderColor: borderColor, borderWidth: 4, borderStyle: borderLineStyle, color: 'transparent' },
      { id: `border-inner-${Date.now()}`, type: 'rectangle' as const, x: 30, y: 30, width: template.pageSize.width - 60, height: template.pageSize.height - 60, borderColor: borderColor, borderWidth: 2, borderStyle: borderLineStyle, color: 'transparent' }
    ];

    pushToHistory({
      ...template,
      background: { type: 'color', value: '#FFFFFF' }, // Remove background image
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

        // Also remove lines that are positioned near top or bottom edges (decorative corner lines)
        const isHorizontalLine = Math.abs((shape.y2 || 0) - shape.y) < 5; // Nearly horizontal
        const isNearTopEdge = shape.y <= 50 || (shape.y2 && shape.y2 <= 50);
        const isNearBottomEdge = shape.y >= template.pageSize.height - 50 || (shape.y2 && shape.y2 >= template.pageSize.height - 50);
        const isEdgeLine = isHorizontalLine && (isNearTopEdge || isNearBottomEdge);

        return !(spansWidth || spansHeight || isEdgeLine);
      }
      return true;
    });

    const border = {
      id: `border-${Date.now()}`,
      type: 'rectangle' as const,
      x: 20,
      y: 20,
      width: template.pageSize.width - 40,
      height: template.pageSize.height - 40,
      borderColor: borderColor,
      borderWidth: 3,
      borderStyle: borderLineStyle,
      color: 'transparent'
    };

    pushToHistory({
      ...template,
      background: { type: 'color', value: '#FFFFFF' }, // Remove background image
      shapeElements: [...nonFrameShapes, border],
    });
    setSelectedFrameStyle('quick-single');
  };

  // Text Template Functions - Only replace text elements, keep background and shapes
  // Base reference size: Carta Portrait (612x792)
  const applySimpleTextTemplate = () => {
    // Always use landscape orientation and 1 certificate per page for text templates
    const w = 792; // Landscape width
    const h = 612; // Landscape height
    const baseW = 612; // Carta width
    const baseH = 792; // Carta height
    const scaleX = w / baseW;
    const scaleY = h / baseH;
    const fontScale = Math.min(scaleX, scaleY);

    pushToHistory({
      ...template,
      pageSize: { width: 792, height: 612, orientation: 'landscape' },
      certificatesPerPage: 1, // Always set to 1 certificate per page
      textElements: [
        { id: `text-${Date.now()}-1`, content: 'CERTIFICATE OF COMPLETION', x: w/2, y: 80*scaleY, fontSize: 28*fontScale, fontFamily: 'Times New Roman', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-2`, content: 'This certificate validates that', x: w/2, y: 140*scaleY, fontSize: 14*fontScale, fontFamily: 'Arial', color: '#333333', align: 'center' },
        { id: `text-${Date.now()}-3`, content: '{{firstName}} {{lastName}}', x: w/2, y: 180*scaleY, fontSize: 24*fontScale, fontFamily: 'Times New Roman', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-4`, content: 'License Number: {{licenseNumber}}', x: w/2, y: 220*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#666666', align: 'center' },
        { id: `text-${Date.now()}-5`, content: 'has successfully completed a', x: w/2, y: 270*scaleY, fontSize: 14*fontScale, fontFamily: 'Arial', color: '#333333', align: 'center' },
        { id: `text-${Date.now()}-6`, content: '{{classTitle}}', x: w/2, y: 310*scaleY, fontSize: 20*fontScale, fontFamily: 'Times New Roman', fontWeight: 'bold', color: '#1a5490', align: 'center', italic: true },
        { id: `text-${Date.now()}-7`, content: 'Course Duration: {{courseTime}}', x: w/2, y: 350*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#666666', align: 'center' },
        { id: `text-${Date.now()}-8`, content: 'Completion Date: {{courseDate}}', x: w/2, y: 400*scaleY, fontSize: 14*fontScale, fontFamily: 'Arial', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-9`, content: 'Certificate No: {{certn}}', x: w/2, y: 430*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#999999', align: 'center' },
        { id: `text-${Date.now()}-10`, content: 'Location: {{address}}', x: w/2, y: 460*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#999999', align: 'center' },
      ],
      imageElements: [], // Clear all images and signatures
      shapeElements: [], // Clear all shapes (including checkboxes)
      background: template.background // Keep background
    });
  };

  const applyGovernmentStyleTemplate = () => {
    // Import and use the GOV template
    import('@/lib/defaultTemplates/govTemplate').then(({ getGovTemplate }) => {
      const govTemplate = getGovTemplate(template.classType);
      
      pushToHistory({
        ...template,
        ...govTemplate,
        classType: template.classType, // Keep current class type
        background: template.background, // Keep existing background
        shapeElements: govTemplate.shapeElements, // Replace shapes completely (don't merge)
      });
      
      toast.success('Government Form template applied successfully!');
    }).catch(error => {
      console.error('Error loading GOV template:', error);
      toast.error('Failed to load Government Form template');
    });
  };

  const applyElegantTemplate = () => {
    // Always use landscape orientation and 1 certificate per page for text templates
    const w = 792; // Landscape width
    const h = 612; // Landscape height
    const baseW = 612;
    const baseH = 792;
    const scaleX = w / baseW;
    const scaleY = h / baseH;
    const fontScale = Math.min(scaleX, scaleY);

    pushToHistory({
      ...template,
      pageSize: { width: 792, height: 612, orientation: 'landscape' },
      certificatesPerPage: 1, // Always set to 1 certificate per page
      textElements: [
        { id: `text-${Date.now()}-1`, content: 'Certificate of Achievement', x: w/2, y: 80*scaleY, fontSize: 32*fontScale, fontFamily: 'Times New Roman', fontWeight: 'bold', color: '#2c3e50', align: 'center', italic: true },
        { id: `text-${Date.now()}-2`, content: 'PROUDLY PRESENTED TO', x: w/2, y: 160*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#7f8c8d', align: 'center' },
        { id: `text-${Date.now()}-3`, content: '{{firstName}} {{lastName}}', x: w/2, y: 210*scaleY, fontSize: 28*fontScale, fontFamily: 'Times New Roman', fontWeight: 'bold', color: '#1a5490', align: 'center' },
        { id: `text-${Date.now()}-4`, content: 'for successful completion of', x: w/2, y: 260*scaleY, fontSize: 14*fontScale, fontFamily: 'Arial', color: '#34495e', align: 'center' },
        { id: `text-${Date.now()}-5`, content: '{{classTitle}}', x: w/2, y: 300*scaleY, fontSize: 18*fontScale, fontFamily: 'Times New Roman', color: '#2c3e50', align: 'center', italic: true },
        { id: `text-${Date.now()}-6`, content: 'Completed on {{courseDate}} | Duration: {{courseTime}}', x: w/2, y: 350*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#7f8c8d', align: 'center' },
        { id: `text-${Date.now()}-7`, content: 'License: {{licenseNumber}}', x: 100*scaleX, y: h - 60*scaleY, fontSize: 10*fontScale, fontFamily: 'Arial', color: '#95a5a6', align: 'left' },
        { id: `text-${Date.now()}-8`, content: 'Certificate #{{certn}}', x: w - 100*scaleX, y: h - 60*scaleY, fontSize: 10*fontScale, fontFamily: 'Arial', color: '#95a5a6', align: 'right' },
        { id: `text-${Date.now()}-9`, content: '{{address}}', x: w/2, y: h - 60*scaleY, fontSize: 10*fontScale, fontFamily: 'Arial', color: '#95a5a6', align: 'center' },
      ],
      imageElements: [], // Clear all images and signatures
      shapeElements: [], // Clear all shapes (including checkboxes)
      background: template.background // Keep background
    });
  };

  const applyModernTemplate = () => {
    // Always use landscape orientation and 1 certificate per page for text templates
    const w = 792; // Landscape width
    const h = 612; // Landscape height
    const baseW = 612;
    const baseH = 792;
    const scaleX = w / baseW;
    const scaleY = h / baseH;
    const fontScale = Math.min(scaleX, scaleY);

    pushToHistory({
      ...template,
      pageSize: { width: 792, height: 612, orientation: 'landscape' },
      certificatesPerPage: 1, // Always set to 1 certificate per page
      textElements: [
        { id: `text-${Date.now()}-1`, content: 'CERTIFICATE', x: w/2, y: 50*scaleY, fontSize: 36*fontScale, fontFamily: 'Arial', fontWeight: 'bold', color: '#FFFFFF', align: 'center' },
        { id: `text-${Date.now()}-2`, content: 'OF COMPLETION', x: w/2, y: 85*scaleY, fontSize: 18*fontScale, fontFamily: 'Arial', color: '#e8f4f8', align: 'center' },
        { id: `text-${Date.now()}-3`, content: '{{firstName}} {{lastName}}', x: w/2, y: 200*scaleY, fontSize: 32*fontScale, fontFamily: 'Arial', fontWeight: 'bold', color: '#1a5490', align: 'center' },
        { id: `text-${Date.now()}-4`, content: 'License: {{licenseNumber}}', x: w/2, y: 240*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#7f8c8d', align: 'center' },
        { id: `text-${Date.now()}-5`, content: 'has successfully completed', x: w/2, y: 290*scaleY, fontSize: 14*fontScale, fontFamily: 'Arial', color: '#2c3e50', align: 'center' },
        { id: `text-${Date.now()}-6`, content: '{{classTitle}}', x: w/2, y: 330*scaleY, fontSize: 20*fontScale, fontFamily: 'Arial', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-7`, content: 'Course Duration: {{courseTime}} | Completion: {{courseDate}}', x: w/2, y: 380*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#34495e', align: 'center' },
        { id: `text-${Date.now()}-8`, content: 'Certificate #{{certn}}', x: w/2, y: h - 35*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#FFFFFF', align: 'center' },
        { id: `text-${Date.now()}-9`, content: '{{address}}', x: w/2, y: h - 55*scaleY, fontSize: 10*fontScale, fontFamily: 'Arial', color: '#ecf0f1', align: 'center' },
      ],
      imageElements: [], // Clear all images and signatures
      shapeElements: [], // Clear all shapes (including checkboxes)
      background: template.background // Keep background
    });
  };

  const applyProfessionalTemplate = () => {
    // Always use landscape orientation and 1 certificate per page for text templates
    const w = 792; // Landscape width
    const h = 612; // Landscape height
    const baseW = 612;
    const baseH = 792;
    const scaleX = w / baseW;
    const scaleY = h / baseH;
    const fontScale = Math.min(scaleX, scaleY);

    pushToHistory({
      ...template,
      pageSize: { width: 792, height: 612, orientation: 'landscape' },
      certificatesPerPage: 1, // Always set to 1 certificate per page
      textElements: [
        { id: `text-${Date.now()}-1`, content: 'CERTIFICATE', x: 80*scaleX, y: 100*scaleY, fontSize: 28*fontScale, fontFamily: 'Arial', fontWeight: 'bold', color: '#1a5490', align: 'left' },
        { id: `text-${Date.now()}-2`, content: 'of Course Completion', x: 80*scaleX, y: 135*scaleY, fontSize: 16*fontScale, fontFamily: 'Arial', color: '#7f8c8d', align: 'left' },
        { id: `text-${Date.now()}-3`, content: 'This is to certify that', x: 80*scaleX, y: 200*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#2c3e50', align: 'left' },
        { id: `text-${Date.now()}-4`, content: '{{firstName}} {{lastName}}', x: 80*scaleX, y: 240*scaleY, fontSize: 24*fontScale, fontFamily: 'Times New Roman', fontWeight: 'bold', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-5`, content: 'License Number: {{licenseNumber}}', x: 80*scaleX, y: 275*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#7f8c8d', align: 'left' },
        { id: `text-${Date.now()}-6`, content: 'has successfully completed the following course:', x: 80*scaleX, y: 320*scaleY, fontSize: 12*fontScale, fontFamily: 'Arial', color: '#2c3e50', align: 'left' },
        { id: `text-${Date.now()}-7`, content: '{{classTitle}}', x: 80*scaleX, y: 360*scaleY, fontSize: 18*fontScale, fontFamily: 'Arial', fontWeight: 'bold', color: '#1a5490', align: 'left' },
        { id: `text-${Date.now()}-8`, content: 'Course Duration: {{courseTime}}', x: 80*scaleX, y: 400*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#34495e', align: 'left' },
        { id: `text-${Date.now()}-9`, content: 'Date of Completion: {{courseDate}}', x: 80*scaleX, y: 430*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#34495e', align: 'left' },
        { id: `text-${Date.now()}-10`, content: 'Location: {{address}}', x: 80*scaleX, y: 460*scaleY, fontSize: 11*fontScale, fontFamily: 'Arial', color: '#34495e', align: 'left' },
        { id: `text-${Date.now()}-11`, content: 'Certificate Number: {{certn}}', x: w - 80*scaleX, y: h - 70*scaleY, fontSize: 10*fontScale, fontFamily: 'Arial', color: '#95a5a6', align: 'right' },
      ],
      imageElements: [], // Clear all images and signatures
      shapeElements: template.shapeElements, // Keep frames/borders
      background: template.background // Keep background
    });
  };

  const applyBDIDefaultTemplate = () => {
    // Always use landscape orientation and 1 certificate per page for text templates
    const w = 792; // Landscape width
    const h = 612; // Landscape height
    // BDI template is designed for landscape 792x612
    const baseW = 792;
    const baseH = 612;
    const scaleX = w / baseW;
    const scaleY = h / baseH;
    const fontScale = Math.min(scaleX, scaleY);

    pushToHistory({
      ...template,
      pageSize: { width: 792, height: 612, orientation: 'landscape' },
      certificatesPerPage: 1, // Always set to 1 certificate per page
      textElements: [
        // Header
        { id: `text-${Date.now()}-1`, content: 'AFFORDABLE DRIVING TRAFFIC SCHOOL', x: w/2, y: 75*scaleY, fontSize: 16*fontScale, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-2`, content: 'CERTIFICATE OF COMPLETION', x: w/2, y: 110*scaleY, fontSize: 14*fontScale, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-3`, content: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406', x: w/2, y: 135*scaleY, fontSize: 10*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-4`, content: '561-969-0150 / 561-330-7007', x: w/2, y: 148*scaleY, fontSize: 10*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        // Body
        { id: `text-${Date.now()}-5`, content: 'This Certifies that the person named below has successfully completed the Florida Dept.', x: w/2, y: 164*scaleY, fontSize: 10*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        { id: `text-${Date.now()}-6`, content: 'Highway Safety and Motor Vehicles "Drive Safety & Driver Improvement Course"', x: w/2, y: 188*scaleY, fontSize: 10*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'center' },
        // Left column
        { id: `text-${Date.now()}-7`, content: 'Citation No:', x: 85*scaleX, y: 235*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-8`, content: 'Driver License Number:', x: 85*scaleX, y: 258*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-9`, content: '{{licenseNumber}}', x: 310*scaleX, y: 258*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-10`, content: 'Course Completion Date:', x: 85*scaleX, y: 281*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-11`, content: '{{courseDate}}', x: 310*scaleX, y: 281*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-12`, content: 'Name:', x: 85*scaleX, y: 304*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-13`, content: '{{firstName}} {{lastName}}', x: 310*scaleX, y: 304*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-14`, content: 'Course Location:', x: 85*scaleX, y: 327*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-15`, content: '{{address}}', x: 310*scaleX, y: 327*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'left' },
        // Right side
        { id: `text-${Date.now()}-16`, content: 'Certificate #:', x: 555*scaleX, y: 235*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-17`, content: '{{certn}}', x: 650*scaleX, y: 235*scaleY, fontSize: 11*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        // Footer
        { id: `text-${Date.now()}-18`, content: 'N/A', x: 85*scaleX, y: h - 67*scaleY, fontSize: 9*fontScale, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-19`, content: 'AFFORDABLE DRIVING INSTRUCTOR', x: 85*scaleX, y: h - 55*scaleY, fontSize: 9*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-20`, content: 'LICENSE #', x: w - 202*scaleX, y: h - 67*scaleY, fontSize: 9*fontScale, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#000000', align: 'left' },
        { id: `text-${Date.now()}-21`, content: 'AFFORDABLE DRIVING', x: w - 202*scaleX, y: h - 55*scaleY, fontSize: 9*fontScale, fontFamily: 'Helvetica', color: '#000000', align: 'left' },
      ],
      imageElements: [], // Clear all images and signatures
      shapeElements: [], // Clear all shapes (including checkboxes)
      background: template.background // Keep background
    });
  };

  // Predefined frame styles - Dynamic based on page size
  const getFrameStyles = () => {
    const w = template.pageSize.width;
    const h = template.pageSize.height;

    return [
      {
        id: 'classic-triple',
        name: 'Classic Triple Border',
        description: 'Traditional certificate style',
        shapes: [
          { type: 'rectangle' as const, x: 20, y: 20, width: w - 40, height: h - 40, borderColor: '#000000', borderWidth: 6, color: 'transparent' },
          { type: 'rectangle' as const, x: 30, y: 30, width: w - 60, height: h - 60, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
          { type: 'rectangle' as const, x: 40, y: 40, width: w - 80, height: h - 80, borderColor: '#000000', borderWidth: 2, color: 'transparent' }
        ]
      },
      {
        id: 'elegant-double',
        name: 'Elegant Double',
        description: 'Clean double border',
        shapes: [
          { type: 'rectangle' as const, x: 15, y: 15, width: w - 30, height: h - 30, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
          { type: 'rectangle' as const, x: 25, y: 25, width: w - 50, height: h - 50, borderColor: '#000000', borderWidth: 2, color: 'transparent' }
        ]
      },
      {
        id: 'modern-single',
        name: 'Modern Single',
        description: 'Minimalist single border',
        shapes: [
          { type: 'rectangle' as const, x: 25, y: 25, width: w - 50, height: h - 50, borderColor: '#000000', borderWidth: 4, color: 'transparent' }
        ]
      },
      {
        id: 'decorative-corners',
        name: 'Decorative Corners',
        description: 'Corner accent design',
        shapes: [
          { type: 'rectangle' as const, x: 20, y: 20, width: w - 40, height: h - 40, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
          { type: 'rectangle' as const, x: 20, y: 20, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
          { type: 'rectangle' as const, x: w - 100, y: 20, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
          { type: 'rectangle' as const, x: 20, y: h - 100, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
          { type: 'rectangle' as const, x: w - 100, y: h - 100, width: 80, height: 80, borderColor: '#000000', borderWidth: 4, color: 'transparent' }
        ]
      },
      {
        id: 'thick-border',
        name: 'Thick Border',
        description: 'Bold single thick border',
        shapes: [
          { type: 'rectangle' as const, x: 10, y: 10, width: w - 20, height: h - 20, borderColor: '#000000', borderWidth: 8, color: 'transparent' },
          { type: 'rectangle' as const, x: 20, y: 20, width: w - 40, height: h - 40, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
          { type: 'rectangle' as const, x: 30, y: 30, width: w - 60, height: h - 60, borderColor: '#000000', borderWidth: 1, color: 'transparent' }
        ]
      },
      {
        id: 'vintage-ornate',
        name: 'Vintage Ornate',
        description: 'Classic ornate style',
        shapes: [
          { type: 'rectangle' as const, x: 15, y: 15, width: w - 30, height: h - 30, borderColor: '#000000', borderWidth: 5, color: 'transparent' },
          { type: 'rectangle' as const, x: 25, y: 25, width: w - 50, height: h - 50, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
          { type: 'rectangle' as const, x: 35, y: 35, width: w - 70, height: h - 70, borderColor: '#000000', borderWidth: 1, color: 'transparent' }
        ]
      },
      {
        id: 'tech-modern',
        name: 'Tech Modern',
        description: 'Contemporary tech style',
        shapes: [
          { type: 'rectangle' as const, x: 30, y: 30, width: w - 60, height: h - 60, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
          { type: 'line' as const, x: 30, y: 30, x2: 130, y2: 30, borderColor: '#000000', borderWidth: 6 },
          { type: 'line' as const, x: w - 100, y: 30, x2: w, y2: 30, borderColor: '#000000', borderWidth: 6 },
          { type: 'line' as const, x: 30, y: h - 30, x2: 130, y2: h - 30, borderColor: '#000000', borderWidth: 6 },
          { type: 'line' as const, x: w - 100, y: h - 30, x2: w, y2: h - 30, borderColor: '#000000', borderWidth: 6 }
        ]
      },
      {
        id: 'academic-formal',
        name: 'Academic Formal',
        description: 'Traditional academic style',
        shapes: [
          { type: 'rectangle' as const, x: 25, y: 25, width: w - 50, height: h - 50, borderColor: '#000000', borderWidth: 4, color: 'transparent' },
          { type: 'rectangle' as const, x: 35, y: 35, width: w - 70, height: h - 70, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
          { type: 'rectangle' as const, x: 45, y: 45, width: w - 90, height: h - 90, borderColor: '#000000', borderWidth: 1, color: 'transparent' }
        ]
      },
      {
        id: 'creative-wave',
        name: 'Creative Wave',
        description: 'Artistic wave design',
        shapes: [
          { type: 'rectangle' as const, x: 20, y: 20, width: w - 40, height: h - 40, borderColor: '#000000', borderWidth: 3, color: 'transparent' },
          { type: 'line' as const, x: 20, y: 100, x2: w - 20, y2: 120, borderColor: '#000000', borderWidth: 4 },
          { type: 'line' as const, x: 20, y: h - 120, x2: w - 20, y2: h - 100, borderColor: '#000000', borderWidth: 4 }
        ]
      },
      {
        id: 'professional-clean',
        name: 'Professional Clean',
        description: 'Clean professional look',
        shapes: [
          { type: 'rectangle' as const, x: 40, y: 40, width: w - 80, height: h - 80, borderColor: '#000000', borderWidth: 2, color: 'transparent' },
          { type: 'line' as const, x: 40, y: 60, x2: w - 40, y2: 60, borderColor: '#000000', borderWidth: 1 },
          { type: 'line' as const, x: 40, y: h - 60, x2: w - 40, y2: h - 60, borderColor: '#000000', borderWidth: 1 }
        ]
      },
      {
        id: 'certificate-classic',
        name: 'Certificate Classic',
        description: 'Formal certificate with decorative borders',
        shapes: [
          // Top decorative band (peach/orange)
          { type: 'rectangle' as const, x: 0, y: 0, width: w, height: 40, borderColor: '#FFB366', borderWidth: 0, color: '#FFB366' },
          // Bottom decorative band (peach/orange)
          { type: 'rectangle' as const, x: 0, y: h - 40, width: w, height: 40, borderColor: '#FFB366', borderWidth: 0, color: '#FFB366' },
          // Outer border
          { type: 'rectangle' as const, x: 20, y: 20, width: w - 40, height: h - 40, borderColor: '#FFB366', borderWidth: 8, color: 'transparent' },
          // Middle decorative border
          { type: 'rectangle' as const, x: 35, y: 35, width: w - 70, height: h - 70, borderColor: '#FFB366', borderWidth: 4, color: 'transparent' },
          // Inner border
          { type: 'rectangle' as const, x: 45, y: 45, width: w - 90, height: h - 90, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          // Decorative corner elements (top-left)
          { type: 'circle' as const, x: 25, y: 25, radius: 8, borderColor: '#FFB366', borderWidth: 3, color: 'transparent' },
          { type: 'circle' as const, x: 35, y: 25, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          { type: 'circle' as const, x: 25, y: 35, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          // Decorative corner elements (top-right)
          { type: 'circle' as const, x: w - 25, y: 25, radius: 8, borderColor: '#FFB366', borderWidth: 3, color: 'transparent' },
          { type: 'circle' as const, x: w - 35, y: 25, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          { type: 'circle' as const, x: w - 25, y: 35, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          // Decorative corner elements (bottom-left)
          { type: 'circle' as const, x: 25, y: h - 25, radius: 8, borderColor: '#FFB366', borderWidth: 3, color: 'transparent' },
          { type: 'circle' as const, x: 35, y: h - 25, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          { type: 'circle' as const, x: 25, y: h - 35, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          // Decorative corner elements (bottom-right)
          { type: 'circle' as const, x: w - 25, y: h - 25, radius: 8, borderColor: '#FFB366', borderWidth: 3, color: 'transparent' },
          { type: 'circle' as const, x: w - 35, y: h - 25, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' },
          { type: 'circle' as const, x: w - 25, y: h - 35, radius: 6, borderColor: '#FFB366', borderWidth: 2, color: 'transparent' }
        ]
      },
      {
        id: 'modern-geometric',
        name: 'Modern Geometric',
        description: 'Contemporary geometric border design',
        shapes: [
          { type: 'rectangle' as const, x: 30, y: 30, width: w - 60, height: h - 60, borderColor: '#2C3E50', borderWidth: 3, color: 'transparent' },
          { type: 'line' as const, x: 30, y: 30, x2: 80, y2: 30, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: w - 80, y: 30, x2: w - 30, y2: 30, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: 30, y: h - 30, x2: 80, y2: h - 30, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: w - 80, y: h - 30, x2: w - 30, y2: h - 30, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: 30, y: 30, x2: 30, y2: 80, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: 30, y: h - 80, x2: 30, y2: h - 30, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: w - 30, y: 30, x2: w - 30, y2: 80, borderColor: '#3498DB', borderWidth: 5 },
          { type: 'line' as const, x: w - 30, y: h - 80, x2: w - 30, y2: h - 30, borderColor: '#3498DB', borderWidth: 5 }
        ]
      }
    ];
  };

  const frameStyles = getFrameStyles();

  const applyFrameStyle = (styleId: string) => {
    const style = frameStyles.find(s => s.id === styleId);
    if (!style) return;

    // FIRST: Use the same comprehensive cleaning logic as clearAllFrames
    // This ensures ALL frames/borders are removed before applying the new style
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

        // Also remove lines that are positioned near top or bottom edges (decorative corner lines)
        const isHorizontalLine = Math.abs((shape.y2 || 0) - shape.y) < 5; // Nearly horizontal
        const isNearTopEdge = shape.y <= 50 || (shape.y2 && shape.y2 <= 50);
        const isNearBottomEdge = shape.y >= template.pageSize.height - 50 || (shape.y2 && shape.y2 >= template.pageSize.height - 50);
        const isEdgeLine = isHorizontalLine && (isNearTopEdge || isNearBottomEdge);

        return !(spansWidth || spansHeight || isEdgeLine);
      }
      if (shape.type === 'circle') {
        // Remove circles that are near corners (decorative elements)
        const isNearTopLeft = shape.x <= 100 && shape.y <= 100;
        const isNearTopRight = shape.x >= template.pageSize.width - 100 && shape.y <= 100;
        const isNearBottomLeft = shape.x <= 100 && shape.y >= template.pageSize.height - 100;
        const isNearBottomRight = shape.x >= template.pageSize.width - 100 && shape.y >= template.pageSize.height - 100;

        const isNearAnyCorner = isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight;

        // Remove if it's a decorative corner circle
        return !isNearAnyCorner;
      }
      return true; // Keep other shapes
    });

    // ADD NEW FRAME SHAPES
    const newShapes = style.shapes.map(shape => ({
      ...shape,
      id: `${styleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    // Prepare the updated template
    const updatedTemplate: CertificateTemplate = {
      ...template,
      shapeElements: [...nonFrameShapes, ...newShapes],
    };

    // If the style includes a background, apply it
    if ((style as any).background) {
      updatedTemplate.background = (style as any).background;
    }

    pushToHistory(updatedTemplate);

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

        // Also remove lines that are positioned near top or bottom edges (decorative corner lines)
        const isHorizontalLine = Math.abs((shape.y2 || 0) - shape.y) < 5; // Nearly horizontal
        const isNearTopEdge = shape.y <= 50 || (shape.y2 && shape.y2 <= 50);
        const isNearBottomEdge = shape.y >= template.pageSize.height - 50 || (shape.y2 && shape.y2 >= template.pageSize.height - 50);
        const isEdgeLine = isHorizontalLine && (isNearTopEdge || isNearBottomEdge);

        return !(spansWidth || spansHeight || isEdgeLine);
      }
      if (shape.type === 'circle') {
        // Remove circles that are near corners (decorative elements)
        const isNearTopLeft = shape.x <= 100 && shape.y <= 100;
        const isNearTopRight = shape.x >= template.pageSize.width - 100 && shape.y <= 100;
        const isNearBottomLeft = shape.x <= 100 && shape.y >= template.pageSize.height - 100;
        const isNearBottomRight = shape.x >= template.pageSize.width - 100 && shape.y >= template.pageSize.height - 100;

        const isNearAnyCorner = isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight;

        // Remove if it's a decorative corner circle
        return !isNearAnyCorner;
      }
      return true; // Keep other shapes
    });

    pushToHistory({
      ...template,
      shapeElements: nonFrameShapes,
    });

    setSelectedFrameStyle('');
  };

  // Signature functions
  const handleSignatureUpload = async (imageData: string) => {
    try {
      setSignatureImage(imageData);
      
      // Add as a new image element
      const newElement: ImageElement = {
        id: `signature-${Date.now()}`,
        url: imageData,
        x: 100,
        y: 500,
        width: 150,
        height: 50,
      };

      pushToHistory({
        ...template,
        imageElements: [...template.imageElements, newElement],
      });

      setSelectedElement({ type: 'image', id: newElement.id });
      
      toast.success("Signature uploaded successfully!");
      setShowSignatureModal(false);
      setIsDrawingMode(false);
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast.error("Failed to upload signature. Please try again.");
    }
  };

  const clearSignature = () => {
    setSignatureImage(null);
    const updatedTextElements = template.textElements.map(element => {
      if (element.id === 'text-instructor-name' || (element as any).type === 'image') {
        return {
          ...element,
          content: 'N/A',
          type: 'text' as const,
          imageData: undefined,
          width: undefined,
          height: undefined
        };
      }
      return element;
    });
    
    pushToHistory({
      ...template,
      textElements: updatedTextElements
    });
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
      <div className={`${editMode ? 'w-80' : 'w-96'} bg-white border-r flex flex-col rounded-l-lg transition-all duration-300`}>
        {editMode ? (
          <Tabs defaultValue="settings" className="flex flex-col h-full">
            <div className="px-2 pt-2">
              <TabsList className="grid w-full grid-cols-4 h-10">
                <TabsTrigger value="settings" className="text-xs px-1">
                  <Settings className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="elements" className="text-xs px-1">
                  <Plus className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="frames" className="text-xs px-1">
                  <Square className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="variables" className="text-xs px-1">
                  <Type className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 px-2 pb-2">
              <TabsContent value="settings" className="mt-2">
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
                  className="h-auto min-h-[2.5rem]"
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

              {/* Page Size and Orientation */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold">Page Format</Label>
                <div className="mt-2 space-y-2">
                  <div>
                    <Label className="text-xs">Page Size</Label>
                    <Input
                      value="Carta (21.6 × 27.9 cm)"
                      disabled
                      className="bg-gray-100 h-auto min-h-[2.5rem]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Orientation</Label>
                    <Select
                      disabled={editMode}
                      value={template.pageSize.orientation}
                      onValueChange={(value: 'portrait' | 'landscape') => {
                        // Check if we already have a saved state for this orientation
                        const savedState = orientationStates[value];

                        if (savedState) {
                          // Restore the previously saved state for this orientation
                          pushToHistory(savedState);
                        } else {
                          // First time switching to this orientation - scale content
                          const oldWidth = template.pageSize.width;
                          const oldHeight = template.pageSize.height;
                          const newWidth = template.pageSize.height;
                          const newHeight = template.pageSize.width;

                          const scaleX = newWidth / oldWidth;
                          const scaleY = newHeight / oldHeight;

                          // Scale all elements - preserve font size for readability
                          const scaledTextElements = template.textElements.map(el => ({
                            ...el,
                            x: el.x * scaleX,
                            y: el.y * scaleY,
                            fontSize: el.fontSize // DO NOT scale font size on orientation change
                          }));

                          const scaledImageElements = template.imageElements.map(el => ({
                            ...el,
                            x: el.x * scaleX,
                            y: el.y * scaleY,
                            width: el.width * scaleX,
                            height: el.height * scaleY
                          }));

                          const scaledShapeElements = template.shapeElements.map(el => {
                            const scaled: ShapeElement = {
                              ...el,
                              x: el.x * scaleX,
                              y: el.y * scaleY
                            };

                            if (el.width) scaled.width = el.width * scaleX;
                            if (el.height) scaled.height = el.height * scaleY;
                            if (el.x2) scaled.x2 = el.x2 * scaleX;
                            if (el.y2) scaled.y2 = el.y2 * scaleY;
                            if (el.radius) scaled.radius = el.radius * Math.min(scaleX, scaleY);
                            if (el.borderWidth) scaled.borderWidth = el.borderWidth * Math.min(scaleX, scaleY);

                            return scaled;
                          });

                          const newTemplate = {
                            ...template,
                            pageSize: {
                              width: newWidth,
                              height: newHeight,
                              orientation: value
                            },
                            certificatesPerPage: value === 'landscape' ? 1 : template.certificatesPerPage,
                            textElements: scaledTextElements,
                            imageElements: scaledImageElements,
                            shapeElements: scaledShapeElements
                          };

                          // Save current state before switching
                          setOrientationStates(prev => ({
                            ...prev,
                            [template.pageSize.orientation]: template,
                            [value]: newTemplate
                          }));

                          pushToHistory(newTemplate);
                        }
                      }}
                    >
                      <SelectTrigger className="h-auto min-h-[2.5rem]">
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="landscape" className="bg-white hover:bg-gray-50">
                          Horizontal (Landscape)
                        </SelectItem>
                        <SelectItem value="portrait" className="bg-white hover:bg-gray-50">
                          Vertical (Portrait)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Certificates Per Page</Label>
                    <Select
                      value={String(template.certificatesPerPage || 1)}
                      onValueChange={(value) => {
                        pushToHistory({
                          ...template,
                          certificatesPerPage: Number(value)
                        });
                      }}
                      disabled={editMode || template.pageSize.orientation === 'landscape'}
                    >
                      <SelectTrigger className="h-auto min-h-[2.5rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="1" className="bg-white hover:bg-gray-50">1 certificate per page</SelectItem>
                        <SelectItem value="2" className="bg-white hover:bg-gray-50">2 certificates per page</SelectItem>
                        <SelectItem value="3" className="bg-white hover:bg-gray-50">3 certificates per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs text-gray-500 pt-1">
                    Current size: {template.pageSize.width} x {template.pageSize.height} pt
                  </div>
                </div>
              </div>

              {/* Background Options */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold">Background</Label>
                <div className="mt-2 space-y-2">
                  <div>
                    <Label className="text-xs">Background Type</Label>
                    <Select
                      value="color"
                      disabled
                    >
                      <SelectTrigger className="h-auto min-h-[2.5rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="color" className="bg-white hover:bg-gray-50">Color</SelectItem>
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
              </TabsContent>

              <TabsContent value="elements" className="mt-2">
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
              <Button onClick={() => setShowSignatureModal(true)} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Signature
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
              </TabsContent>

              <TabsContent value="frames" className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Frame Styles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Clear All Frames Button - At the top */}
              <div>
                <Button onClick={clearAllFrames} className="w-full h-9 text-xs" variant="destructive" size="sm">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All Frames
                </Button>
              </div>

              <div className="pt-2 border-t">
                <Label className="text-sm font-semibold">Predefined Designs</Label>
                <Select value={template.background.type === 'image' ? template.background.value : ''} onValueChange={(value) => {
                  if (value === 'none') {
                    pushToHistory({
                      ...template,
                      background: { type: 'color', value: '#FFFFFF' }
                    });
                  } else {
                    // When selecting an image design, clear ALL frames/borders
                    const cleanedShapes = template.shapeElements.filter(shape => {
                      // Remove all frame-like shapes
                      if (shape.type === 'rectangle') {
                        const width = shape.width || 0;
                        const height = shape.height || 0;
                        const isNearTopLeft = shape.x <= 100 && shape.y <= 100;
                        const isNearTopRight = shape.x >= template.pageSize.width - 100 - width && shape.y <= 100;
                        const isNearBottomLeft = shape.x <= 100 && shape.y >= template.pageSize.height - 100 - height;
                        const isNearBottomRight = shape.x >= template.pageSize.width - 100 - width && shape.y >= template.pageSize.height - 100 - height;
                        const isNearAnyCorner = isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight;
                        const isFullWidth = width > template.pageSize.width * 0.8;
                        const isFullHeight = height > template.pageSize.height * 0.8;
                        return !(isNearAnyCorner || isFullWidth || isFullHeight);
                      }
                      if (shape.type === 'line') {
                        const spansWidth = Math.abs((shape.x2 || 0) - shape.x) > template.pageSize.width * 0.8;
                        const spansHeight = Math.abs((shape.y2 || 0) - shape.y) > template.pageSize.height * 0.8;
                        return !(spansWidth || spansHeight);
                      }
                      if (shape.type === 'circle') {
                        const isNearTopLeft = shape.x <= 100 && shape.y <= 100;
                        const isNearTopRight = shape.x >= template.pageSize.width - 100 && shape.y <= 100;
                        const isNearBottomLeft = shape.x <= 100 && shape.y >= template.pageSize.height - 100;
                        const isNearBottomRight = shape.x >= template.pageSize.width - 100 && shape.y >= template.pageSize.height - 100;
                        const isNearAnyCorner = isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight;
                        return !isNearAnyCorner;
                      }
                      return true;
                    });

                    pushToHistory({
                      ...template,
                      background: { type: 'image', value },
                      shapeElements: cleanedShapes
                    });

                    // Reset selected frame style
                    setSelectedFrameStyle('');
                  }
                }}>
                  <SelectTrigger className="w-full h-auto min-h-[2.5rem]">
                    <SelectValue placeholder="Choose a background design...">
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760935342/Blue_Lines_Certificate_of_Completion_1_ryqak1.png' && 'Blue Lines'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760928960/Dise%C3%B1o_sin_t%C3%ADtulo_1_h53ri5.jpg' && 'Elegant Floral'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937563/Diploma_T%C3%ADtulo_Curso_Profesional_Elegante_Blanco_qnwgwj.png' && 'Professional White'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937558/Black_and_White_Ornamental_Certificate_of_Achievement_f1z532.png' && 'Black & White Ornamental'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937549/Certificado_de_participaci%C3%B3n_nsnmul.png' && 'Participation Certificate'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937546/White_and_Golden_Neutral_Minimalist_Vintage_Completion_Certificate_kjq06y.png' && 'White & Gold Vintage'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937543/Certificado_de_Participaci%C3%B3n_Elegante_Dorado_mmmgn7.png' && 'Elegant Gold'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938137/Gold_And_White_Classic_Religious_Completion_Catholic_Catechism_Certificate_1_gdesyl.png' && 'Classic Religious'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937851/Gold_and_White_Elegant_Certificate_of_Appreciation_A4_ynfahe.png' && 'Gold & White Appreciation'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938272/Blue_and_Gold_Modern_Achievement_Certificate_ljx31q.png' && 'Blue & Gold Modern'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938463/Green_and_Gold_Elegant_Certificate_of_Appreciation_A4_wg7prz.png' && 'Green & Gold Elegant'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938661/Teal_Gold_and_White_Simple_Completion_Certificate_sgkfic.png' && 'Teal & Gold Simple'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938817/Blue_and_Gold_Modern_Luxury_Certificate_of_Participation_vzqbiv.png' && 'Blue & Gold Luxury'}
                      {template.background.type === 'image' && template.background.value === 'https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938914/Blue_Elegant_Traditional_Artwork_Authenticity_Certificate_sg3bbt.png' && 'Blue Traditional'}
                      {template.background.type === 'color' && 'No Design'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-white border border-gray-200 shadow-lg z-[100]" 
                    style={{ 
                      maxHeight: '500px', 
                      overflowY: 'auto',
                      scrollBehavior: 'smooth',
                      position: 'fixed'
                    }}
                    position="popper"
                    sideOffset={4}
                  >
                    <SelectItem value="none" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">No Design</span>
                        <span className="text-xs text-gray-500">Plain background</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760935342/Blue_Lines_Certificate_of_Completion_1_ryqak1.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Blue Lines</span>
                        <span className="text-xs text-gray-500">Modern certificate with blue line decorations</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760928960/Dise%C3%B1o_sin_t%C3%ADtulo_1_h53ri5.jpg" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Elegant Floral</span>
                        <span className="text-xs text-gray-500">Elegant certificate with floral frame</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937563/Diploma_T%C3%ADtulo_Curso_Profesional_Elegante_Blanco_qnwgwj.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Professional White</span>
                        <span className="text-xs text-gray-500">Professional diploma style certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937558/Black_and_White_Ornamental_Certificate_of_Achievement_f1z532.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Black & White Ornamental</span>
                        <span className="text-xs text-gray-500">Classic black and white ornamental design</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937549/Certificado_de_participaci%C3%B3n_nsnmul.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Participation Certificate</span>
                        <span className="text-xs text-gray-500">Certificate of participation design</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937546/White_and_Golden_Neutral_Minimalist_Vintage_Completion_Certificate_kjq06y.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">White & Gold Vintage</span>
                        <span className="text-xs text-gray-500">Minimalist vintage completion certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937543/Certificado_de_Participaci%C3%B3n_Elegante_Dorado_mmmgn7.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Elegant Gold</span>
                        <span className="text-xs text-gray-500">Elegant golden participation certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938137/Gold_And_White_Classic_Religious_Completion_Catholic_Catechism_Certificate_1_gdesyl.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Classic Religious</span>
                        <span className="text-xs text-gray-500">Classic religious completion certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760937851/Gold_and_White_Elegant_Certificate_of_Appreciation_A4_ynfahe.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Gold & White Appreciation</span>
                        <span className="text-xs text-gray-500">Elegant appreciation certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938272/Blue_and_Gold_Modern_Achievement_Certificate_ljx31q.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Blue & Gold Modern</span>
                        <span className="text-xs text-gray-500">Modern achievement certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938463/Green_and_Gold_Elegant_Certificate_of_Appreciation_A4_wg7prz.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Green & Gold Elegant</span>
                        <span className="text-xs text-gray-500">Elegant green and gold design</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938661/Teal_Gold_and_White_Simple_Completion_Certificate_sgkfic.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Teal & Gold Simple</span>
                        <span className="text-xs text-gray-500">Simple teal and gold completion</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938817/Blue_and_Gold_Modern_Luxury_Certificate_of_Participation_vzqbiv.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Blue & Gold Luxury</span>
                        <span className="text-xs text-gray-500">Modern luxury participation certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="https://res.cloudinary.com/dcljjtnxr/image/upload/v1760938914/Blue_Elegant_Traditional_Artwork_Authenticity_Certificate_sg3bbt.png" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium text-sm text-gray-900">Blue Traditional</span>
                        <span className="text-xs text-gray-500">Elegant traditional blue artwork design</span>
                      </div>
                    </SelectItem>
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
                <div className="mt-3">
                  <Label className="text-xs">Frame Color</Label>
                  <Input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="h-8 w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
              </TabsContent>

              <TabsContent value="variables" className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Variables List */}
              <div>
                <p className="text-gray-600 text-xs mb-2">Click to insert variable into selected text element</p>
                <div className="text-xs space-y-2 h-[calc(100vh-500px)] overflow-y-auto">
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
              </div>
            </CardContent>
          </Card>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="p-2 space-y-2 flex-1 min-h-0">
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
                    className="h-auto min-h-[2.5rem]"
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

                {/* Text Templates Dropdown - Only show when Edit Mode is OFF */}
                <div className="mt-4">
                  <Label className="text-sm font-semibold mb-1.5 block">Text Template</Label>
                  <p className="text-xs text-gray-500 mb-3">Apply pre-designed layout</p>
                  <Select onValueChange={(value) => {
                    if (value === 'bdi') applyBDIDefaultTemplate();
                    else if (value === 'simple') applySimpleTextTemplate();
                    else if (value === 'government') applyGovernmentStyleTemplate();
                    else if (value === 'elegant') applyElegantTemplate();
                    else if (value === 'modern') applyModernTemplate();
                    else if (value === 'professional') applyProfessionalTemplate();
                  }}>
                    <SelectTrigger className="w-full h-auto min-h-[2.5rem]">
                      <SelectValue placeholder="Choose a text template..." />
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-white border border-gray-200 shadow-lg z-[100]" 
                      style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        scrollBehavior: 'smooth',
                        position: 'fixed'
                      }}
                      position="popper"
                      sideOffset={4}
                    >
                      <SelectItem value="bdi" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900">BDI Default Layout</span>
                          <span className="text-xs text-gray-500">Classic driving school format</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="simple" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900">Simple Centered</span>
                          <span className="text-xs text-gray-500">Clean centered text layout</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="government" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900">Government Form</span>
                          <span className="text-xs text-gray-500">Official form-style layout</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="elegant" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900">Elegant Centered</span>
                          <span className="text-xs text-gray-500">Sophisticated achievement style</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="modern" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900">Modern Minimalist</span>
                          <span className="text-xs text-gray-500">Contemporary clean design</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="professional" className="py-3 px-4 bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none cursor-pointer">
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium text-sm text-gray-900">Professional Left-Aligned</span>
                          <span className="text-xs text-gray-500">Business document style</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Page Size and Orientation */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-semibold">Page Format</Label>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label className="text-xs">Page Size</Label>
                      <Select
                        disabled={editMode}
                        value={(() => {
                          const currentW = Math.min(template.pageSize.width, template.pageSize.height);
                          const currentH = Math.max(template.pageSize.width, template.pageSize.height);
                          const match = PAGE_SIZE_OPTIONS.find(opt =>
                            opt.width === currentW && opt.height === currentH
                          );
                          return match?.name || 'Carta';
                        })()}
                        onValueChange={(value) => {
                          const selectedSize = PAGE_SIZE_OPTIONS.find(opt => opt.name === value);
                          if (selectedSize) {
                            const oldWidth = template.pageSize.width;
                            const oldHeight = template.pageSize.height;
                            const newWidth = template.pageSize.orientation === 'portrait' ? selectedSize.width : selectedSize.height;
                            const newHeight = template.pageSize.orientation === 'portrait' ? selectedSize.height : selectedSize.width;
                            const scaleX = newWidth / oldWidth;
                            const scaleY = newHeight / oldHeight;

                            const scaledTextElements = template.textElements.map(el => ({
                              ...el,
                              x: el.x * scaleX,
                              y: el.y * scaleY,
                              fontSize: el.fontSize * Math.min(scaleX, scaleY)
                            }));

                            const scaledImageElements = template.imageElements.map(el => ({
                              ...el,
                              x: el.x * scaleX,
                              y: el.y * scaleY,
                              width: el.width * scaleX,
                              height: el.height * scaleY
                            }));

                            const scaledShapeElements = template.shapeElements.map(el => {
                              const scaled: ShapeElement = {
                                ...el,
                                x: el.x * scaleX,
                                y: el.y * scaleY
                              };

                              if (el.width) scaled.width = el.width * scaleX;
                              if (el.height) scaled.height = el.height * scaleY;
                              if (el.x2) scaled.x2 = el.x2 * scaleX;
                              if (el.y2) scaled.y2 = el.y2 * scaleY;
                              if (el.radius) scaled.radius = el.radius * Math.min(scaleX, scaleY);
                              if (el.borderWidth) scaled.borderWidth = el.borderWidth * Math.min(scaleX, scaleY);

                              return scaled;
                            });

                            pushToHistory({
                              ...template,
                              pageSize: {
                                ...template.pageSize,
                                width: newWidth,
                                height: newHeight
                              },
                              textElements: scaledTextElements,
                              imageElements: scaledImageElements,
                              shapeElements: scaledShapeElements
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-auto min-h-[2.5rem]">
                          <SelectValue placeholder="Select page size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <SelectItem key={option.name} value={option.name} className="bg-white hover:bg-gray-50">
                              {option.name} ({option.description})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                </div>

                    <div>
                      <Label className="text-xs">Orientation</Label>
                      <Select
                        disabled={editMode}
                        value={template.pageSize.orientation}
                        onValueChange={(value: 'portrait' | 'landscape') => {
                          const savedState = orientationStates[value];
                          if (savedState) {
                            pushToHistory(savedState);
                          } else {
                            const oldWidth = template.pageSize.width;
                            const oldHeight = template.pageSize.height;
                            const newWidth = template.pageSize.height;
                            const newHeight = template.pageSize.width;
                            const scaleX = newWidth / oldWidth;
                            const scaleY = newHeight / oldHeight;

                            const scaledTextElements = template.textElements.map(el => ({
                              ...el,
                              x: el.x * scaleX,
                              y: el.y * scaleY,
                              fontSize: el.fontSize * Math.min(scaleX, scaleY)
                            }));

                            const scaledImageElements = template.imageElements.map(el => ({
                              ...el,
                              x: el.x * scaleX,
                              y: el.y * scaleY,
                              width: el.width * scaleX,
                              height: el.height * scaleY
                            }));

                            const scaledShapeElements = template.shapeElements.map(el => {
                              const scaled: ShapeElement = {
                                ...el,
                                x: el.x * scaleX,
                                y: el.y * scaleY
                              };

                              if (el.width) scaled.width = el.width * scaleX;
                              if (el.height) scaled.height = el.height * scaleY;
                              if (el.x2) scaled.x2 = el.x2 * scaleX;
                              if (el.y2) scaled.y2 = el.y2 * scaleY;
                              if (el.radius) scaled.radius = el.radius * Math.min(scaleX, scaleY);
                              if (el.borderWidth) scaled.borderWidth = el.borderWidth * Math.min(scaleX, scaleY);

                              return scaled;
                            });

                            const newTemplate = {
                              ...template,
                              pageSize: {
                                width: newWidth,
                                height: newHeight,
                                orientation: value
                              },
                              certificatesPerPage: value === 'landscape' ? 1 : template.certificatesPerPage,
                              textElements: scaledTextElements,
                              imageElements: scaledImageElements,
                              shapeElements: scaledShapeElements
                            };

                            setOrientationStates(prev => ({
                              ...prev,
                              [template.pageSize.orientation]: template,
                              [value]: newTemplate
                            }));

                            pushToHistory(newTemplate);
                          }
                        }}
                      >
                        <SelectTrigger className="h-auto min-h-[2.5rem]">
                          <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="landscape" className="bg-white hover:bg-gray-50">
                            Horizontal (Landscape)
                          </SelectItem>
                          <SelectItem value="portrait" className="bg-white hover:bg-gray-50">
                            Vertical (Portrait)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Certificates Per Page</Label>
                      <Select
                        value={String(template.certificatesPerPage || 1)}
                        onValueChange={(value) => {
                          pushToHistory({
                            ...template,
                            certificatesPerPage: Number(value)
                          });
                        }}
                        disabled={template.pageSize.orientation === 'landscape'}
                      >
                        <SelectTrigger className="h-auto min-h-[2.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="1" className="bg-white hover:bg-gray-50">1 certificate per page</SelectItem>
                          <SelectItem value="2" className="bg-white hover:bg-gray-50">2 certificates per page</SelectItem>
                          <SelectItem value="3" className="bg-white hover:bg-gray-50">3 certificates per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-gray-500 pt-1">
                      Current size: {template.pageSize.width} x {template.pageSize.height} pt
                    </div>
                  </div>
                </div>

                {/* Background Options */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-semibold">Background</Label>
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label className="text-xs">Background Type</Label>
                      <Select
                        value="color"
                        disabled
                      >
                        <SelectTrigger className="h-auto min-h-[2.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="color" className="bg-white hover:bg-gray-50">Color</SelectItem>
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
        </div>
        )}
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
            editMode={editMode}
          />
        </div>
      </div>

      {/* Right Sidebar - Only visible when editMode is ON */}
      {!previewMode && editMode && (
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
                  {/* Signature button for instructor element */}
                  {selectedElement.type === 'text' && 
                   selectedEl && 
                   (selectedEl.id === 'text-instructor-name' || (selectedEl as any).content === 'N/A' || (selectedEl as any).content === 'AFFORDABLE DRIVING INSTRUCTOR') && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-semibold mb-2 block">Instructor&apos;s Signature</Label>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowSignatureModal(true)}
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Add Signature
                      </Button>
                    </div>
                  )}

                  {selectedElement.type === 'text' && (
                    <TextElementProperties
                      element={selectedEl as TextElement}
                      onUpdate={(updates) => updateElement('text', selectedElement.id!, updates)}
                      pageWidth={template.pageSize.width}
                      pageHeight={template.pageSize.height}
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

            {/* Keyboard Shortcuts - Always visible in edit mode */}
            {editMode && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    Keyboard Shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zoom in/out:</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl + Scroll</kbd>
          </div>
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
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Instructor&apos;s Signature</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSignatureModal(false);
                  setIsDrawingMode(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <SignatureCanvas
                onSave={handleSignatureUpload}
                onClear={() => setSignatureImage(null)}
                width={400}
                height={200}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Text Element Properties Component
function TextElementProperties({
  element,
  onUpdate,
  pageWidth,
  pageHeight
}: {
  element: TextElement;
  onUpdate: (updates: Partial<TextElement>) => void;
  pageWidth: number;
  pageHeight: number;
}) {
  // Quick position presets
  const applyHorizontalAlignment = (align: 'left' | 'center' | 'right') => {
    let x = element.x;
    if (align === 'left') {
      x = 60; // Left margin
    } else if (align === 'center') {
      x = pageWidth / 2;
    } else if (align === 'right') {
      x = pageWidth - 60; // Right margin
    }
    onUpdate({ align, x });
  };

  const applyVerticalAlignment = (position: 'top' | 'middle' | 'bottom') => {
    let y = element.y;
    if (position === 'top') {
      y = 60; // Top margin
    } else if (position === 'middle') {
      y = pageHeight / 2;
    } else if (position === 'bottom') {
      y = pageHeight - 60; // Bottom margin
    }
    onUpdate({ y });
  };

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

      <div>
        <Label>Horizontal Alignment</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant={element.align === 'left' ? 'default' : 'outline'}
            onClick={() => applyHorizontalAlignment('left')}
            className="text-xs"
          >
            Left
          </Button>
          <Button
            size="sm"
            variant={element.align === 'center' ? 'default' : 'outline'}
            onClick={() => applyHorizontalAlignment('center')}
            className="text-xs"
          >
            Center
          </Button>
          <Button
            size="sm"
            variant={element.align === 'right' ? 'default' : 'outline'}
            onClick={() => applyHorizontalAlignment('right')}
            className="text-xs"
          >
            Right
          </Button>
        </div>
      </div>

      <div>
        <Label>Vertical Position</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyVerticalAlignment('top')}
            className="text-xs"
          >
            Top
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyVerticalAlignment('middle')}
            className="text-xs"
          >
            Middle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyVerticalAlignment('bottom')}
            className="text-xs"
          >
            Bottom
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>X Position</Label>
          <Input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Y Position</Label>
          <Input
            type="number"
            value={Math.round(element.y)}
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

      <div className="flex items-center space-x-2">
        <Switch
          checked={element.grayscale || false}
          onCheckedChange={(checked) => onUpdate({ grayscale: checked })}
        />
        <Label className="text-sm">
          Grayscale (Black & White)
        </Label>
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
