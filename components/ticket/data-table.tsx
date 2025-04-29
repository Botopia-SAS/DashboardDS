"use client";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Student } from "./columns";
import { useTableData } from "./hooks/use-table-data";
import { useCertificateGenerator } from "./hooks/use-certificate-generator";
import { RowActionButtons } from "./row-action-buttons";
import { TableActions } from "./table-actions";
import { PaymentMethodModal } from "./payment-method-modal";

// Interface definitions
interface DataTableProps {
  columns: ColumnDef<Student>[];
  data: Student[];
  onUpdate: (updatedData: Partial<Student>[]) => Promise<void>;
}

// Main component
export function DataTable({ columns, data, onUpdate }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({});

  const {
    tableData,
    editingRow,
    editedData,
    isSaving,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    setSelectedPaymentMethod,
    handleEdit,
    handleCancelEdit,
    handleChange,
    handleSave,
    handleSavePaymentMethod,
  } = useTableData({ initialData: data, onUpdate });

  const { generateCertificatePDF } = useCertificateGenerator();

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
  });

  // Functions for export and certificates
  const downloadAllCertificates = useCallback(async () => {
    const zip = new JSZip();
    const selectedRows = table
      .getSelectedRowModel()
      .flatRows.map((row) => row.original as Student);

    // Filtering students that paid and have a certificate number
    const validStudents = selectedRows.filter(
      (student) => student.payedAmount > 0 && student.certn
    );

    if (validStudents.length === 0) {
      toast.error("No valid students to download certificates.");
      return;
    }

    try {
      for (const user of validStudents) {
        const pdfBlob = await generateCertificatePDF(user);
        const name = `${user.first_name} ${user.last_name}`;
        zip.file(`${name.replace(/ /g, "_")}.pdf`, pdfBlob);
      }

      setRowSelection({});
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "certificates.zip");
      toast.success("Certificates downloaded successfully");
    } catch (error) {
      console.error("Error generating ZIP:", error);
      toast.error("Error generating certificates");
    }
  }, [generateCertificatePDF, table, setRowSelection]);

  const downloadSingleCertificate = useCallback(
    async (user: Student) => {
      if (user.payedAmount === 0) {
        toast.error("Student has not paid");
        return;
      }

      if (!user.certn) {
        toast.error("Student does not have a certificate number");
        return;
      }

      try {
        const pdfBlob = await generateCertificatePDF(user);
        const name = `${user.first_name} ${user.last_name}`;
        saveAs(pdfBlob, `${name.replace(/ /g, "_")}.pdf`);
        toast.success("Certificate downloaded successfully");
      } catch (error) {
        console.error("Error generating certificate:", error);
        toast.error("Error generating certificate");
      }
    },
    [generateCertificatePDF]
  );

  const downloadXLSX = useCallback(() => {
    const studentsWithCertnZero = data
      .filter((student) => student.certn === 0)
      .map(({ id, payedAmount, certn, ...rest }) => rest);

    if (studentsWithCertnZero.length === 0) {
      toast.error("No students with certn equal to 0.");
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(studentsWithCertnZero);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      const xlsxData = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([xlsxData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "info_to_fetch_cert_numbers.xlsx");
      toast.success("XLSX downloaded successfully");
    } catch (error) {
      console.error("Error generating XLSX:", error);
      toast.error("Error generating XLSX");
    }
  }, [data]);

  return (
    <div className="rounded-md border">
      <TableActions
        rowSelection={rowSelection}
        onDownloadAll={downloadAllCertificates}
        onDownloadXLSX={downloadXLSX}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isEditing = editingRow === row.id;
                const rowData = isEditing ? editedData[row.id] : row.original;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnId = cell.column.id as keyof Student;
                      return (
                        <TableCell key={cell.id}>
                          {isEditing &&
                          (columnId === "certn" ||
                            columnId === "payedAmount") ? (
                            <input
                              type="text"
                              value={rowData[columnId] || ""}
                              onChange={(e) =>
                                handleChange(row.id, columnId, e.target.value)
                              }
                              className="border p-1 w-full"
                            />
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          )}
                        </TableCell>
                      );
                    })}
                    <RowActionButtons
                      actions={{
                        isEditing,
                        rowId: row.id,
                        original: row.original,
                        onEdit: () => handleEdit(row.id),
                        onSave: () => handleSave(row.id),
                        onCancel: handleCancelEdit,
                        onDownload: () =>
                          downloadSingleCertificate(row.original),
                        isSaving,
                      }}
                    />
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onSave={handleSavePaymentMethod}
        onSelectPaymentMethod={setSelectedPaymentMethod}
      />
    </div>
  );
}
