"use client";

import { Button } from "@/components/ui/button";
import { allowsCombinedPDF } from "@/lib/certificateConfigurations";

interface TableActionsProps {
  rowSelection: Record<string, boolean>;
  onDownloadAll: () => void;
  onDownloadCombined: (pages: number) => void;
  onDownloadXLSX: () => void;
  onTest3Students?: () => void; // NEW: Test button for 3 students
  template?: any; // Template to check classType
}

export function TableActions({
  rowSelection,
  onDownloadAll,
  onDownloadCombined,
  onDownloadXLSX,
  onTest3Students,
  template,
}: TableActionsProps) {
  const selectedCount = Object.keys(rowSelection).length;

  // Call directly without modal - the function now handles dynamic PDF generation
  const handleDownloadCombined = () => {
    onDownloadCombined(1); // Parameter is ignored now, kept for compatibility
  };

  // Check if template allows combined PDF using centralized configuration
  const showCombinedPDFButton = template?.classType
    ? allowsCombinedPDF(template.classType)
    : false;

  // Check if it's an 8-hours, ADI or BDI certificate to show test button
  const is8Hours = template?.classType?.toUpperCase().includes('8-HOURS') ||
                   template?.classType?.toUpperCase().includes('8 HOURS');
  const isAdi = template?.classType?.toUpperCase().includes('ADI');
  const isBdi = template?.classType?.toUpperCase().includes('BDI');
  const showTestButton = is8Hours || isAdi || isBdi;

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
            {showCombinedPDFButton && (
              <Button
                onClick={handleDownloadCombined}
                className="px-4 py-2 bg-purple-500 text-white rounded"
              >
                Download combined PDF (dynamic)
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {selectedCount} student{selectedCount > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
      <div className="p-4 space-x-2">
        <Button
          onClick={onDownloadXLSX}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download XSLX
        </Button>
        {showTestButton && onTest3Students && (
          <Button
            onClick={onTest3Students}
            className="px-4 py-2 bg-orange-500 text-white rounded"
          >
            🧪 Test PDF (3 students)
          </Button>
        )}
      </div>
    </>
  );
}
