"use client";
import * as XLSX from "xlsx";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Download, Edit, X } from "lucide-react";
import { Button } from "../ui/button";
import { Student } from "./columns";
import toast from "react-hot-toast";

interface DataTableProps {
  columns: ColumnDef<Student>[];
  data: Student[];
  onUpdate: (updatedData: Partial<Student>[]) => Promise<void>;
}

export function DataTable({ columns, data, onUpdate }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<{ [key: string]: Student }>({});
  const [tableData, setTableData] = useState<Student[]>(data);
  const [isSaving, setIsSaving] = useState(false);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
  });

  const handleEdit = (rowId: string) => {
    const rowData = tableData.find((row) => row.id === rowId);
    if (rowData) {
      setEditingRow(rowId);
      setEditedData((prev) => ({
        ...prev,
        [rowId]: { ...rowData },
      }));
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData({});
  };

  const handleChange = (rowId: string, field: keyof Student, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [field]: value },
    }));
  };

  const handleSave = async (rowId: string) => {
    if (!editedData[rowId] || isSaving) return;

    setIsSaving(true);
    const updatedRow = editedData[rowId];

    try {
      // Actualizar la UI inmediatamente
      setTableData((currentData) =>
        currentData.map((row) =>
          row.id === rowId ? { ...row, ...updatedRow } : row
        )
      );

      // Intentar actualizar en el backend
      await onUpdate([updatedRow]);

      // Limpiar estado de edición
      setEditingRow(null);
      setEditedData((prev) => {
        const newData = { ...prev };
        delete newData[rowId];
        return newData;
      });
    } catch (error) {
      console.error("Error updating data:", error);

      // Revertir a los datos anteriores en caso de error
      setTableData((currentData) =>
        currentData.map((row) => {
          if (row.id === rowId) {
            // Encontrar el dato original
            const originalRow = data.find((orig) => orig.id === rowId);
            return originalRow || row;
          }
          return row;
        })
      );
      setEditingRow(null);
    } finally {
      setIsSaving(false);
    }
  };

  const waitForImagesToLoad = (container: HTMLElement): Promise<void> => {
    const images = Array.from(container.getElementsByTagName("img"));
    const loadPromises = images.map(
      (img) =>
        new Promise<void>((resolve, reject) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () =>
              reject(new Error(`Error loading image: ${img.src}`));
          }
        })
    );
    return Promise.all(loadPromises).then(() => {});
  };

  const generateCertificatePDF = async (user: Student) => {
    const { last_name, first_name, midl, birthDate, certn, courseDate } = user;

    const container = document.createElement("div");
    container.style.width = "740px"; // Reducido para evitar cortes
    container.style.padding = "20px";
    container.style.marginTop = "60px";
    container.style.backgroundColor = "white";
    container.style.textAlign = "center";
    container.style.position = "relative"; // Evita problemas con absolute positioning
    container.style.boxSizing = "border-box";

    container.innerHTML = `
      <div style="width: 100%; max-width: 680px; padding: 7px; background-color: white; text-align: center; border: 6px solid black; box-sizing: border-box; margin-bottom:40px;">
        <div style="width: 100%; max-width: 680px; padding: 5px; background-color: white; text-align: center; border: 4px solid black; box-sizing: border-box;">
          <div style="width: 100%; max-width: 680px; padding: 4px; background-color: white; text-align: center; border: 2px solid black; box-sizing: border-box;">
            <h1 style="font-size: 24px; font-weight: bold;">AFFORDABLE DRIVING and TRAFFIC SCHOOL, INC.</h1>
            <p style="font-size: 12px;">3167 Forest Hill Blvd. West Palm Beach, Fl 33406 (561) 969-0150 - (561) 330-7007</p>
            <h2 style="margin-top: 20px; font-size: 20px;">This Certifies That:</h2>
            <h3 style="font-size: 22px; font-weight: bold; color: #000;">${first_name} ${
      midl || ""
    } ${last_name}</h3>
            <p style="margin-top: 20px;">Date of Birth: <strong>${birthDate}</strong></p>
            <p style="margin-top: 20px;">Certificate N°: <strong>${certn}</strong></p>
            
            <img id="sello1" src="/sello1.png" alt="Sello Izquierdo" style="position: absolute; left: 85px; top: 50%; transform: translateY(-50%); width: 80px;" />
            <img id="sello2" src="/sello2.png" alt="Sello Derecho" style="position: absolute; right: 85px; top: 50%; transform: translateY(-50%); width: 80px;" />
    
            <p style="margin-top: 20px;">Has successfully completed the</p>
            <h2 style="font-size: 22px; font-weight: bold;">D.A.T.E.</h2>
            <p>Drug, Alcohol and Traffic Education Program</p>
            <p>Pursuant to Section 322.095, Florida Statutes</p>
    
            <div style="margin-top: 30px; display: flex; justify-content: space-between; padding: 0 40px;">
              <div style="text-align: center;">
                <img src="/firma_instructor.png" alt="firma_instructor" style="width: 100px;" />
                <p style="display: inline-block; padding-top: 5px;">Instructor</p>
              </div>
              <div style="text-align: center;">
                <p style="display: inline-block; padding-top: 5px;">${courseDate}</p>
                <p style="font-size: 12px;">Date</p>
              </div>
              <div style="text-align: center;">
                <p style="display: inline-block; padding-top: 5px;">Nelson E. Guarin</p>
                <p style="font-size: 12px;">Director</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Esperar a que las imágenes se carguen antes de capturar
    await waitForImagesToLoad(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true, // Asegura la carga de imágenes externas
    });

    document.body.removeChild(container);

    const pdf = new jsPDF("landscape", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const x = 10;
    const y = (pdf.internal.pageSize.getHeight() - imgHeight - 20) / 8; // Centrar verticalmente

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

    return pdf.output("blob");
  };

  const downloadAllCertificates = async () => {
    const zip = new JSZip();
    const selectedRows = table
      .getSelectedRowModel()
      .flatRows.map((row) => row.original as Student);

    if (selectedRows.length === 0) {
      alert("Please select at least one student to download certificates.");
      return;
    }

    for (const user of selectedRows) {
      const pdfBlob = await generateCertificatePDF(user);
      const name = `${user.first_name} ${user.last_name}`;
      zip.file(`${name.replace(" ", "_")}.pdf`, pdfBlob);
    }

    setRowSelection({});
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "certificates.zip");
  };

  const downloadSingleCertificate = async (user: Student) => {
    if (user.certn !== 0) {
      try {
        const pdfBlob = await generateCertificatePDF(user);
        const name = `${user.first_name} ${user.last_name}`;
        saveAs(pdfBlob, `${name.replace(" ", "_")}.pdf`);
      } catch (error) {
        console.error("Error generating certificate:", error);
        alert(
          "Error al generar el certificado. Por favor, inténtelo de nuevo."
        );
      }
    } else {
      alert("Student has not paid");
    }
  };

  const downloadXLSX = () => {
    const studentsWithCertnZero = data.filter((student) => student.certn === 0);

    if (studentsWithCertnZero.length === 0) {
      alert("No students with certn equal to 0.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(studentsWithCertnZero);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const xlsxData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([xlsxData], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "info_to_fetch_cert_numbers.xlsx");
  };

  return (
    <div className="rounded-md border">
      {Object.keys(rowSelection).length > 0 && (
        <div className="p-4">
          <Button
            onClick={downloadAllCertificates}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Download certificates (ZIP)
          </Button>
        </div>
      )}
      <div className="p-4">
        <Button
          onClick={downloadXLSX}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download XSLX
        </Button>
      </div>
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const columnId = cell.column.id as keyof Student;
                      return (
                        <TableCell key={cell.id}>
                          {isEditing && columnId === "certn" ? (
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
                    <TableCell className="flex gap-2">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(row.id)}
                            className="px-2 py-1 bg-green-500 text-white rounded"
                            disabled={isSaving}
                          >
                            <Check />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-red-500 text-white rounded"
                            disabled={isSaving}
                          >
                            <X />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleEdit(row.id)}
                            className="px-2 py-1 bg-yellow-500 text-white rounded"
                          >
                            <Edit />
                          </Button>
                          <Button
                            onClick={() =>
                              row.original.payedAmount !== 0
                                ? downloadSingleCertificate(row.original)
                                : toast.error("Student has not paid")
                            }
                            className="px-2 py-1 bg-blue-500 text-white rounded"
                          >
                            <Download />
                          </Button>
                        </>
                      )}
                    </TableCell>
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
    </div>
  );
}
