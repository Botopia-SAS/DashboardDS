/**
 * Coordenadas específicas para certificados BDI
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

export interface FieldBdiCoordinate {
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
 * Coordenadas para el PRIMER certificado BDI (parte superior del PDF)
 * Basado en la imagen del certificado BDI proporcionada
 */
export const POSITION_1_BDI_COORDINATES: Record<string, FieldBdiCoordinate> = {
  // Citation No
  citationNumber: {
    x: 180,
    y: 198,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  // Certificate Number
  certn: {
    x: 730,
    y: 218,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  },

  // Driver License Number
  licenseNumber: {
    x: 226,
    y: 228,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  // Course Completion Date
  courseDate: {
    x: 256,
    y: 256,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left'
  },

  // Name (Full name)
  firstName: {
    x: 160,
    y: 285,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 120
  },

  // Middle Name/Initial
  middleName: {
    x: 280,
    y: 285,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 30
  },

  // Last Name
  lastName: {
    x: 310,
    y: 285,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 150
  },

  // Course Location
  address: {
    x: 200,
    y: 315,
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 300
  }
};

/**
 * Coordenadas para el SEGUNDO certificado BDI (parte media del PDF)
 * Todas las Y aumentan en 204 pixels (612 / 3)
 */
export const POSITION_2_BDI_COORDINATES: Record<string, FieldBdiCoordinate> = {
  citationNumber: {
    x: 180,
    y: 402, // 198 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  certn: {
    x: 730,
    y: 422, // 218 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  },

  licenseNumber: {
    x: 226,
    y: 432, // 228 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  courseDate: {
    x: 256,
    y: 460, // 256 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left'
  },

  firstName: {
    x: 160,
    y: 489, // 285 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 120
  },

  middleName: {
    x: 280,
    y: 489, // 285 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 30
  },

  lastName: {
    x: 310,
    y: 489, // 285 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 150
  },

  address: {
    x: 200,
    y: 519, // 315 + 204
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 300
  }
};

/**
 * Coordenadas para el TERCER certificado BDI (parte inferior del PDF)
 * Todas las Y aumentan en 408 pixels (204 * 2)
 */
export const POSITION_3_BDI_COORDINATES: Record<string, FieldBdiCoordinate> = {
  citationNumber: {
    x: 180,
    y: 606, // 198 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  certn: {
    x: 730,
    y: 626, // 218 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 100
  },

  licenseNumber: {
    x: 226,
    y: 636, // 228 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 200
  },

  courseDate: {
    x: 256,
    y: 664, // 256 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left'
  },

  firstName: {
    x: 160,
    y: 693, // 285 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 120
  },

  middleName: {
    x: 280,
    y: 693, // 285 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 30
  },

  lastName: {
    x: 310,
    y: 693, // 285 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 150
  },

  address: {
    x: 200,
    y: 723, // 315 + 408
    fontSize: 10,
    fontFamily: 'Helvetica',
    align: 'left',
    maxWidth: 300
  }
};

/**
 * Obtener coordenadas para un campo específico en una posición específica
 *
 * @param fieldKey - La clave del campo (ej: 'firstName', 'licenseNumber', etc.)
 * @param position - Número de posición: 1 (top), 2 (middle), o 3 (bottom)
 * @returns Las coordenadas del campo o undefined si no existe
 */
export function getBdiFieldCoordinates(
  fieldKey: string,
  position: 1 | 2 | 3
): FieldBdiCoordinate | undefined {
  switch (position) {
    case 1:
      return POSITION_1_BDI_COORDINATES[fieldKey];
    case 2:
      return POSITION_2_BDI_COORDINATES[fieldKey];
    case 3:
      return POSITION_3_BDI_COORDINATES[fieldKey];
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
export function getBdiPositionCoordinates(
  position: 1 | 2 | 3
): Record<string, FieldBdiCoordinate> {
  switch (position) {
    case 1:
      return POSITION_1_BDI_COORDINATES;
    case 2:
      return POSITION_2_BDI_COORDINATES;
    case 3:
      return POSITION_3_BDI_COORDINATES;
    default:
      return POSITION_1_BDI_COORDINATES;
  }
}
