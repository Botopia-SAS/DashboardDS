"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageSelectionModal } from "./PageSelectionModal";

interface TableActionsProps {
  rowSelection: Record<string, boolean>;
  onDownloadAll: () => void;
  onDownloadCombined: (pages: number) => void;
  onDownloadXLSX: () => void;
}

export function TableActions({
  rowSelection,
  onDownloadAll,
  onDownloadCombined,
  onDownloadXLSX,
}: TableActionsProps) {
  const selectedCount = Object.keys(rowSelection).length;
  const [showPageModal, setShowPageModal] = useState(false);

  const handleDownloadCombined = () => {
    if (selectedCount > 2) {
      setShowPageModal(true);
    } else {
      onDownloadCombined(1);
    }
  };

  const handleConfirmPages = (pages: number) => {
    onDownloadCombined(pages);
  };
  
  return (
    <>
      {selectedCount > 0 && (
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={onDownloadAll}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Download certificates (ZIP)
            </Button>
            <Button
              onClick={handleDownloadCombined}
              className="px-4 py-2 bg-purple-500 text-white rounded"
            >
              Download combined PDF (dynamic)
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            {selectedCount} student{selectedCount > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
      <div className="p-4">
        <Button
          onClick={onDownloadXLSX}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download XSLX
        </Button>
      </div>
      
      <PageSelectionModal
        isOpen={showPageModal}
        onClose={() => setShowPageModal(false)}
        onConfirm={handleConfirmPages}
        totalStudents={selectedCount}
      />
    </>
  );
}
