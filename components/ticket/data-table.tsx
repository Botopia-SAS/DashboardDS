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
import { PDFDocument } from "pdf-lib";

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
import { useUnifiedCertificateGenerator } from "./hooks/use-unified-certificate-generator";
import { useDynamicCertificateGenerator } from "./hooks/use-dynamic-certificate-generator";
import { use8HoursCertificateGenerator } from "./hooks/use-8hours-certificate-generator";
import { useAdiCertificateGenerator } from "./hooks/use-adi-certificate-generator";
import { useBdiCertificateGenerator } from "./hooks/use-bdi-certificate-generator";
import { useInsuranceCertificateGenerator } from "./hooks/use-insurance-certificate-generator";
import { useDateCertificateGenerator } from "./hooks/use-date-certificate-generator";
import { useYouthfulOffenderCertificateGenerator } from "./hooks/use-youthful-offender-certificate-generator";
import { RowActionButtons } from "./row-action-buttons";
import { TableActions } from "./table-actions";
import { SignatureCanvas } from "./SignatureCanvas";

// Interface definitions
interface DataTableProps {
  columns: ColumnDef<Student>[];
  data: Student[];
  onUpdate: (updatedData: Partial<Student>[]) => Promise<void>;
  template?: any; // Add template to access variable options
}

