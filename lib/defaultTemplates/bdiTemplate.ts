import { CertificateTemplate } from "@/components/certificate-editor/types";

/**
 * BDI Certificate Template - Used as default for all class types (except ADI)
 * This template matches the current BDI certificate design with triple borders
 */
export const getDefaultBDITemplate = (classType: string): Omit<CertificateTemplate, '_id' | 'createdAt' | 'updatedAt'> => ({
  name: `${classType} Certificate (BDI Style)`,
  classType: classType.toUpperCase(),
  pageSize: { width: 842, height: 595, orientation: 'landscape' },
  background: { type: 'color', value: '#FFFFFF' },

  // Triple border frames (like the PDF you showed)
  shapeElements: [
    // Outer border (thickest)
    {
      id: 'border-outer',
      type: 'rectangle',
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: '#000000',
      borderWidth: 6,
      color: 'transparent'
    },
    // Middle border
    {
      id: 'border-middle',
      type: 'rectangle',
      x: 30,
      y: 30,
      width: 782,
      height: 535,
      borderColor: '#000000',
      borderWidth: 4,
      color: 'transparent'
    },
    // Inner border (thinnest)
    {
      id: 'border-inner',
      type: 'rectangle',
      x: 40,
      y: 40,
      width: 762,
      height: 515,
      borderColor: '#000000',
      borderWidth: 2,
      color: 'transparent'
    },
  ],

  textElements: [
    // Header - Title (Top of page)
    {
      id: 'text-title-1',
      content: 'AFFORDABLE DRIVING TRAFFIC SCHOOL',
      x: 421,
      y: 80,
      fontSize: 22,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-title-2',
      content: 'CERTIFICATE OF COMPLETION',
      x: 421,
      y: 115,
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-address',
      content: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406',
      x: 421,
      y: 145,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-phones',
      content: '561-969-0150 / 561-330-7007',
      x: 421,
      y: 165,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Certification text
    {
      id: 'text-certifies-1',
      content: 'This Certifies that the person named below has successfully completed the Florida Dept.',
      x: 421,
      y: 200,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-certifies-2',
      content: 'Highway Safety and Motor Vehicles "Drive Safety & Driver Improvement Course"',
      x: 421,
      y: 218,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Left column - Student info
    {
      id: 'text-citation-label',
      content: 'Citation No:',
      x: 80,
      y: 260,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
    {
      id: 'text-citation-value',
      content: '{{citationNumber}}',
      x: 300,
      y: 260,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },

    {
      id: 'text-license-label',
      content: 'Driver License Number:',
      x: 80,
      y: 290,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
    {
      id: 'text-license-value',
      content: '{{licenseNumber}}',
      x: 300,
      y: 290,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },

    {
      id: 'text-completion-label',
      content: 'Course Completion Date:',
      x: 80,
      y: 320,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
    {
      id: 'text-completion-value',
      content: '{{courseDate}}',
      x: 300,
      y: 320,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },

    {
      id: 'text-name-label',
      content: 'Name:',
      x: 80,
      y: 350,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
    {
      id: 'text-name-value',
      content: '{{studentName}}',
      x: 300,
      y: 350,
      fontSize: 13,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000'
    },

    {
      id: 'text-location-label',
      content: 'Course Location:',
      x: 80,
      y: 380,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
    {
      id: 'text-location-value',
      content: '{{address}}',
      x: 300,
      y: 380,
      fontSize: 13,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000'
    },

    // Right side - Certificate number
    {
      id: 'text-cert-number-label',
      content: 'Certificate #:',
      x: 550,
      y: 260,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
    {
      id: 'text-cert-number-value',
      content: '{{certn}}',
      x: 660,
      y: 260,
      fontSize: 13,
      fontFamily: 'Helvetica',
      color: '#000000'
    },

    // Footer - Left side (Bottom of page)
    {
      id: 'text-instructor-name',
      content: 'N/A',
      x: 80,
      y: 510,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000'
    },
    {
      id: 'text-instructor-title',
      content: 'AFFORDABLE DRIVING INSTRUCTOR',
      x: 80,
      y: 530,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000'
    },

    // Footer - Right side
    {
      id: 'text-license-footer',
      content: 'LICENSE #',
      x: 600,
      y: 510,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000'
    },
    {
      id: 'text-company-footer',
      content: 'AFFORDABLE DRIVING',
      x: 600,
      y: 530,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000'
    },
  ],

  imageElements: [],

  availableVariables: [
    { key: 'studentName', label: 'Student Full Name', example: 'JOHN MICHAEL DOE' },
    { key: 'firstName', label: 'First Name', example: 'JOHN' },
    { key: 'lastName', label: 'Last Name', example: 'DOE' },
    { key: 'middleName', label: 'Middle Name', example: 'MICHAEL' },
    { key: 'certn', label: 'Certificate Number', example: '45356' },
    { key: 'citationNumber', label: 'Citation Number', example: '' },
    { key: 'licenseNumber', label: 'License Number', example: '' },
    { key: 'courseDate', label: 'Course Completion Date', example: '10/9/2025' },
    { key: 'address', label: 'Course Location', example: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406' },
    { key: 'instructorName', label: 'Instructor Name', example: 'N/A' },
    { key: 'classTitle', label: 'Class Title', example: 'Drive Safety & Driver Improvement Course' },
    { key: 'classType', label: 'Class Type', example: classType.toUpperCase() },
  ],

  isDefault: true,
  isActive: true,
});
