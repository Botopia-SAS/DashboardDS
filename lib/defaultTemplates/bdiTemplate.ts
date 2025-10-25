import { CertificateTemplate } from "@/lib/certificateTypes";

/**
 * BDI Certificate Template - Used as default for all class types (except ADI)
 * This template matches the current BDI certificate design with triple borders
 */
export const getDefaultBDITemplate = (classType: string): Omit<CertificateTemplate, '_id' | 'createdAt' | 'updatedAt'> => ({
  name: `${classType} Certificate (BDI Style)`,
  classType: classType.toUpperCase(),
  pageSize: { width: 792, height: 612, orientation: 'landscape' },
  certificatesPerPage: 1,
  background: { type: 'color', value: '#FFFFFF' },

  // Triple border frames (scaled for Carta 792x612)
  shapeElements: [
    // Outer border (thickest)
    {
      id: 'border-outer',
      type: 'rectangle',
      x: 20,
      y: 20,
      width: 752,
      height: 572,
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
      width: 732,
      height: 552,
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
      width: 712,
      height: 532,
      borderColor: '#000000',
      borderWidth: 2,
      color: 'transparent'
    },
  ],

  textElements: [
    // Header - Title (Top of page) - scaled for Carta 792x612 (+20% total, +3% font)
    {
      id: 'text-title-1',
      content: 'AFFORDABLE DRIVING TRAFFIC SCHOOL',
      x: 396,
      y: 75,
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-title-2',
      content: 'CERTIFICATE OF COMPLETION',
      x: 396,
      y: 110,
      fontSize: 14,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-address',
      content: '3167 FOREST HILL BLVD. WEST PALM BEACH, FL 33406',
      x: 396,
      y: 135,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-phones',
      content: '561-969-0150 / 561-330-7007',
      x: 396,
      y: 148,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Certification text
    {
      id: 'text-certifies-1',
      content: 'This Certifies that the person named below has successfully completed the Florida Dept.',
      x: 396,
      y: 164,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'text-certifies-2',
      content: 'Highway Safety and Motor Vehicles "Drive Safety & Driver Improvement Course"',
      x: 396,
      y: 188,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Left column - Student info (+20% total, +3% font)
    {
      id: 'text-citation-label',
      content: 'Citation No:',
      x: 85,
      y: 235,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-citation-value',
      content: '{{citationNumber}}',
      x: 310,
      y: 235,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    {
      id: 'text-license-label',
      content: 'Driver License Number:',
      x: 85,
      y: 258,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-license-value',
      content: '{{licenseNumber}}',
      x: 310,
      y: 258,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    {
      id: 'text-completion-label',
      content: 'Course Completion Date:',
      x: 85,
      y: 281,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-completion-value',
      content: '{{courseDate}}',
      x: 310,
      y: 281,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    {
      id: 'text-name-label',
      content: 'Name:',
      x: 85,
      y: 304,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-name-value',
      content: '{{studentName}}',
      x: 310,
      y: 304,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },

    {
      id: 'text-location-label',
      content: 'Course Location:',
      x: 85,
      y: 327,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-location-value',
      content: '{{address}}',
      x: 310,
      y: 327,
      fontSize: 11,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },

    // Right side - Certificate number (+20% total, +3% font)
    {
      id: 'text-cert-number-label',
      content: 'Certificate #:',
      x: 555,
      y: 235,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-cert-number-value',
      content: '{{certn}}',
      x: 650,
      y: 235,
      fontSize: 11,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    // Footer - Left side (Bottom of page) (+20% total, +3% font)
    {
      id: 'text-instructor-name',
      content: 'N/A',
      x: 85,
      y: 545,
      fontSize: 9,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-instructor-title',
      content: 'AFFORDABLE DRIVING INSTRUCTOR',
      x: 85,
      y: 557,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    // Footer - Right side (+20% total, +3% font)
    {
      id: 'text-license-footer',
      content: 'LICENSE #',
      x: 590,
      y: 545,
      fontSize: 9,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'text-company-footer',
      content: 'AFFORDABLE DRIVING',
      x: 590,
      y: 557,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
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

  checkboxElements: [],

  isDefault: true,
  isActive: true,
});