// Main component
export function DataTable({ columns, data, onUpdate, template }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({});

  // Helper function to get options for a variable
  const getVariableOptions = (columnId: string) => {
    if (!template?.availableVariables) return null;
    const variable = template.availableVariables.find((v: any) => v.key === columnId);
    return variable?.options || null;
  };

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

  const { generateCertificatePDF } = useUnifiedCertificateGenerator();
  const { generateMultipleCertificatesPDF } = useDynamicCertificateGenerator();
  const { generateSingle8HoursCertificate, generateMultiple8HoursCertificates } = use8HoursCertificateGenerator();
  const { generateSingleAdiCertificate, generateMultipleAdiCertificates } = useAdiCertificateGenerator();
  const { generateSingleBdiCertificate, generateMultipleBdiCertificates } = useBdiCertificateGenerator();
  const { generateSingleInsuranceCertificate, generateMultipleInsuranceCertificates } = useInsuranceCertificateGenerator();
  const { generateDateCertificatePDF, generateMultipleDateCertificates, generateCombinedDateCertificates } = useDateCertificateGenerator();
  const { generateSingleYouthfulOffenderCertificate, generateMultipleYouthfulOffenderCertificates } = useYouthfulOffenderCertificateGenerator();

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

    // Filtering students that have a certificate number (including 0)
    const validStudents = selectedRows.filter(
      (student) => student.certn !== null && student.certn !== undefined
    );

    const invalidStudents = selectedRows.filter(
      (student) => student.certn === null || student.certn === undefined
    );

    if (validStudents.length === 0) {
      toast.error("No hay estudiantes válidos para descargar certificados. Verifique que tengan número de certificado.");
      return;
    }

    if (invalidStudents.length > 0) {
      toast(`${invalidStudents.length} estudiante(s) fueron omitidos por no tener número de certificado.`, {
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
      // Get template to know certificatesPerPage
      const { type, classType } = validStudents[0];
      const certType = (classType || type || 'DATE').toUpperCase();

      console.log(`🔍 Student data:`, validStudents[0]);
      console.log(`📋 Resolved certType: ${certType}`);

      const templateResponse = await fetch(`/api/certificate-templates?classType=${certType}`);
      let template = null;

      if (templateResponse.ok) {
        const templates = await templateResponse.json();
        console.log(`📥 Templates from API:`, templates);
        if (templates.length > 0) {
          template = templates[0];
          console.log(`✅ Using template from database:`, template.name);
        }
      }

      // Detectar si es un certificado de 8 horas, ADI, BDI, Insurance, DATE o Youthful Offender
      const is8Hours = certType.includes('8-HOURS') || certType.includes('8 HOURS');
      const isAdi = certType.includes('ADI');
      const isBdi = certType.includes('BDI');
      const isInsurance = certType.includes('INSURANCE');
      const isDate = certType === 'DATE';
      const isYouthfulOffender = certType.includes('YOUTHFUL OFFENDER') || certType.includes('YOUTHFUL-OFFENDER');

      if (!template) {
        if (isDate) {
          console.log(`⚠️ No template found for DATE, using DATE template`);
          // Para DATE, crear un template básico con el path correcto
          template = {
            name: 'DATE Certificate',
            certificatesPerPage: 1,
            pdfTemplatePath: '/templates_certificates/date.pdf',
            pageSize: { width: 792, height: 612, orientation: 'landscape' },
            background: {
              type: 'pdf',
              value: '/templates_certificates/date.pdf'
            },
            shapeElements: [],
            textElements: [],
            imageElements: [],
            checkboxElements: [],
            availableVariables: []
          };
        } else {
          console.log(`⚠️ No template found, using default BDI template for ${certType}`);
          const { getDefaultBDITemplate } = await import("@/lib/defaultTemplates/bdiTemplate");
          template = getDefaultBDITemplate(certType);
        }
      }

      // Para certificados de 8 horas, ADI, BDI, Insurance y Youthful Offender, siempre usar 3 por página
      const certsPerPage = (is8Hours || isAdi || isBdi || isInsurance || isYouthfulOffender) ? 3 : (template.certificatesPerPage || 1);
      console.log(`📄 Template: ${template.name} has ${certsPerPage} certificates per page`);

      const zip = new JSZip();

      if (is8Hours) {
        console.log('🎓 Using 8-hours certificate generator for multiple PDFs');
        const result = await generateMultiple8HoursCertificates(validStudents, '/templates_certificates/8-hours.pdf');
        const pdfBlobs = Array.isArray(result) ? result : [result];

        pdfBlobs.forEach((pdfBlob, index) => {
          const certsInThisPdf = Math.min(3, validStudents.length - (index * 3));
          const pdfFileName = `Certificados_Grupo_${index + 1}_${certsInThisPdf}_certs.pdf`;
          zip.file(pdfFileName, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_${pdfBlobs.length}_PDFs_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${pdfBlobs.length} PDF(s) generados con ${validStudents.length} certificado(s) en total`);
      } else if (isAdi) {
        console.log('🎓 Using ADI certificate generator for multiple PDFs');
        const result = await generateMultipleAdiCertificates(validStudents, '/templates_certificates/adi.pdf');
        const pdfBlobs = Array.isArray(result) ? result : [result];

        pdfBlobs.forEach((pdfBlob, index) => {
          const certsInThisPdf = Math.min(3, validStudents.length - (index * 3));
          const pdfFileName = `Certificados_ADI_Grupo_${index + 1}_${certsInThisPdf}_certs.pdf`;
          zip.file(pdfFileName, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_ADI_${pdfBlobs.length}_PDFs_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${pdfBlobs.length} PDF(s) ADI generados con ${validStudents.length} certificado(s) en total`);
      } else if (isBdi) {
        console.log('🎓 Using BDI certificate generator for multiple PDFs');
        const result = await generateMultipleBdiCertificates(validStudents, '/templates_certificates/bdi.pdf');
        const pdfBlobs = Array.isArray(result) ? result : [result];

        pdfBlobs.forEach((pdfBlob, index) => {
          const certsInThisPdf = Math.min(3, validStudents.length - (index * 3));
          const pdfFileName = `Certificados_BDI_Grupo_${index + 1}_${certsInThisPdf}_certs.pdf`;
          zip.file(pdfFileName, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_BDI_${pdfBlobs.length}_PDFs_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${pdfBlobs.length} PDF(s) BDI generados con ${validStudents.length} certificado(s) en total`);
      } else if (isInsurance) {
        console.log('🎓 Using Insurance certificate generator for multiple PDFs');
        const result = await generateMultipleInsuranceCertificates(validStudents, '/templates_certificates/insurance.pdf');
        const pdfBlobs = Array.isArray(result) ? result : [result];

        pdfBlobs.forEach((pdfBlob, index) => {
          const certsInThisPdf = Math.min(3, validStudents.length - (index * 3));
          const pdfFileName = `Certificados_Insurance_Grupo_${index + 1}_${certsInThisPdf}_certs.pdf`;
          zip.file(pdfFileName, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_Insurance_${pdfBlobs.length}_PDFs_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${pdfBlobs.length} PDF(s) Insurance generados con ${validStudents.length} certificado(s) en total`);
      } else if (isYouthfulOffender) {
        console.log('🎓 Using Youthful Offender certificate generator for multiple PDFs');
        const result = await generateMultipleYouthfulOffenderCertificates(validStudents, '/templates_certificates/youthful-offender-class.pdf');
        const pdfBlobs = Array.isArray(result) ? result : [result];

        pdfBlobs.forEach((pdfBlob, index) => {
          const certsInThisPdf = Math.min(3, validStudents.length - (index * 3));
          const pdfFileName = `Certificados_YO_Grupo_${index + 1}_${certsInThisPdf}_certs.pdf`;
          zip.file(pdfFileName, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_YO_${pdfBlobs.length}_PDFs_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${pdfBlobs.length} PDF(s) YO generados con ${validStudents.length} certificado(s) en total`);
      } else if (isDate) {
        console.log('🎓 Using DATE certificate generator for ZIP download');
        const pdfBlobs = await generateMultipleDateCertificates(validStudents);

        pdfBlobs.forEach((pdfBlob, index) => {
          const student = validStudents[index];
          const name = `${student.first_name} ${student.last_name}`.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          const pdfFileName = `${name.replace(/\s+/g, "_")}_Certificado_DATE_${student.certn}.pdf`;
          zip.file(pdfFileName, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_DATE_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${validStudents.length} certificado(s) DATE generados (1 por estudiante)`);
      } else {
        console.log('🎓 Using standard certificate generator for multiple PDFs');
        const numPDFs = Math.ceil(validStudents.length / certsPerPage);

        for (let i = 0; i < numPDFs; i++) {
          const start = i * certsPerPage;
          const end = Math.min(start + certsPerPage, validStudents.length);
          const chunk = validStudents.slice(start, end);

          console.log(`📄 PDF ${i + 1}/${numPDFs}: ${chunk.length} certificate(s)`);
          const pdfBlob = await generateMultipleCertificatesPDF(chunk, template);
          const pdfFileName = `Certificados_Grupo_${i + 1}_${chunk.length}_certs.pdf`;
          zip.file(pdfFileName, pdfBlob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `Certificados_${numPDFs}_PDFs_${validStudents.length}_estudiantes_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, zipFileName);

        setRowSelection({});
        toast.dismiss(loadingToast);
        toast.success(`${numPDFs} PDF(s) generados con ${validStudents.length} certificado(s) en total`);
      }
    } catch (error) {
      console.error("Error generating ZIP:", error);
      toast.dismiss(loadingToast);
      toast.error("Error al generar los certificados. Intente nuevamente.");
    }
  }, [generateMultiple8HoursCertificates, generateMultipleAdiCertificates, generateMultipleBdiCertificates, generateMultipleYouthfulOffenderCertificates, generateMultipleCertificatesPDF, table, setRowSelection]);

  const downloadCombinedCertificates = useCallback(async (targetPages: number = 1) => {
    const selectedRows = table
      .getSelectedRowModel()
      .flatRows.map((row) => row.original as Student);

    if (selectedRows.length === 0) {
      toast.error("Por favor seleccione al menos un estudiante para descargar certificados.");
      return;
    }

    // Filtering students that have a certificate number (including 0)
    const validStudents = selectedRows.filter(
      (student) => student.certn !== null && student.certn !== undefined
    );

    const invalidStudents = selectedRows.filter(
      (student) => student.certn === null || student.certn === undefined
    );

    if (validStudents.length === 0) {
      toast.error("No hay estudiantes válidos para descargar certificados. Verifique que tengan número de certificado.");
      return;
    }

    if (invalidStudents.length > 0) {
      toast(`${invalidStudents.length} estudiante(s) fueron omitidos por no tener número de certificado.`, {
        icon: '⚠️',
        style: {
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeaa7'
        }
      });
    }

    const loadingToast = toast.loading(`Generando PDF(s) con ${validStudents.length} certificado(s)...`);

    try {
      // Get template to know certificatesPerPage
      const { type, classType } = validStudents[0];
      const certType = (classType || type || 'DATE').toUpperCase();

      console.log(`🔍 Student data:`, validStudents[0]);
      console.log(`📋 Resolved certType: ${certType}`);

      const templateResponse = await fetch(`/api/certificate-templates?classType=${certType}`);
      let template = null;

      if (templateResponse.ok) {
        const templates = await templateResponse.json();
        console.log(`📥 Templates from API:`, templates);
        if (templates.length > 0) {
          template = templates[0];
          console.log(`✅ Using template from database:`, template.name);
        }
      }

      // Detectar si es un certificado de 8 horas, ADI, BDI, Insurance, DATE o Youthful Offender
      const is8Hours = certType.includes('8-HOURS') || certType.includes('8 HOURS');
      const isAdi = certType.includes('ADI');
      const isBdi = certType.includes('BDI');
      const isInsurance = certType.includes('INSURANCE');
      const isDate = certType === 'DATE';
      const isYouthfulOffender = certType.includes('YOUTHFUL OFFENDER') || certType.includes('YOUTHFUL-OFFENDER');

      if (!template) {
        if (isDate) {
          console.log(`⚠️ No template found for DATE, using DATE template`);
          // Para DATE, crear un template básico con el path correcto
          template = {
            name: 'DATE Certificate',
            certificatesPerPage: 1,
            pdfTemplatePath: '/templates_certificates/date.pdf',
            pageSize: { width: 792, height: 612, orientation: 'landscape' },
            background: {
              type: 'pdf',
              value: '/templates_certificates/date.pdf'
            },
            shapeElements: [],
            textElements: [],
            imageElements: [],
            checkboxElements: [],
            availableVariables: []
          };
        } else {
          console.log(`⚠️ No template found, using default BDI template for ${certType}`);
          const { getDefaultBDITemplate } = await import("@/lib/defaultTemplates/bdiTemplate");
          template = getDefaultBDITemplate(certType);
        }
      }

      // Para certificados de 8 horas, ADI, BDI, Insurance y Youthful Offender, siempre usar 3 por página
      const certsPerPage = (is8Hours || isAdi || isBdi || isInsurance || isYouthfulOffender) ? 3 : (template.certificatesPerPage || 1);
      console.log(`📄 Template: ${template.name} has ${certsPerPage} certificates per page`);
      console.log(`👥 ${validStudents.length} students selected`);

      // Generar un solo PDF con TODOS los estudiantes en múltiples páginas
      console.log(`✅ Generating combined PDF with ALL ${validStudents.length} certificate(s) across multiple pages`);

      let pdfBlob: Blob;
      if (is8Hours) {
        console.log('🎓 Using 8-hours certificate generator');
        const result = await generateMultiple8HoursCertificates(validStudents, '/templates_certificates/8-hours.pdf');
        // Si hay múltiples PDFs, combinarlos
        if (Array.isArray(result) && result.length > 1) {
          console.log(`📄 Combining ${result.length} PDFs into one`);
          const combinedPdf = await PDFDocument.create();
          for (const pdfBlobItem of result) {
            const pdfBytes = await pdfBlobItem.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => combinedPdf.addPage(page));
          }
          pdfBlob = new Blob([await combinedPdf.save()], { type: 'application/pdf' });
        } else {
          pdfBlob = Array.isArray(result) ? result[0] : result;
        }
      } else if (isAdi) {
        console.log('🎓 Using ADI certificate generator');
        const result = await generateMultipleAdiCertificates(validStudents, '/templates_certificates/adi.pdf');
        if (Array.isArray(result) && result.length > 1) {
          console.log(`📄 Combining ${result.length} PDFs into one`);
          const combinedPdf = await PDFDocument.create();
          for (const pdfBlobItem of result) {
            const pdfBytes = await pdfBlobItem.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => combinedPdf.addPage(page));
          }
          pdfBlob = new Blob([await combinedPdf.save()], { type: 'application/pdf' });
        } else {
          pdfBlob = Array.isArray(result) ? result[0] : result;
        }
      } else if (isBdi) {
        console.log('🎓 Using BDI certificate generator');
        const result = await generateMultipleBdiCertificates(validStudents, '/templates_certificates/bdi.pdf');
        if (Array.isArray(result) && result.length > 1) {
          console.log(`📄 Combining ${result.length} PDFs into one`);
          const combinedPdf = await PDFDocument.create();
          for (const pdfBlobItem of result) {
            const pdfBytes = await pdfBlobItem.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => combinedPdf.addPage(page));
          }
          pdfBlob = new Blob([await combinedPdf.save()], { type: 'application/pdf' });
        } else {
          pdfBlob = Array.isArray(result) ? result[0] : result;
        }
      } else if (isInsurance) {
        console.log('🎓 Using Insurance certificate generator');
        const result = await generateMultipleInsuranceCertificates(validStudents, '/templates_certificates/insurance.pdf');
        if (Array.isArray(result) && result.length > 1) {
          console.log(`📄 Combining ${result.length} PDFs into one`);
          const combinedPdf = await PDFDocument.create();
          for (const pdfBlobItem of result) {
            const pdfBytes = await pdfBlobItem.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => combinedPdf.addPage(page));
          }
          pdfBlob = new Blob([await combinedPdf.save()], { type: 'application/pdf' });
        } else {
          pdfBlob = Array.isArray(result) ? result[0] : result;
        }
      } else if (isYouthfulOffender) {
        console.log('🎓 Using Youthful Offender certificate generator');
        const result = await generateMultipleYouthfulOffenderCertificates(validStudents, '/templates_certificates/youthful-offender-class.pdf');
        if (Array.isArray(result) && result.length > 1) {
          console.log(`📄 Combining ${result.length} PDFs into one`);
          const combinedPdf = await PDFDocument.create();
          for (const pdfBlobItem of result) {
            const pdfBytes = await pdfBlobItem.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => combinedPdf.addPage(page));
          }
          pdfBlob = new Blob([await combinedPdf.save()], { type: 'application/pdf' });
        } else {
          pdfBlob = Array.isArray(result) ? result[0] : result;
        }
      } else if (isDate) {
        console.log('🎓 Using DATE certificate generator for combined PDF');
        pdfBlob = await generateCombinedDateCertificates(validStudents);
      } else {
        console.log('🎓 Using standard certificate generator');
        pdfBlob = await generateMultipleCertificatesPDF(validStudents, template);
      }

      const fileName = `Certificados_Combinados_${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(pdfBlob, fileName);

      setRowSelection({});
      toast.dismiss(loadingToast);
      const pagesNeeded = Math.ceil(validStudents.length / certsPerPage);
      toast.success(`PDF generado con ${validStudents.length} certificado(s) en ${pagesNeeded} página(s)`);
    } catch (error) {
      console.error("Error generating combined PDF:", error);
      toast.dismiss(loadingToast);
      toast.error("Error al generar el PDF combinado. Intente nuevamente.");
    }
  }, [generateMultipleCertificatesPDF, generateMultiple8HoursCertificates, generateMultipleAdiCertificates, generateMultipleBdiCertificates, generateMultipleInsuranceCertificates, generateMultipleYouthfulOffenderCertificates, table, setRowSelection]);

  const downloadSingleCertificate = useCallback(
    async (user: Student) => {
      // Validación básica - solo verificar que el número de certificado exista (puede ser 0)
      if (user.certn === null || user.certn === undefined) {
        toast.error(`El estudiante ${user.first_name} ${user.last_name} no tiene número de certificado asignado. Contacte al administrador.`);
        return;
      }

      // Proceed directly with generation using unified certificate generator
      await proceedWithGeneration(user);
    },
    [generateCertificatePDF, generateSingle8HoursCertificate, generateSingleAdiCertificate, generateSingleBdiCertificate, generateSingleInsuranceCertificate, generateSingleYouthfulOffenderCertificate]
  );

  const proceedWithGeneration = async (user: Student) => {
    const loadingToast = toast.loading("Generando certificado...");

    try {
      // Detectar si es un certificado de 8 horas, ADI, BDI, Insurance o Youthful Offender
      const classType = user.classType?.toUpperCase() || '';
      const is8Hours = classType.includes('8-HOURS') || classType.includes('8 HOURS');
      const isAdi = classType.includes('ADI');
      const isBdi = classType.includes('BDI');
      const isInsurance = classType.includes('INSURANCE');
      const isYouthfulOffender = classType.includes('YOUTHFUL OFFENDER') || classType.includes('YOUTHFUL-OFFENDER');

      let pdfBlob: Blob;

      if (is8Hours) {
        // Usar generador de 8 horas con coordenadas exactas
        console.log('🎓 Using 8-hours certificate generator');
        pdfBlob = await generateSingle8HoursCertificate(user, '/templates_certificates/8-hours.pdf');
      } else if (isAdi) {
        // Usar generador ADI con coordenadas exactas
        console.log('🎓 Using ADI certificate generator');
        pdfBlob = await generateSingleAdiCertificate(user, '/templates_certificates/adi.pdf');
      } else if (isBdi) {
        // Usar generador BDI con coordenadas exactas
        console.log('🎓 Using BDI certificate generator');
        pdfBlob = await generateSingleBdiCertificate(user, '/templates_certificates/bdi.pdf');
      } else if (isInsurance) {
        // Usar generador Insurance con coordenadas exactas
        console.log('🎓 Using Insurance certificate generator');
        pdfBlob = await generateSingleInsuranceCertificate(user, '/templates_certificates/insurance.pdf');
      } else if (isYouthfulOffender) {
        // Usar generador Youthful Offender con coordenadas exactas
        console.log('🎓 Using Youthful Offender certificate generator');
        pdfBlob = await generateSingleYouthfulOffenderCertificate(user, '/templates_certificates/youthful-offender-class.pdf');
      } else {
        // Usar generador unificado estándar
        console.log('🎓 Using standard certificate generator');
        pdfBlob = await generateCertificatePDF(user);
      }

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
        onDownloadCombined={downloadCombinedCertificates}
        onDownloadXLSX={downloadXLSX}
        template={template}
      />

      <div className="rounded-md border overflow-x-auto">
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
                <TableHead className="sticky right-0 bg-white z-10 shadow-left">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isEditing = editingRow === row.id;
                const rowData = isEditing ? editedData[row.id] : row.original;
                
                // Debug: Log available columns when editing
                if (isEditing) {
                  console.log('📋 Available columns:', row.getVisibleCells().map(cell => cell.column.id));
                }
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnId = cell.column.id as keyof Student;
                      const cellValue = rowData[columnId];
                      
                      // Debug logs
                      if (isEditing && (columnId === "courseTime" || columnId === "attendanceReason")) {
                        console.log('🔍 Editing cell:', columnId, 'value:', cellValue, 'isEditable:', isEditing);
                      }
                      
                      // Make all fields editable when in edit mode (except select checkbox)
                      const isEditable = isEditing && columnId !== "select";
                      
                      return (
                        <TableCell key={cell.id}>
                          {isEditable ? (
                            // Check if this is a signature field
                            (() => {
                              if (columnId === 'instructorSignature') {
                                return (
                                  <div className="min-w-[400px]">
                                    <SignatureCanvas
                                      currentSignature={cellValue as string}
                                      studentName={`${rowData.first_name} ${rowData.last_name}`}
                                      showApplyToAll={true}
                                      onSave={(url, applyToAll) => {
                                        if (applyToAll) {
                                          // Apply signature to all rows
                                          table.getRowModel().rows.forEach((r) => {
                                            handleChange(r.id, columnId, url);
                                          });
                                        } else {
                                          // Apply only to current row
                                          handleChange(row.id, columnId, url);
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              }

                              // Check if this column has options (checkbox variable)
                              const options = getVariableOptions(columnId as string);
                              if (options && options.length > 0) {
                                // Render as dropdown for checkbox variables
                                return (
                                  <select
                                    value={cellValue || ""}
                                    onChange={(e) => handleChange(row.id, columnId, e.target.value)}
                                    className="border p-1 w-full"
                                  >
                                    <option value="">Select...</option>
                                    {options.map((option: string) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                );
                              } else {
                                // Render as regular input for other fields
                                return (
                                  <input
                                    type={typeof cellValue === "number" ? "number" : "text"}
                                    value={cellValue === "N/A" || cellValue === "-" ? "" : (cellValue || "")}
                                    onChange={(e) => {
                                      const value = typeof cellValue === "number"
                                        ? (e.target.value === "" ? 0 : +e.target.value)
                                        : e.target.value;
                                      handleChange(row.id, columnId, value);
                                    }}
                                    className="border p-1 w-full"
                                    placeholder="Enter value..."
                                  />
                                );
                              }
                            })()
                          ) : (
                            // Display mode - check if it's a signature field
                            columnId === 'instructorSignature' && cellValue ? (
                              <img
                                src={cellValue as string}
                                alt="Signature"
                                className="h-12 border border-gray-300 rounded"
                              />
                            ) : (
                              flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )
                            )
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="sticky right-0 bg-white z-10 shadow-left">
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
