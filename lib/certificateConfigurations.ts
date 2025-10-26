/**
 * Certificate Configurations
 *
 * Centralized configuration for all certificate types.
 * Each certificate type defines:
 * - PDF template path
 * - Certificates per page (1 = single, 2-3 = multiple)
 * - Required variables/columns for the table
 * - Whether to show "Download combined PDF" button
 */

export interface CertificateConfig {
  classType: string;
  name: string;
  pdfTemplate: string;
  certificatesPerPage: 1 | 2 | 3; // 1 = solo, 2-3 = múltiple
  pageSize: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  // Variables que se mostrarán como columnas en la tabla
  tableVariables: Array<{
    key: string;
    label: string;
    example: string;
    options?: string[]; // Para dropdowns
  }>;
  // Si debe mostrar el botón morado "Download combined PDF (dynamic)"
  allowCombinedPDF: boolean;
  // Si usa coordenadas multi-posición (para certificados con 2-3 por página)
  useMultiPositionCoordinates?: boolean;
}

/**
 * Configuraciones de certificados por tipo
 */
export const CERTIFICATE_CONFIGURATIONS: Record<string, CertificateConfig> = {
  DATE: {
    classType: 'DATE',
    name: 'DATE Certificate (Official)',
    pdfTemplate: '/templates_certificates/date.pdf',
    certificatesPerPage: 1, // Solo 1 certificado por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JORGE' },
      { key: 'lastName', label: 'Last Name', example: 'GUARIN' },
      { key: 'birthDate', label: 'Date of Birth', example: '4/8/1967' },
      { key: 'courseDate', label: 'Completion Date', example: 'Oct 14, 2025' },
      { key: 'address', label: 'Course Location', example: 'Palm Beach County, FL' },
    ],
    allowCombinedPDF: false, // NO mostrar botón morado
  },

  ADI: {
    classType: 'ADI',
    name: 'ADI Certificate',
    pdfTemplate: '/templates_certificates/adi.pdf',
    certificatesPerPage: 3, // 3 certificados por página como 8-hours
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'middleName', label: 'Middle Name', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      { key: 'licenseNumber', label: 'License Number', example: 'D123-456-78-910-0' },
      { key: 'courseDate', label: 'Completion Date', example: 'Nov 10, 2025' },
      { key: 'address', label: 'Course Location', example: 'Palm Beach County, FL' },
      { key: 'citationNumber', label: 'Citation Number', example: '2024-TC-12345' },
      { key: 'certn', label: 'Certificate Number', example: '100' },
    ],
    allowCombinedPDF: true, // Habilitar botón morado para múltiples certificados
    useMultiPositionCoordinates: true, // Usar sistema de coordenadas múltiples
  },

  BDI: {
    classType: 'BDI',
    name: 'BDI Certificate (Basic Driving Improvement)',
    pdfTemplate: '/templates_certificates/bdi.pdf',
    certificatesPerPage: 3, // 3 certificados por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JANE' },
      { key: 'middleName', label: 'Middle Name', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'SMITH' },
      { key: 'licenseNumber', label: 'License Number', example: 'A123456789' },
      { key: 'courseDate', label: 'Completion Date', example: 'Dec 1, 2025' },
      { key: 'citationNumber', label: 'Citation Number', example: '2025-TC-12345' },
      { key: 'certn', label: 'Certificate Number', example: 'BDI-2025-001' },
      { key: 'address', label: 'Course Location', example: 'Palm Beach County, FL' },
    ],
    allowCombinedPDF: true, // SÍ mostrar botón morado
    useMultiPositionCoordinates: true, // Usa coordenadas multi-posición
  },

  // Certificados de 8 horas (IDI, Aggressive, Suspension)
  '8-HOURS-IDI': {
    classType: '8-HOURS-IDI',
    name: '8 Hours IDI Certificate',
    pdfTemplate: '/templates_certificates/8-hours.pdf',
    certificatesPerPage: 3, // 3 certificados por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'middleName', label: 'Middle Name', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      {
        key: 'courseTime',
        label: 'Course Time',
        example: '8hr (IDI)',
        options: ['4hr', '8hr (IDI)', '8hr (Aggressive)', '8hr (Suspension)']
      },
      { key: 'circuitCourtNo', label: 'Circuit Court No', example: '12345' },
      { key: 'county', label: 'County', example: 'Palm Beach' },
      {
        key: 'attendance',
        label: 'Attendance',
        example: 'Court Order',
        options: ['Court Order', 'Volunteer']
      },
      { key: 'licenseNumber', label: 'Driver License No', example: 'D123-456-78-910-0' },
      { key: 'courseDate', label: 'Completion Date', example: 'Nov 10, 2025' },
      { key: 'instructorSignature', label: 'Instructor Signature', example: '(Canvas - Upload)' },
      { key: 'schoolOfficial', label: 'School Official', example: 'Official Name' },
    ],
    allowCombinedPDF: true, // SÍ mostrar botón morado
    useMultiPositionCoordinates: true, // Usa coordenadas específicas por posición
  },

  '8-HOURS-AGGRESSIVE': {
    classType: '8-HOURS-AGGRESSIVE',
    name: '8 Hours Aggressive Certificate',
    pdfTemplate: '/templates_certificates/8-hours.pdf',
    certificatesPerPage: 3, // 3 certificados por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'middleName', label: 'Middle Name', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      {
        key: 'courseTime',
        label: 'Course Time',
        example: '8hr (Aggressive)',
        options: ['4hr', '8hr (IDI)', '8hr (Aggressive)', '8hr (Suspension)']
      },
      { key: 'circuitCourtNo', label: 'Circuit Court No', example: '12345' },
      { key: 'county', label: 'County', example: 'Palm Beach' },
      {
        key: 'attendance',
        label: 'Attendance',
        example: 'Court Order',
        options: ['Court Order', 'Volunteer']
      },
      { key: 'licenseNumber', label: 'Driver License No', example: 'D123-456-78-910-0' },
      { key: 'courseDate', label: 'Completion Date', example: 'Nov 10, 2025' },
      { key: 'instructorSignature', label: 'Instructor Signature', example: '(Canvas - Upload)' },
      { key: 'schoolOfficial', label: 'School Official', example: 'Official Name' },
    ],
    allowCombinedPDF: true, // SÍ mostrar botón morado
    useMultiPositionCoordinates: true, // Usa coordenadas específicas por posición
  },

  '8-HOURS-SUSPENSION': {
    classType: '8-HOURS-SUSPENSION',
    name: '8 Hours Suspension Certificate',
    pdfTemplate: '/templates_certificates/8-hours.pdf',
    certificatesPerPage: 3, // 3 certificados por hoja
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'middleName', label: 'Middle Name', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      {
        key: 'courseTime',
        label: 'Course Time',
        example: '8hr (Suspension)',
        options: ['4hr', '8hr (IDI)', '8hr (Aggressive)', '8hr (Suspension)']
      },
      { key: 'circuitCourtNo', label: 'Circuit Court No', example: '12345' },
      { key: 'county', label: 'County', example: 'Palm Beach' },
      {
        key: 'attendance',
        label: 'Attendance',
        example: 'Court Order',
        options: ['Court Order', 'Volunteer']
      },
      { key: 'licenseNumber', label: 'Driver License No', example: 'D123-456-78-910-0' },
      { key: 'courseDate', label: 'Completion Date', example: 'Nov 10, 2025' },
      { key: 'instructorSignature', label: 'Instructor Signature', example: '(Canvas - Upload)' },
      { key: 'schoolOfficial', label: 'School Official', example: 'Official Name' },
    ],
    allowCombinedPDF: true, // SÍ mostrar botón morado
    useMultiPositionCoordinates: true, // Usa coordenadas específicas por posición
  },

  // Youthful Offender Class
  'YOUTHFUL-OFFENDER-CLASS': {
    classType: 'YOUTHFUL OFFENDER CLASS',
    name: 'Youthful Offender Class Certificate',
    pdfTemplate: '/templates_certificates/youthful-offender-class.pdf',
    certificatesPerPage: 3, // 3 certificados por hoja como 8-hours
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'citationNumber', label: 'Citation/Case No', example: '2025-TC-12345' },
      { key: 'court', label: 'Court', example: 'Circuit Court' },
      { key: 'county', label: 'County', example: 'Palm Beach County, FL' },
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'middleName', label: 'Middle Name', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      { key: 'licenseNumber', label: 'License Number', example: 'D123-456-78-910-0' },
      { key: 'courseDate', label: 'Completion Date', example: 'Nov 10, 2025' },
      { key: 'certn', label: 'Certificate Number', example: 'YO-2025-001' },
    ],
    allowCombinedPDF: true, // SÍ mostrar botón morado
    useMultiPositionCoordinates: true, // Usa coordenadas específicas por posición
  },

  // Otros tipos
  GOV: {
    classType: 'GOV',
    name: 'GOV Certificate',
    pdfTemplate: '/templates_certificates/gov.pdf',
    certificatesPerPage: 1,
    pageSize: { width: 792, height: 612, orientation: 'landscape' },
    tableVariables: [
      { key: 'firstName', label: 'First Name', example: 'BOB' },
      { key: 'lastName', label: 'Last Name', example: 'JOHNSON' },
      { key: 'courseDate', label: 'Completion Date', example: 'Jan 15, 2026' },
    ],
    allowCombinedPDF: false,
  },
};

/**
 * Helper function to get configuration for a certificate type
 */
export function getCertificateConfig(classType: string): CertificateConfig | null {
  // Normalize: uppercase and replace spaces with hyphens
  const normalizedType = classType.toUpperCase().replace(/\s+/g, '-');
  return CERTIFICATE_CONFIGURATIONS[normalizedType] || null;
}

/**
 * Helper function to check if a certificate type allows combined PDF
 */
export function allowsCombinedPDF(classType: string): boolean {
  const config = getCertificateConfig(classType);
  return config?.allowCombinedPDF ?? false;
}

/**
 * Helper function to get certificates per page for a type
 */
export function getCertificatesPerPage(classType: string): number {
  const config = getCertificateConfig(classType);
  return config?.certificatesPerPage ?? 1;
}
