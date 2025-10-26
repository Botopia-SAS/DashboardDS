/**
 * Coordenadas específicas para certificados Youthful Offender Class
 *
 * IMPORTANTE: Todas las coordenadas Y en este archivo son medidas DESDE ARRIBA
 * (como lo muestra la herramienta pdf-coordinate-tool.html).
 * 
 * El generador convierte automáticamente estas coordenadas a bottom-up
 * usando: pdfY = height - y (porque pdf-lib usa coordenadas bottom-up)
 *
 * Este PDF permite hasta 3 certificados por página (landscape: 792 x 612)
 * Cada certificado ocupa aproximadamente 204 pixels de altura (612 / 3)
 *
 * Para usar este sistema:
 * 1. Si hay 1 estudiante -> usar solo position1
 * 2. Si hay 2 estudiantes -> usar position1 y position2
 * 3. Si hay 3 estudiantes -> usar position1, position2 y position3
 */

export interface FieldYouthfulOffenderCoordinate {
  x?: number; // Opcional para checkboxes que solo usan checkboxOptions
  y?: number; // Opcional para checkboxes que solo usan checkboxOptions
  fontSize?: number;
  fontFamily?: 'Times-Roman' | 'Helvetica' | 'Courier' | 'Montserrat';
  align?: 'left' | 'center' | 'right';
  maxWidth?: number; // Para truncar texto largo
  isCheckbox?: boolean; // Si es un checkbox
  checkboxOptions?: Array<{
    value: string;
    x: number;
    y: number;
  }>; // Opciones del checkbox con sus coordenadas
}

// Offsets configurables para las diferentes posiciones
// Puedes modificar estos valores para ajustar el espaciado entre certificados
const POSITION_2_OFFSET = 281; // Offset para el segundo certificado
const POSITION_3_OFFSET = 562; // Offset para el tercer certificado (204 * 2)

/**
 * Coordenadas para el PRIMER certificado Youthful Offender (parte superior del PDF)
 */
