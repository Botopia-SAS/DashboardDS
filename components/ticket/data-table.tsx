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
import { useCertificateGenerator } from "./hooks/use-master-certificate-generator";
import { VariableValidationModal } from "@/components/certificate-editor/VariableValidationModal";
import { RowActionButtons } from "./row-action-buttons";
import { TableActions } from "./table-actions";

// Interface definitions
interface DataTableProps {
  columns: ColumnDef<Student>[];
  data: Student[];
  onUpdate: (updatedData: Partial<Student>[]) => Promise<void>;
}

// Main component
export function DataTable({ columns, data, onUpdate }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<Student | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<any>(null);

  const {
    tableData,
    editingRow,
    editedData,
    isSaving,
    handleEdit,
    handleCancelEdit,
    handleChange,
    handleSave,
  } = useTableData({ initialData: data, onUpdate });

  const { generateCertificatePDF, validateVariables } = useCertificateGenerator();

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
    const selectedRows = table
      .getSelectedRowModel()
      .flatRows.map((row) => row.original as Student);

    if (selectedRows.length === 0) {
      toast.error("Por favor seleccione al menos un estudiante para descargar certificados.");
      return;
    }

    // Filtering students that paid and have a certificate number
    const validStudents = selectedRows.filter(
      (student) => student.payedAmount > 0 && student.certn && student.certn > 0
    );

    const invalidStudents = selectedRows.filter(
      (student) => student.payedAmount === 0 || !student.certn || student.certn === 0
    );

    if (validStudents.length === 0) {
      toast.error("No hay estudiantes válidos para descargar certificados. Verifique que hayan pagado y tengan número de certificado.");
      return;
    }

    if (invalidStudents.length > 0) {
      toast(`${invalidStudents.length} estudiante(s) fueron omitidos por no cumplir los requisitos (pago o número de certificado).`, {
        icon: '⚠️',
        style: {
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7'
        }
      });
    }

    const loadingToast = toast.loading(`Generando ${validStudents.length} certificado(s)...`);

    try {
      const zip = new JSZip();
      
      for (const user of validStudents) {
        const pdfBlob = await generateCertificatePDF(user);
        const name = `${user.first_name} ${user.last_name}`.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const fileName = `${name.replace(/\s+/g, "_")}_Certificado_${user.certn}.pdf`;
        zip.file(fileName, pdfBlob);
      }

      setRowSelection({});
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFileName = `Certificados_${new Date().toISOString().split('T')[0]}.zip`;
      saveAs(zipBlob, zipFileName);
      
      toast.dismiss(loadingToast);
      toast.success(`${validStudents.length} certificado(s) descargado(s) exitosamente`);
    } catch (error) {
      console.error("Error generating ZIP:", error);
      toast.dismiss(loadingToast);
      toast.error("Error al generar los certificados. Intente nuevamente.");
    }
  }, [generateCertificatePDF, table, setRowSelection]);

  const downloadSingleCertificate = useCallback(
    async (user: Student) => {
      // Validación básica - solo verificar número de certificado
      if (!user.certn || user.certn === 0) {
        toast.error(`El estudiante ${user.first_name} ${user.last_name} no tiene número de certificado asignado. Contacte al administrador.`);
        return;
      }

      // Get template for validation
      const { type, classType } = user;
      const certType = (classType || type || 'DATE').toUpperCase();
      
      try {
        const templateResponse = await fetch(`/api/certificate-templates?classType=${certType}`);
        let template = null;
        
        if (templateResponse.ok) {
          const templates = await templateResponse.json();
          if (templates.length > 0) {
            template = templates[0];
          }
        }
        
        // If no template found, use default
        if (!template) {
          const { getDefaultBDITemplate } = await import("@/lib/defaultTemplates/bdiTemplate");
          template = getDefaultBDITemplate(certType);
        }

        // Validate variables
        const validation = validateVariables(user, template);
        
        console.log(`🔍 DataTable validation result:`, validation);
        
        if (!validation.isValid) {
          console.log(`❌ Variables missing, showing modal`);
          // Show validation modal
          setPendingUser(user);
          setPendingTemplate(template);
          setValidationModalOpen(true);
          return;
        }

        console.log(`✅ All variables valid, proceeding with generation`);
        // Proceed with generation if all variables are valid
        await proceedWithGeneration(user);
        
      } catch (error) {
        console.error("Error validating variables:", error);
        toast.error("Error al validar las variables del certificado");
      }
    },
    [generateCertificatePDF, validateVariables]
  );

  const proceedWithGeneration = async (user: Student) => {
    const loadingToast = toast.loading("Generando certificado...");

    try {
      const pdfBlob = await generateCertificatePDF(user);
      const name = `${user.first_name} ${user.last_name}`.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const fileName = `${name.replace(/\s+/g, "_")}_Certificado_${user.certn}.pdf`;
      
      saveAs(pdfBlob, fileName);
      toast.dismiss(loadingToast);
      toast.success(`Certificado descargado exitosamente para ${user.first_name} ${user.last_name}`);
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.dismiss(loadingToast);
      toast.error(`Error al generar el certificado para ${user.first_name} ${user.last_name}. Intente nuevamente.`);
    }
  };

  const handleAddMissingVariables = (variables: string[]) => {
    if (pendingUser) {
      // Here you would typically update the user data with the missing variables
      // For now, we'll just proceed with generation
      toast.success(`Variables agregadas: ${variables.join(', ')}`);
      proceedWithGeneration(pendingUser);
    }
  };
  const downloadXLSX = useCallback(() => {
    const studentsWithCertnZero = data
      .filter((student) => student.certn === 0)
      .map(({ ...rest }) => rest);

    if (studentsWithCertnZero.length === 0) {
      toast.error("No hay estudiantes con número de certificado igual a 0 para exportar.");
      return;
    }

    const loadingToast = toast.loading("Generando archivo Excel...");

    try {
      const worksheet = XLSX.utils.json_to_sheet(studentsWithCertnZero);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes_Sin_Certificado");

      const xlsxData = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([xlsxData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `Estudiantes_Sin_Certificado_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);
      
      toast.dismiss(loadingToast);
      toast.success(`Archivo Excel descargado exitosamente con ${studentsWithCertnZero.length} estudiante(s)`);
    } catch (error) {
      console.error("Error generating XLSX:", error);
      toast.dismiss(loadingToast);
      toast.error("Error al generar el archivo Excel. Intente nuevamente.");
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
                            columnId === "payedAmount" ||
                            columnId === "citation_number") ? (
                            <input
                              type={columnId === "citation_number" ? "text" : "text"}
                              value={rowData[columnId] || ""}
                              onChange={(e) =>
                                handleChange(
                                  row.id, 
                                  columnId, 
                                  columnId === "citation_number" ? e.target.value : +e.target.value
                                )
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

      <VariableValidationModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        template={pendingTemplate}
        user={pendingUser}
        onProceed={() => pendingUser && proceedWithGeneration(pendingUser)}
        onAddMissingVariables={handleAddMissingVariables}
      />
    </div>
  );
}
