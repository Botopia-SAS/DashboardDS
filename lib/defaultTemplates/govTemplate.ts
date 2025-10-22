import { CertificateTemplate } from "@/components/certificate-editor/types";

/**
 * GOV Certificate Template - Government Form Style
 * Based on the GOV certificate design from certificate-preview.tsx
 * Adjusted for letter size horizontal (792 x 612 pt)
 */
export function getGovTemplate(classType: string = "DATE"): CertificateTemplate {
  
  // Define checkboxes based on classType
  let checkboxElements = [];
  let shapeElements = [];
  let textElements = [];
  
  // Base text elements (always present)
  const baseTextElements = [
    // Header - Title
    {
      id: 'text-header-title',
      content: 'CERTIFICATE OF COMPLETION',
      x: 396, // Center of 792
      y: 80,
      fontSize: 18,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'center' as const,
    },
    {
      id: 'text-header-subtitle',
      content: 'This certificate validates that the named person has successfully completed a',
      x: 396,
      y: 110,
      fontSize: 9,
      fontFamily: 'Times-Italic',
      color: '#7a3a2e',
      align: 'center' as const,
      italic: true,
    },
    {
      id: 'text-course-title',
      content: '{{courseTitle}}',
      x: 396,
      y: 120,
      fontSize: 14,
      fontFamily: 'Times-BoldItalic',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'center' as const,
      italic: true,
    },
    {
      id: 'text-course-subtitle',
      content: 'AN UNDER 25 YOUTHFUL OFFENDER COURSE',
      x: 396,
      y: 140,
      fontSize: 9,
      fontFamily: 'Times-Italic',
      color: '#7a3a2e',
      align: 'center' as const,
      italic: true,
    },

    // Citation/Case No, Court, County, Certificate Number - Labels
    {
      id: 'text-citation-label',
      content: 'Citation/Case No:',
      x: 80,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-court-label',
      content: 'Court:',
      x: 320,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-county-label',
      content: 'County:',
      x: 470,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-cert-number-label',
      content: 'Certificate Number:',
      x: 600,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },

    // Citation/Case No, Court, County, Certificate Number - Values (same Y as labels)
    {
      id: 'text-citation-value',
      content: '{{citationNumber}}',
      x: 165,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: '#000000',
      align: 'left' as const,
    },
    {
      id: 'text-court-value',
      content: '{{court}}',
      x: 355,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: '#000000',
      align: 'left' as const,
    },
    {
      id: 'text-county-value',
      content: '{{county}}',
      x: 515,
      y: 210,
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: '#000000',
      align: 'left' as const,
    },
    {
      id: 'text-cert-number-value',
      content: '{{certn}}',
      x: 650,
      y: 225,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#000000',
      align: 'left' as const,
    },

    // Name
    {
      id: 'text-name-label',
      content: 'NAME:',
      x: 80,
      y: 280,
      fontSize: 12,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-name-first',
      content: '{{firstName}}',
      x: 140,
      y: 280,
      fontSize: 12,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#000000',
      align: 'left' as const,
    },
    {
      id: 'text-name-first-label',
      content: 'FIRST',
      x: 140,
      y: 295,
      fontSize: 8,
      fontFamily: 'Times-Roman',
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-name-middle',
      content: '{{middleInitial}}',
      x: 340,
      y: 280,
      fontSize: 12,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#000000',
      align: 'left' as const,
    },
    {
      id: 'text-name-middle-label',
      content: 'MI',
      x: 340,
      y: 295,
      fontSize: 8,
      fontFamily: 'Times-Roman',
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-name-last',
      content: '{{lastName}}',
      x: 540,
      y: 280,
      fontSize: 12,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#000000',
      align: 'left' as const,
    },
    {
      id: 'text-name-last-label',
      content: 'LAST',
      x: 540,
      y: 295,
      fontSize: 8,
      fontFamily: 'Times-Roman',
      color: '#c94a3a',
      align: 'left' as const,
    },

    // Drivers License
    {
      id: 'text-license-label',
      content: 'Drivers License No:',
      x: 80,
      y: 350,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-license-value',
      content: '{{licenseNumber}}',
      x: 205,
      y: 350,
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: '#000000',
      align: 'left' as const,
    },

    // Completion Date
    {
      id: 'text-completion-label',
      content: 'Completion Date:',
      x: 380,
      y: 350,
      fontSize: 10,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-completion-value',
      content: '{{completionDate}}',
      x: 485,
      y: 350,
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: '#000000',
      align: 'left' as const,
    },

    // Instructor Signature
    {
      id: 'text-instructor-signature-label',
      content: "Instructor's Signature:",
      x: 80,
      y: 420,
      fontSize: 9,
      fontFamily: 'Times-Roman',
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-instructor-signature-value',
      content: '{{instructorSignature}}',
      x: 210,
      y: 420,
      fontSize: 10,
      fontFamily: 'Times-Italic',
      color: '#000000',
      align: 'left' as const,
      italic: true,
    },

    // Instructor School Name
    {
      id: 'text-instructor-school-label',
      content: "Instructor's School Name:",
      x: 430,
      y: 420,
      fontSize: 9,
      fontFamily: 'Times-Roman',
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-instructor-school-value',
      content: '{{instructorSchoolName}}',
      x: 580,
      y: 420,
      fontSize: 10,
      fontFamily: 'Times-Roman',
      color: '#000000',
      align: 'left' as const,
    },

    // Footer - Provider Info
    {
      id: 'text-provider-label',
      content: 'COURSE PROVIDER',
      x: 80,
      y: 490,
      fontSize: 8,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-provider-name',
      content: 'DRIVER TRAINING ASSOCIATES, INC.',
      x: 80,
      y: 500,
      fontSize: 8,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-provider-phone',
      content: '1-800-222-9199',
      x: 80,
      y: 510,
      fontSize: 8,
      fontFamily: 'Times-Roman',
      color: '#c94a3a',
      align: 'left' as const,
    },
    {
      id: 'text-school-name',
      content: 'Affordable Driving & Traffic School',
      x: 720,
      y: 488,
      fontSize: 8,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#0000ff',
      align: 'right' as const,
    },
    {
      id: 'text-school-phone',
      content: '(561) 969-0150',
      x: 720,
      y: 502,
      fontSize: 8,
      fontFamily: 'Times-Bold',
      fontWeight: 'bold' as const,
      color: '#0000ff',
      align: 'right' as const,
    },
  ];

  // Add dynamic checkboxes based on classType
  if (classType.toLowerCase().includes('ticket')) {
    // For TICKET classes - only show Attendance checkboxes
    textElements = [
      ...baseTextElements,
    ];

    checkboxElements = [
      {
        id: 'checkbox-attendance',
        title: 'Attendance',
        x: 320,
        y: 245,
        orientation: 'horizontal' as const,
        options: ['Court Order', 'Volunteer', 'Ticket/Citation'],
        variableKey: 'attendanceReason',
        fontSize: 10,
        fontFamily: 'Times-Bold',
        color: '#c94a3a',
        borderColor: '#c94a3a',
        borderWidth: 1.5,
        checkboxSize: 12,
      },
    ];

    shapeElements = [
      { id: 'checkbox-attendanceReason-Court Order', type: 'rectangle' as const, x: 320, y: 245, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-attendanceReason-Volunteer', type: 'rectangle' as const, x: 400, y: 245, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-attendanceReason-Ticket/Citation', type: 'rectangle' as const, x: 480, y: 245, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
    ];
  } else {
    // For DATE and other classes - show both Course Time and Attendance checkboxes
    textElements = [
      ...baseTextElements,
    ];

    checkboxElements = [
      {
        id: 'checkbox-course-time',
        title: 'COURSE TIME',
        x: 80,
        y: 185,
        orientation: 'horizontal' as const,
        options: ['4hr', '6hr', '8hr'],
        variableKey: 'courseTime',
        fontSize: 10,
        fontFamily: 'Times-Bold',
        color: '#c94a3a',
        borderColor: '#c94a3a',
        borderWidth: 1.5,
        checkboxSize: 12,
      },
      {
        id: 'checkbox-attendance',
        title: 'Attendance',
        x: 320,
        y: 245,
        orientation: 'horizontal' as const,
        options: ['Court Order', 'Volunteer', 'Ticket/Citation'],
        variableKey: 'attendanceReason',
        fontSize: 10,
        fontFamily: 'Times-Bold',
        color: '#c94a3a',
        borderColor: '#c94a3a',
        borderWidth: 1.5,
        checkboxSize: 12,
      },
    ];

    shapeElements = [
      { id: 'checkbox-courseTime-4hr', type: 'rectangle' as const, x: 80, y: 185, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-courseTime-6hr', type: 'rectangle' as const, x: 160, y: 185, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-courseTime-8hr', type: 'rectangle' as const, x: 240, y: 185, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-attendanceReason-Court Order', type: 'rectangle' as const, x: 320, y: 245, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-attendanceReason-Volunteer', type: 'rectangle' as const, x: 400, y: 245, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
      { id: 'checkbox-attendanceReason-Ticket/Citation', type: 'rectangle' as const, x: 480, y: 245, width: 12, height: 12, color: 'transparent', borderColor: '#c94a3a', borderWidth: 1.5 },
    ];
  }
  
  return {
    name: "Government Form (GOV Style)",
    classType: classType,
    pageSize: {
      width: 792, // Letter width in landscape
      height: 612, // Letter height in landscape
      orientation: 'landscape',
    },
    certificatesPerPage: 1,
    background: {
      type: 'color',
      value: '#ffffff',
    },
    textElements: textElements,
    imageElements: [
      // Left Logo
      {
        id: 'image-left-logo',
        url: '/logo-izq.png',
        x: 50,
        y: 70,
        width: 120,
        height: 70,
        grayscale: false,
      },
      // Right Logo
      {
        id: 'image-right-logo',
        url: '/logo-der.png',
        x: 650,
        y: 80,
        width: 80,
        height: 60,
        grayscale: false,
      },
    ],
    shapeElements: shapeElements,
    checkboxElements: checkboxElements,
    availableVariables: [
      { key: 'firstName', label: 'First Name', example: 'JOHN' },
      { key: 'middleInitial', label: 'Middle Initial', example: 'M' },
      { key: 'lastName', label: 'Last Name', example: 'DOE' },
      { key: 'licenseNumber', label: 'License Number', example: 'D123456789' },
      { key: 'citationNumber', label: 'Citation Number', example: '12345' },
      { key: 'court', label: 'Court', example: 'County Court' },
      { key: 'county', label: 'County', example: 'Palm Beach' },
      { key: 'completionDate', label: 'Completion Date', example: '10/14/2025' },
      { key: 'certn', label: 'Certificate Number', example: '1234' },
      { key: 'courseTitle', label: 'Course Title', example: 'DTA STUDENT TRAFFIC OFFENDER PROGRAM' },
      { key: 'deliveryMode', label: 'Delivery Mode', example: 'In Person Class' },
      { key: 'instructorSignature', label: 'Instructor Signature', example: 'John Smith' },
      { key: 'instructorSchoolName', label: 'Instructor School Name', example: 'ABC Driving School' },
      { key: 'providerName', label: 'Provider Name', example: 'Affordable Driving & Traffic School' },
      { key: 'providerPhone', label: 'Provider Phone', example: '(561) 969-0150' },
      // Dynamic checkbox variables based on classType
      ...(classType.toLowerCase().includes('ticket') ? [
        { 
          key: 'attendanceReason', 
          label: 'Attendance Reason', 
          example: 'Court Order',
          options: ['Court Order', 'Volunteer', 'Ticket/Citation']
        },
      ] : [
        { 
          key: 'courseTime', 
          label: 'Course Time', 
          example: '4hr',
          options: ['4hr', '6hr', '8hr']
        },
        { 
          key: 'attendanceReason', 
          label: 'Attendance Reason', 
          example: 'Court Order',
          options: ['Court Order', 'Volunteer', 'Ticket/Citation']
        },
      ]),
    ],
    isDefault: false,
    isActive: true,
  };
}

