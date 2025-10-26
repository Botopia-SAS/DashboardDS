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

/**
 * Coordenadas para el PRIMER certificado Youthful Offender (parte superior del PDF)
 */
export const POSITION_1_YOUTHFUL_OFFENDER_COORDINATES: Record<string, FieldYouthfulOffenderCoordinate> = {
  // Citation/Case No
  citationNumber: {
    x: 180,
    y: 127,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  // Court
  court: {
    x: 290,
    y: 127,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  },

  // County
  county: {
    x: 400,
    y: 127,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  // Name (Full name)
  firstName: {
    x: 180,
    y: 155,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 120
  },

  // Middle Name/Initial
  middleName: {
    x: 290,
    y: 155,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 30
  },

  // Last Name
  lastName: {
    x: 330,
    y: 155,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 150
  },

  // Driver License Number
  licenseNumber: {
    x: 180,
    y: 183,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  // Course Completion Date
  courseDate: {
    x: 180,
    y: 211,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left'
  },

  // Certificate Number
  certn: {
    x: 180,
    y: 239,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  }
};

/**
 * Coordenadas para el SEGUNDO certificado Youthful Offender (parte media del PDF)
 * Todas las Y aumentan en 204 pixels (612 / 3)
 */
export const POSITION_2_YOUTHFUL_OFFENDER_COORDINATES: Record<string, FieldYouthfulOffenderCoordinate> = {
  citationNumber: {
    x: 180,
    y: 331, // 127 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  court: {
    x: 290,
    y: 331, // 127 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  },

  county: {
    x: 400,
    y: 331, // 127 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  firstName: {
    x: 180,
    y: 359, // 155 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 120
  },

  middleName: {
    x: 290,
    y: 359, // 155 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 30
  },

  lastName: {
    x: 330,
    y: 359, // 155 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 150
  },

  licenseNumber: {
    x: 180,
    y: 387, // 183 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  courseDate: {
    x: 180,
    y: 415, // 211 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left'
  },

  certn: {
    x: 180,
    y: 443, // 239 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  }
};

/**
 * Coordenadas para el TERCER certificado Youthful Offender (parte inferior del PDF)
 * Todas las Y aumentan en 408 pixels (204 * 2)
 */
export const POSITION_3_YOUTHFUL_OFFENDER_COORDINATES: Record<string, FieldYouthfulOffenderCoordinate> = {
  citationNumber: {
    x: 180,
    y: 535, // 127 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  court: {
    x: 290,
    y: 535, // 127 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  },

  county: {
    x: 400,
    y: 535, // 127 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  firstName: {
    x: 180,
    y: 563, // 155 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 120
  },

  middleName: {
    x: 290,
    y: 563, // 155 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 30
  },

  lastName: {
    x: 330,
    y: 563, // 155 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 150
  },

  licenseNumber: {
    x: 180,
    y: 591, // 183 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  courseDate: {
    x: 180,
    y: 619, // 211 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left'
  },

  certn: {
    x: 180,
    y: 647, // 239 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
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
