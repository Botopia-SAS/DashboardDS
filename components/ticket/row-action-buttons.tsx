"use client";

import { Button } from "@/components/ui/button";
import { Check, Edit, Download, X } from "lucide-react";
import { Student } from "./columns";

interface RowActionButtonsProps {
  actions: {
    isEditing: boolean;
    rowId: string;
    original: Student;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDownload: () => void;
    isSaving: boolean;
  };
}

export function RowActionButtons({ actions }: RowActionButtonsProps) {
  const { isEditing, onEdit, onSave, onCancel, onDownload, isSaving } = actions;

  return (
    <div className="flex gap-2">
      {isEditing ? (
        <>
          <button
            onClick={onSave}
            className="px-2 py-1 bg-green-500 text-white rounded"
            disabled={isSaving}
          >
            <Check />
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-red-500 text-white rounded"
            disabled={isSaving}
          >
            <X />
          </button>
        </>
      ) : (
        <>
          <Button
            onClick={onEdit}
            className="px-2 py-1 bg-yellow-500 text-white rounded"
          >
            <Edit />
          </Button>
          <Button
            onClick={onDownload}
            className="px-2 py-1 bg-blue-500 text-white rounded"
          >
            <Download />
          </Button>
        </>
      )}
    </div>
  );
}
