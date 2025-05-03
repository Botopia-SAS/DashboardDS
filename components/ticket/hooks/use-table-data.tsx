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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [currentRowId, setCurrentRowId] = useState<string | null>(null);

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
    (rowId: string, field: keyof Student, value: string) => {
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

      // Si se modificó payedAmount, mostrar modal antes de guardar
      const original = tableData.find((row) => row.id === rowId);
      const edited = editedData[rowId];
      if (
        original &&
        edited &&
        edited.payedAmount !== undefined &&
        edited.payedAmount !== original.payedAmount &&
        edited.payedAmount > 0
      ) {
        setCurrentRowId(rowId);
        setIsPaymentModalOpen(true);
        return;
      }

      setIsSaving(true);
      const updatedRow = editedData[rowId];

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

  const handleSavePaymentMethod = useCallback(async () => {
    if (currentRowId && selectedPaymentMethod) {
      setIsSaving(true);
      const updatedRow = {
        ...editedData[currentRowId],
        paymentMethod: selectedPaymentMethod,
      };
      try {
        setTableData((currentData) =>
          currentData.map((row) =>
            row.id === currentRowId ? { ...row, ...updatedRow } : row
          )
        );
        await onUpdate([updatedRow]);
        setEditingRow(null);
        setEditedData((prev) => {
          const newData = { ...prev };
          delete newData[currentRowId!];
          return newData;
        });
      } catch (error) {
        console.error("Error updating data:", error);
        setTableData((currentData) =>
          currentData.map((row) => {
            if (row.id === currentRowId) {
              const originalRow = initialData.find(
                (orig) => orig.id === currentRowId
              );
              return originalRow || row;
            }
            return row;
          })
        );
        setEditingRow(null);
      } finally {
        setIsSaving(false);
        setIsPaymentModalOpen(false);
        setSelectedPaymentMethod(null);
        setCurrentRowId(null);
      }
    } else {
      toast.error("Please select a payment method.");
    }
  }, [currentRowId, editedData, initialData, onUpdate, selectedPaymentMethod]);

  return {
    tableData,
    setTableData,
    editingRow,
    editedData,
    isSaving,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    currentRowId,
    handleEdit,
    handleCancelEdit,
    handleChange,
    handleSave,
    handleSavePaymentMethod,
  };
}
