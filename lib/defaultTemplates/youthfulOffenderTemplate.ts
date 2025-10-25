import { CertificateTemplate } from "@/lib/certificateTypes";

/**
 * Youthful Offender Class Certificate Template
 * Template PDF: youthful-offender-class.pdf
 * Layout: 3 certificates per page (Letter size 8.5" x 11" = 612 x 792 pt)
 *
 * This template is ONLY for "youthful offender class" type
 * Uses the official DTA STUDENT TRAFFIC OFFENDER PROGRAM (STOP) template
 *
 * COORDINATES: All coordinates need to be adjusted manually
 * COLOR: All text is BLACK (#000000) for now
 */

export const getYouthfulOffenderTemplate = (): Omit<CertificateTemplate, '_id' | 'createdAt' | 'updatedAt'> => ({
  name: 'Youthful Offender Certificate (3 per page)',
  classType: 'YOUTHFUL OFFENDER CLASS',
  pageSize: { width: 612, height: 792, orientation: 'portrait' },
  certificatesPerPage: 3,

  // Use the PDF template as background
  background: {
    type: 'pdf',
    value: '/templates_certificates/youthful-offender-class.pdf'
  },

  // Text elements - PDF COORDINATES (Y=0 is BOTTOM)
  // X = horizontal center of the field
  // Y = distance from BOTTOM of page
  textElements: [
    // ==================== CERTIFICATE 1 (TOP) ====================
    // COORDINATES MUST BE MULTIPLIED BY 3 because certScaleY = 1/3
    // Real Y position = Y_here / 3
    {
      id: 'cert1-citation',
      content: '{{citationNumber}}',
      x: 100,
      y: 300,  // Real: 100
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cert1-court',
      content: '{{court}}',
      x: 100,
      y: 390,  // Real: 130
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cert1-county',
      content: '{{county}}',
      x: 100,
      y: 480,  // Real: 160
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cert1-certn',
      content: '{{certn}}',
      x: 100,
      y: 570,  // Real: 190
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    // NAME fields - BIG TEXT TO SEE
    {
      id: 'cert1-firstname',
      content: '{{firstName}}',
      x: 100,
      y: 660,  // Real: 220
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cert1-middlename',
      content: '{{middleInitial}}',
      x: 100,
      y: 750,  // Real: 250
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cert1-lastname',
      content: '{{lastName}}',
      x: 100,
      y: 840,  // Real: 280
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    // License and Date
    {
      id: 'cert1-license',
      content: '{{licenseNumber}}',
      x: 100,
      y: 930,  // Real: 310
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },
    {
      id: 'cert1-completion',
      content: '{{courseDate}}',
      x: 100,
      y: 1020,  // Real: 340
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    },

    // ==================== CERTIFICATE 2 (MIDDLE) ====================
    // Same Y-coordinates as Certificate 1 (generator applies offsetY=264 automatically)
    // Top row: Citation, Court, County, Certn - 30pt from top of slot
    {
      id: 'cert2-citation',
      content: '{{citationNumber}}',
      x: 143,
      y: 52,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert2-court',
      content: '{{court}}',
      x: 251,
      y: 52,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert2-county',
      content: '{{county}}',
      x: 377,
      y: 52,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Name row: First, Middle Initial, Last - 80pt from top of slot
    {
      id: 'cert2-firstname',
      content: '{{firstName}}',
      x: 155,
      y: 202,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert2-middlename',
      content: '{{middleInitial}}',
      x: 300,
      y: 202,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert2-lastname',
      content: '{{lastName}}',
      x: 440,
      y: 202,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // License/Date row - 120pt from top of slot
    {
      id: 'cert2-license',
      content: '{{licenseNumber}}',
      x: 168,
      y: 322,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert2-completion',
      content: '{{courseDate}}',
      x: 337,
      y: 322,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Certificate Number (right side box)
    {
      id: 'cert2-certn',
      content: '{{certn}}',
      x: 507,
      y: 52,  // Same as cert1 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // ==================== CERTIFICATE 3 (BOTTOM) ====================
    // Same Y-coordinates as Certificate 2 (generator applies offsetY=528 automatically)
    // Top row: Citation, Court, County, Certn - 30pt from top of slot
    {
      id: 'cert3-citation',
      content: '{{citationNumber}}',
      x: 143,
      y: 52,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert3-court',
      content: '{{court}}',
      x: 251,
      y: 52,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert3-county',
      content: '{{county}}',
      x: 377,
      y: 52,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Name row: First, Middle Initial, Last - 80pt from top of slot
    {
      id: 'cert3-firstname',
      content: '{{firstName}}',
      x: 155,
      y: 202,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert3-middlename',
      content: '{{middleInitial}}',
      x: 300,
      y: 202,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert3-lastname',
      content: '{{lastName}}',
      x: 440,
      y: 202,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // License/Date row - 120pt from top of slot
    {
      id: 'cert3-license',
      content: '{{licenseNumber}}',
      x: 168,
      y: 322,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
    {
      id: 'cert3-completion',
      content: '{{courseDate}}',
      x: 337,
      y: 322,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },

    // Certificate Number (right side box)
    {
      id: 'cert3-certn',
      content: '{{certn}}',
      x: 507,
      y: 52,  // Same as cert2 - generator handles offsetY
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'center'
    },
  ],

  // Empty - no checkbox groups needed, PDF already has the boxes
  checkboxElements: [],

  // Checkbox marks (X) - drawn only when variable is "true"
  // These will draw X marks on the pre-printed checkbox squares in the PDF
  // ID format: checkbox-{variableKey}-{value} so the system knows when to show them
  // 
  // COORDINATE SYSTEM:
  // - Y-coordinates are in local certificate space (0-264pt per slot)
  // - Generator applies offsetY automatically (0 for top, 264 for middle, 528 for bottom)
  // - All 3 certificates use SAME Y values - offsetY handles vertical positioning
  // - pdfY = 792 - (y/3 + offsetY) for shapes (no baseline offset)
  //
  // COURSE TIME CHECKBOXES: y=147 (~147pt from top of slot, aligns with PDF template)
  // - pdfY for top cert: 792 - (147/3 + 0) = 743pt (147pt from top of page)
  // - pdfY for middle cert: 792 - (147/3 + 264) = 479pt (147pt from top of middle slot)
  // - pdfY for bottom cert: 792 - (147/3 + 528) = 215pt (147pt from top of bottom slot)
  shapeElements: [
    // Certificate 1 (TOP) - Course Time checkboxes
    // 4hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime4hr-true', type: 'line', x: 332, y: 147, x2: 340, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime4hr-true-2', type: 'line', x: 340, y: 147, x2: 332, y2: 155, borderColor: '#000000', borderWidth: 2 },
    // 6hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime6hr-true', type: 'line', x: 385, y: 147, x2: 393, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime6hr-true-2', type: 'line', x: 393, y: 147, x2: 385, y2: 155, borderColor: '#000000', borderWidth: 2 },
    // 8hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime8hr-true', type: 'line', x: 435, y: 147, x2: 443, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime8hr-true-2', type: 'line', x: 443, y: 147, x2: 435, y2: 155, borderColor: '#000000', borderWidth: 2 },

    // Certificate 1 (TOP) - Attendance checkboxes (~200pt from top of slot)
    // Court Order checkbox
    { id: 'checkbox-attendanceCourtOrder-true', type: 'line', x: 360, y: 562, x2: 368, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceCourtOrder-true-2', type: 'line', x: 368, y: 562, x2: 360, y2: 570, borderColor: '#000000', borderWidth: 2 },
    // Volunteer checkbox
    { id: 'checkbox-attendanceVolunteer-true', type: 'line', x: 450, y: 562, x2: 458, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceVolunteer-true-2', type: 'line', x: 458, y: 562, x2: 450, y2: 570, borderColor: '#000000', borderWidth: 2 },
    // Ticket checkbox
    { id: 'checkbox-attendanceTicket-true', type: 'line', x: 540, y: 562, x2: 548, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceTicket-true-2', type: 'line', x: 548, y: 562, x2: 540, y2: 570, borderColor: '#000000', borderWidth: 2 },

    // Certificate 2 (MIDDLE) - Course Time checkboxes
    // Same Y-coordinates as Certificate 1 - generator applies offsetY=264 automatically
    // 4hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime4hr-true', type: 'line', x: 332, y: 147, x2: 340, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime4hr-true-2', type: 'line', x: 340, y: 147, x2: 332, y2: 155, borderColor: '#000000', borderWidth: 2 },
    // 6hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime6hr-true', type: 'line', x: 385, y: 147, x2: 393, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime6hr-true-2', type: 'line', x: 393, y: 147, x2: 385, y2: 155, borderColor: '#000000', borderWidth: 2 },
    // 8hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime8hr-true', type: 'line', x: 435, y: 147, x2: 443, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime8hr-true-2', type: 'line', x: 443, y: 147, x2: 435, y2: 155, borderColor: '#000000', borderWidth: 2 },

    // Certificate 2 (MIDDLE) - Attendance checkboxes (same Y as cert1, generator applies offsetY=264)
    // Court Order checkbox
    { id: 'checkbox-attendanceCourtOrder-true', type: 'line', x: 360, y: 562, x2: 368, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceCourtOrder-true-2', type: 'line', x: 368, y: 562, x2: 360, y2: 570, borderColor: '#000000', borderWidth: 2 },
    // Volunteer checkbox
    { id: 'checkbox-attendanceVolunteer-true', type: 'line', x: 450, y: 562, x2: 458, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceVolunteer-true-2', type: 'line', x: 458, y: 562, x2: 450, y2: 570, borderColor: '#000000', borderWidth: 2 },
    // Ticket checkbox
    { id: 'checkbox-attendanceTicket-true', type: 'line', x: 540, y: 562, x2: 548, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceTicket-true-2', type: 'line', x: 548, y: 562, x2: 540, y2: 570, borderColor: '#000000', borderWidth: 2 },

    // Certificate 3 (BOTTOM) - Course Time checkboxes
    // Same Y-coordinates as Certificate 1 - generator applies offsetY=528 automatically
    // 4hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime4hr-true', type: 'line', x: 332, y: 147, x2: 340, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime4hr-true-2', type: 'line', x: 340, y: 147, x2: 332, y2: 155, borderColor: '#000000', borderWidth: 2 },
    // 6hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime6hr-true', type: 'line', x: 385, y: 147, x2: 393, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime6hr-true-2', type: 'line', x: 393, y: 147, x2: 385, y2: 155, borderColor: '#000000', borderWidth: 2 },
    // 8hr checkbox (X mark: 8pt wide, 8pt tall)
    { id: 'checkbox-courseTime8hr-true', type: 'line', x: 435, y: 147, x2: 443, y2: 155, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-courseTime8hr-true-2', type: 'line', x: 443, y: 147, x2: 435, y2: 155, borderColor: '#000000', borderWidth: 2 },

    // Certificate 3 (BOTTOM) - Attendance checkboxes (same Y as cert1, generator applies offsetY=528)
    // Court Order checkbox
    { id: 'checkbox-attendanceCourtOrder-true', type: 'line', x: 360, y: 562, x2: 368, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceCourtOrder-true-2', type: 'line', x: 368, y: 562, x2: 360, y2: 570, borderColor: '#000000', borderWidth: 2 },
    // Volunteer checkbox
    { id: 'checkbox-attendanceVolunteer-true', type: 'line', x: 450, y: 562, x2: 458, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceVolunteer-true-2', type: 'line', x: 458, y: 562, x2: 450, y2: 570, borderColor: '#000000', borderWidth: 2 },
    // Ticket checkbox
    { id: 'checkbox-attendanceTicket-true', type: 'line', x: 540, y: 562, x2: 548, y2: 570, borderColor: '#000000', borderWidth: 2 },
    { id: 'checkbox-attendanceTicket-true-2', type: 'line', x: 548, y: 562, x2: 540, y2: 570, borderColor: '#000000', borderWidth: 2 },
  ],

  // Instructor signature image
  // COORDINATE SYSTEM:
  // - Y-coordinates are in local certificate space (0-264pt per slot)
  // - Generator applies offsetY automatically (0 for top, 264 for middle, 528 for bottom)
  // - All 3 certificates use SAME Y values - offsetY handles vertical positioning
  // - pdfY = 792 - (y/3 + offsetY) for images (no baseline offset)
  //
  // SIGNATURE POSITION: y=600 (~200pt from top of slot, aligns with PDF template)
  // - pdfY for top cert: 792 - (600/3 + 0) = 592pt (200pt from top of page)
  // - pdfY for middle cert: 792 - (600/3 + 264) = 328pt (200pt from top of middle slot)
  // - pdfY for bottom cert: 792 - (600/3 + 528) = 64pt (200pt from top of bottom slot)
  imageElements: [
    // Certificate 1 (TOP) - Instructor Signature
    { id: 'cert1-signature', url: '/firma_instructor.png', x: 365, y: 600, width: 150, height: 40 },

    // Certificate 2 (MIDDLE) - Instructor Signature (same Y, generator applies offsetY=264)
    { id: 'cert2-signature', url: '/firma_instructor.png', x: 365, y: 600, width: 150, height: 40 },

    // Certificate 3 (BOTTOM) - Instructor Signature (same Y, generator applies offsetY=528)
    { id: 'cert3-signature', url: '/firma_instructor.png', x: 365, y: 600, width: 150, height: 40 },
  ],

  availableVariables: [
    { key: 'firstName', label: 'First Name', example: 'Technology' },
    { key: 'middleInitial', label: 'Middle Initial', example: 'S' },
    { key: 'lastName', label: 'Last Name', example: 'Botopia' },
    { key: 'licenseNumber', label: "Driver's License Number", example: 'A1234567' },
    { key: 'citationNumber', label: 'Citation/Case Number', example: '0' },
    { key: 'court', label: 'Court', example: '' },
    { key: 'county', label: 'County', example: 'Palm Beach County, FL' },
    { key: 'courseDate', label: 'Completion Date', example: '10/18/2025' },
    { key: 'certn', label: 'Certificate Number', example: '12345' },
    // Dropdown fields - these will show as select dropdowns in the table
    { key: 'courseTime', label: 'Course Time', example: '4 hr', options: ['4 hr', '6 hr', '8 hr'] },
    { key: 'attendanceReason', label: 'Attendance Reason', example: 'Ticket/Citation', options: ['Court Order', 'Volunteer', 'Ticket/Citation'] },
  ],

  isDefault: true,
  isActive: true,
});
