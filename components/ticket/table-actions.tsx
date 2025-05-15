"use client";

import { Button } from "@/components/ui/button";

interface TableActionsProps {
  rowSelection: Record<string, boolean>;
  onDownloadAll: () => void;
  onDownloadXLSX: () => void;
}

export function TableActions({
  rowSelection,
  onDownloadAll,
  onDownloadXLSX,
}: TableActionsProps) {
  return (
    <>
      {Object.keys(rowSelection).length > 0 && (
        <div className="p-4">
          <Button
            onClick={onDownloadAll}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Download certificates (ZIP)
          </Button>
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
    </>
  );
}
