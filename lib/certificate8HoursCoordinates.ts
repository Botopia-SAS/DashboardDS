/**
 * Coordenadas específicas para certificados de 8 horas
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

export interface Field8HoursCoordinate {
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
 * Coordenadas para el PRIMER certificado (parte superior del PDF)
 * Y: entre 100 y 201
 * X: entre 140 y 520
 */
export const POSITION_1_COORDINATES: Record<string, Field8HoursCoordinate> = {
  // COURSE TIME - Checkboxes (4hr, 8hr IDI, 8hr Aggressive, 8hr Suspension)
  courseTime: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: '4hr', x: 215, y: 85 },
      { value: '8hr (IDI)', x: 262, y: 85 },
      { value: '8hr (Aggressive)', x: 315, y: 85 },
      { value: '8hr (Suspension)', x: 392, y: 85 }
    ]
  },

  // Citation/Case No
  citationNumber: {
    x: 195,
    y: 103,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 180
  },

  // Circuit Court No
  circuitCourtNo: {
    x: 366,
    y: 103,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  },

  // County
  county: {
    x: 480,
    y: 103,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 80
  },

  // ATTENDANCE - Checkboxes (Court Order / Volunteer)
  attendance: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: 'Court Order', x: 286, y: 130 },
      { value: 'Volunteer', x: 359, y: 130 }
    ]
  },

  // NAME - First
  firstName: {
    x: 114,
    y: 147,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 120
  },

  // NAME - MI (Middle Initial)
  middleName: {
    x: 182,
    y: 147,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 25
  },

  // NAME - Last
  lastName: {
    x:276,
    y: 147,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  // Drivers License No
  licenseNumber: {
    x: 170,
    y: 180,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 180
  },

  // Completion Date (Mo, Day, Yr)
  courseDate: {
    x: 338,
    y: 180,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  // Instructor's Signature (imagen)
  instructorSignature: {
    x: 210,
    y: 210,
    fontSize: 0, // Es una imagen, no texto
    align: 'center',
    maxWidth: 150
  },

  // School Official
  schoolOfficial: {
    x: 438,
    y: 219,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  }
};

/**
 * Coordenadas para el SEGUNDO certificado (parte media del PDF)
 * Todas las Y aumentan en 204 pixels (612 / 3)
 */
export const POSITION_2_COORDINATES: Record<string, Field8HoursCoordinate> = {
  courseTime: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: '4hr', x: 215, y: 365 },
      { value: '8hr (IDI)', x: 262, y: 365 },
      { value: '8hr (Aggressive)', x: 315, y: 365 },
      { value: '8hr (Suspension)', x: 392, y: 365 }
    ]
  },

  citationNumber: {
    x: 195,
    y: 383,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 180
  },

  circuitCourtNo: {
    x: 366,
    y: 383,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  },

  county: {
    x: 480,
    y: 383,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 80
  },

  attendance: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: 'Court Order', x: 286, y: 410 },
      { value: 'Volunteer', x: 359, y: 410 }
    ]
  },

  firstName: {
    x: 114,
    y: 427,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 120
  },

  middleName: {
    x: 182,
    y: 427,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 25
  },

  lastName: {
    x: 276,
    y: 427,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  licenseNumber: {
    x: 170,
    y: 460,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 180
  },

  courseDate: {
    x: 338,
    y: 460,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  instructorSignature: {
    x: 210,
    y: 490,
    fontSize: 0,
    align: 'center',
    maxWidth: 150
  },

  schoolOfficial: {
    x: 438,
    y: 499,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  }
};

/**
 * Coordenadas para el TERCER certificado (parte inferior del PDF)
 * Todas las Y aumentan en 408 pixels (204 * 2)
 */
export const POSITION_3_COORDINATES: Record<string, Field8HoursCoordinate> = {
  courseTime: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: '4hr', x: 215, y: 645 },
      { value: '8hr (IDI)', x: 262, y: 645 },
      { value: '8hr (Aggressive)', x: 315, y: 645 },
      { value: '8hr (Suspension)', x: 392, y: 645 }
    ]
  },

  citationNumber: {
    x: 195,
    y: 663,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 180
  },

  circuitCourtNo: {
    x: 366,
    y: 663,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 100
  },

  county: {
    x: 480,
    y: 663,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 80
  },

  attendance: {
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    isCheckbox: true,
    checkboxOptions: [
      { value: 'Court Order', x: 286, y: 691 },
      { value: 'Volunteer', x: 359, y: 691 }
    ]
  },

  firstName: {
    x: 114,
    y: 707,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 120
  },

  middleName: {
    x: 182,
    y: 707,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 25
  },

  lastName: {
    x: 276,
    y: 707,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  },

  licenseNumber: {
    x: 170,
    y: 740,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 180
  },

  courseDate: {
    x: 338,
    y: 740,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  instructorSignature: {
    x: 210,
    y: 770,
    fontSize: 0,
    align: 'center',
    maxWidth: 150
  },

  schoolOfficial: {
    x: 438,
    y: 779,
    fontSize: 8,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 150
  }
};

/**
 * Obtener coordenadas para un campo específico en una posición específica
 *
 * @param fieldKey - La clave del campo (ej: 'firstName', 'county', etc.)
 * @param position - Número de posición: 1 (top), 2 (middle), o 3 (bottom)
 * @returns Las coordenadas del campo o undefined si no existe
 */
export function get8HoursFieldCoordinates(
  fieldKey: string,
  position: 1 | 2 | 3
): Field8HoursCoordinate | undefined {
  switch (position) {
    case 1:
      return POSITION_1_COORDINATES[fieldKey];
    case 2:
      return POSITION_2_COORDINATES[fieldKey];
    case 3:
      return POSITION_3_COORDINATES[fieldKey];
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
export function get8HoursPositionCoordinates(
  position: 1 | 2 | 3
): Record<string, Field8HoursCoordinate> {
  switch (position) {
    case 1:
      return POSITION_1_COORDINATES;
    case 2:
      return POSITION_2_COORDINATES;
    case 3:
      return POSITION_3_COORDINATES;
    default:
      return POSITION_1_COORDINATES;
  }
}