export const POSITION_1_YOUTHFUL_OFFENDER_COORDINATES: Record<string, FieldYouthfulOffenderCoordinate> = {
  // COURSE TIME - Checkboxes (4hr, 6hr, 8hr)
  courseTime: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: '4 hr', x: 247, y: 100 },
      { value: '6 hr', x: 295, y: 100 },
      { value: '8 hr', x: 334, y: 100 }
    ]
  },

  // Citation/Case No
  citationNumber: {
    x: 139,
    y: 115,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  // Court
  court: {
    x: 251,
    y: 115,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  },

  // County
  county: {
    x: 376,
    y: 115,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  // NAME - First
  firstName: {
    x: 154,
    y: 150,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 120
  },

  // NAME - MI (Middle Initial)
  middleName: {
    x: 300,
    y: 150,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 30
  },

  // NAME - Last
  lastName: {
    x: 441,
    y: 150,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  // Driver License Number
  licenseNumber: {
    x: 168,
    y: 175,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  // Course Completion Date
  courseDate: {
    x: 338,
    y: 175,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  // Instructor's Signature (imagen)
  instructorSignature: {
    x: 120,
    y: 183,
    fontSize: 0, // Es una imagen, no texto
    align: 'center',
    maxWidth: 150
  },

  // Instructor's School Name
  instructorSchoolName: {
    x: 450,
    y: 195,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  // ATTENDANCE - Checkboxes (Court Order / Volunteer / Ticket)
  attendanceReason: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: 'Court Order', x:283, y: 131 },
      { value: 'Volunteer', x: 355, y: 131 },
      { value: 'Ticket/Citation', x: 444, y: 131 }
    ]
  },

  // Certificate Number
  certn: {
    x: 545,
    y: 105,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  }
};

/**
 * Coordenadas para el SEGUNDO certificado Youthful Offender (parte media del PDF)
 * Todas las Y aumentan en POSITION_2_OFFSET pixels desde position 1
 */
export const POSITION_2_YOUTHFUL_OFFENDER_COORDINATES: Record<string, FieldYouthfulOffenderCoordinate> = {
  courseTime: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.courseTime.checkboxOptions!.map(opt => ({
      value: opt.value,
      x: opt.x,
      y: opt.y + POSITION_2_OFFSET
    }))
  },

  citationNumber: {
    x: 139,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.citationNumber.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  court: {
    x: 251,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.court.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  },

  county: {
    x: 376,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.county.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  firstName: {
    x: 154,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.firstName.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 120
  },

  middleName: {
    x: 300,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.middleName.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 30
  },

  lastName: {
    x: 441,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.lastName.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  licenseNumber: {
    x: 168,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.licenseNumber.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  courseDate: {
    x: 338,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.courseDate.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  instructorSignature: {
    x: 120,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.instructorSignature.y! + POSITION_2_OFFSET,
    fontSize: 0, // Es una imagen, no texto
    align: 'center',
    maxWidth: 150
  },

  instructorSchoolName: {
    x: 450,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.instructorSchoolName.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  attendanceReason: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.attendanceReason.checkboxOptions!.map(opt => ({
      value: opt.value,
      x: opt.x,
      y: opt.y + POSITION_2_OFFSET
    }))
  },

  certn: {
    x: 545,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.certn.y! + POSITION_2_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  }
};

/**
 * Coordenadas para el TERCER certificado Youthful Offender (parte inferior del PDF)
 * Todas las Y aumentan en POSITION_3_OFFSET pixels desde position 1
 */
export const POSITION_3_YOUTHFUL_OFFENDER_COORDINATES: Record<string, FieldYouthfulOffenderCoordinate> = {
  courseTime: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.courseTime.checkboxOptions!.map(opt => ({
      value: opt.value,
      x: opt.x,
      y: opt.y + POSITION_3_OFFSET
    }))
  },

  citationNumber: {
    x: 139,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.citationNumber.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  court: {
    x: 251,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.court.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  },

  county: {
    x: 376,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.county.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  firstName: {
    x: 154,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.firstName.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 120
  },

  middleName: {
    x: 300,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.middleName.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 30
  },

  lastName: {
    x: 441,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.lastName.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  licenseNumber: {
    x: 168,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.licenseNumber.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  courseDate: {
    x: 338,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.courseDate.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  instructorSignature: {
    x: 120,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.instructorSignature.y! + POSITION_3_OFFSET,
    fontSize: 0, // Es una imagen, no texto
    align: 'center',
    maxWidth: 150
  },

  instructorSchoolName: {
    x: 450,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.instructorSchoolName.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  attendanceReason: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.attendanceReason.checkboxOptions!.map(opt => ({
      value: opt.value,
      x: opt.x,
      y: opt.y + POSITION_3_OFFSET
    }))
  },

  certn: {
    x: 545,
    y: POSITION_1_YOUTHFUL_OFFENDER_COORDINATES.certn.y! + POSITION_3_OFFSET,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  }
};

/**
 * Obtener coordenadas para un campo específico en una posición específica
 *
 * @param fieldKey - La clave del campo (ej: 'firstName', 'licenseNumber', etc.)
 * @param position - Número de posición: 1 (top), 2 (middle), o 3 (bottom)
 * @returns Las coordenadas del campo o undefined si no existe
 */
export function getYouthfulOffenderFieldCoordinates(
  fieldKey: string,
  position: 1 | 2 | 3
): FieldYouthfulOffenderCoordinate | undefined {
  switch (position) {
    case 1:
      return POSITION_1_YOUTHFUL_OFFENDER_COORDINATES[fieldKey];
    case 2:
      return POSITION_2_YOUTHFUL_OFFENDER_COORDINATES[fieldKey];
    case 3:
      return POSITION_3_YOUTHFUL_OFFENDER_COORDINATES[fieldKey];
    default:
      return undefined;
  }
}

/**
 * Obtener todas las coordenadas para una posición específica
 *
 * @param position - Número de posición: 1 (top), 2 (middle), o 3 (bottom)
 * @returns Objeto con todas las coordenadas de esa posición
 */
export function getYouthfulOffenderPositionCoordinates(
  position: 1 | 2 | 3
): Record<string, FieldYouthfulOffenderCoordinate> {
  switch (position) {
    case 1:
      return POSITION_1_YOUTHFUL_OFFENDER_COORDINATES;
    case 2:
      return POSITION_2_YOUTHFUL_OFFENDER_COORDINATES;
    case 3:
      return POSITION_3_YOUTHFUL_OFFENDER_COORDINATES;
    default:
      return POSITION_1_YOUTHFUL_OFFENDER_COORDINATES;
  }
}
