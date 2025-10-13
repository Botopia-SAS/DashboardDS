"use client";

import { Student } from "../columns";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

interface UseTableDataProps {
  initialData: Student[];
  onUpdate: (updatedData: Partial<Student>[]) => Promise<void>;
}

export function useTableData({ initialData, onUpdate }: UseTableDataProps) {
  const [tableData, setTableData] = useState<Student[]>(initialData);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<{ [key: string]: Student }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = useCallback(
    (rowId: string) => {
      const rowData = tableData.find((row) => row.id === rowId);
      if (rowData) {
        setEditingRow(rowId);
        setEditedData((prev) => ({
          ...prev,
          [rowId]: { ...rowData },
        }));
      }
    },
    [tableData]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingRow(null);
    setEditedData({});
  }, []);

  const handleChange = useCallback(
    (rowId: string, field: keyof Student, value: string | number) => {
      setEditedData((prev) => ({
        ...prev,
        [rowId]: { ...prev[rowId], [field]: value },
      }));
    },
    []
  );

  const handleSave = useCallback(
    async (rowId: string) => {
      if (!editedData[rowId] || isSaving) return;

      setIsSaving(true);
      const updatedRow = editedData[rowId];
      
      // Debug: Log the data being sent
      console.log('Saving data for row:', rowId, updatedRow);
      console.log('Citation number specifically:', updatedRow.citation_number);

      try {
        setTableData((currentData) =>
          currentData.map((row) =>
            row.id === rowId ? { ...row, ...updatedRow } : row
          )
        );
        await onUpdate([updatedRow]);
        setEditingRow(null);
        setEditedData((prev) => {
          const newData = { ...prev };
          delete newData[rowId];
          return newData;
        });
      } catch (error) {
        console.error("Error updating data:", error);
        setTableData((currentData) =>
          currentData.map((row) => {
            if (row.id === rowId) {
              const originalRow = initialData.find((orig) => orig.id === rowId);
              return originalRow || row;
            }
            return row;
          })
        );
        setEditingRow(null);
      } finally {
        setIsSaving(false);
      }
    },
    [editedData, isSaving, initialData, onUpdate, tableData]
  );

  return {
    tableData,
    setTableData,
    editingRow,
    editedData,
    isSaving,
    handleEdit,
    handleCancelEdit,
    handleChange,
    handleSave,
  };
}
