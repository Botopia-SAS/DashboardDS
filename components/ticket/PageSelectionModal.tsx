"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pages: number) => void;
  totalStudents: number;
}

export function PageSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  totalStudents,
}: PageSelectionModalProps) {
  const [selectedPages, setSelectedPages] = useState<number>(1);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedPages);
    onClose();
  };

  const pageOptions = [];
  
  // Generate options based on number of students
  for (let pages = 1; pages <= Math.min(totalStudents, 4); pages++) {
    if (pages === 1) {
      pageOptions.push({
        value: pages,
        label: "1 página (todos juntos)",
        description: `${totalStudents} certificados en 1 página`
      });
    } else {
      const perPage = Math.ceil(totalStudents / pages);
      pageOptions.push({
        value: pages,
        label: `${pages} páginas`,
        description: `${perPage} certificados por página aproximadamente`
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Seleccionar número de páginas</h2>
        <p className="text-gray-600 mb-4">
          Tienes {totalStudents} estudiante{totalStudents > 1 ? 's' : ''} seleccionado{totalStudents > 1 ? 's' : ''}. 
          ¿En cuántas páginas quieres distribuirlos?
        </p>
        
        <div className="space-y-3 mb-6">
          {pageOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="pages"
                value={option.value}
                checked={selectedPages === option.value}
                onChange={(e) => setSelectedPages(Number(e.target.value))}
                className="w-4 h-4 text-purple-600"
              />
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 py-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="px-4 py-2 bg-purple-500 text-white"
          >
            Generar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
