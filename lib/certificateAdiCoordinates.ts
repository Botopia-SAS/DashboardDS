/**
 * Coordenadas específicas para certificados ADI
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

export interface FieldAdiCoordinate {
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
const POSITION_2_OFFSET = 276; // Offset para el segundo certificado
const POSITION_3_OFFSET = 552; // Offset para el tercer certificado

/**
 * Coordenadas para el PRIMER certificado ADI (parte superior del PDF)
 * Basado en la imagen del certificado ADI proporcionada
 */
export const POSITION_1_ADI_COORDINATES: Record<string, FieldAdiCoordinate> = {
  // Citation/Case No
  citationNumber: {
    x: 259,
    y: 115,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  // Certificate Number (al lado de "Certificate #:")
  certn: {
    x: 444,
    y: 125,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'left',
    maxWidth: 100
  },

  // Driver License Number (primera posición)
  licenseNumber: {
    x: 259,
    y: 127,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  // Driver License Number (segunda posición)
  licenseNumber2: {
    x: 475,
    y: 210,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  // Course Completion Date
  courseDate: {
    x: 259,
    y: 139,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  // Name (Full name)
  firstName: {
    x: 250,
    y: 152,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'right',
    maxWidth: 120
  },

  // Last Name
  lastName: {
    x: 265,
    y: 152,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'left',
    maxWidth: 150
  },

  // Course Location
  address: {
    x: 259,
    y: 167,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 300
  },

  // Instructor Signature
  instructorSignature: {
    x: 200,
    y: 215,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  }
};

/**
 * Coordenadas para el SEGUNDO certificado ADI (parte media del PDF)
 * Todas las Y aumentan en POSITION_2_OFFSET pixels desde position 1
 */
export const POSITION_2_ADI_COORDINATES: Record<string, FieldAdiCoordinate> = {
  citationNumber: {
    x: POSITION_1_ADI_COORDINATES.citationNumber.x!,
    y: POSITION_1_ADI_COORDINATES.citationNumber.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  certn: {
    x: POSITION_1_ADI_COORDINATES.certn.x!,
    y: POSITION_1_ADI_COORDINATES.certn.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'left',
    maxWidth: 100
  },

  licenseNumber: {
    x: POSITION_1_ADI_COORDINATES.licenseNumber.x!,
    y: POSITION_1_ADI_COORDINATES.licenseNumber.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  licenseNumber2: {
    x: POSITION_1_ADI_COORDINATES.licenseNumber2.x!,
    y: POSITION_1_ADI_COORDINATES.licenseNumber2.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  courseDate: {
    x: POSITION_1_ADI_COORDINATES.courseDate.x!,
    y: POSITION_1_ADI_COORDINATES.courseDate.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  firstName: {
    x: POSITION_1_ADI_COORDINATES.firstName.x!,
    y: POSITION_1_ADI_COORDINATES.firstName.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'right',
    maxWidth: 120
  },

  lastName: {
    x: POSITION_1_ADI_COORDINATES.lastName.x!,
    y: POSITION_1_ADI_COORDINATES.lastName.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'left',
    maxWidth: 150
  },

  address: {
    x: POSITION_1_ADI_COORDINATES.address.x!,
    y: POSITION_1_ADI_COORDINATES.address.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 300
  },

  // Instructor Signature
  instructorSignature: {
    x: POSITION_1_ADI_COORDINATES.instructorSignature.x!,
    y: POSITION_1_ADI_COORDINATES.instructorSignature.y! + POSITION_2_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  }
};

/**
 * Coordenadas para el TERCER certificado ADI (parte inferior del PDF)
 * Todas las Y aumentan en POSITION_3_OFFSET pixels desde position 1
 */
export const POSITION_3_ADI_COORDINATES: Record<string, FieldAdiCoordinate> = {
  citationNumber: {
    x: POSITION_1_ADI_COORDINATES.citationNumber.x!,
    y: POSITION_1_ADI_COORDINATES.citationNumber.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  certn: {
    x: POSITION_1_ADI_COORDINATES.certn.x!,
    y: POSITION_1_ADI_COORDINATES.certn.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'left',
    maxWidth: 100
  },

  licenseNumber: {
    x: POSITION_1_ADI_COORDINATES.licenseNumber.x!,
    y: POSITION_1_ADI_COORDINATES.licenseNumber.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  licenseNumber2: {
    x: POSITION_1_ADI_COORDINATES.licenseNumber2.x!,
    y: POSITION_1_ADI_COORDINATES.licenseNumber2.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  },

  courseDate: {
    x: POSITION_1_ADI_COORDINATES.courseDate.x!,
    y: POSITION_1_ADI_COORDINATES.courseDate.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center'
  },

  firstName: {
    x: POSITION_1_ADI_COORDINATES.firstName.x!,
    y: POSITION_1_ADI_COORDINATES.firstName.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'right',
    maxWidth: 120
  },

  lastName: {
    x: POSITION_1_ADI_COORDINATES.lastName.x!,
    y: POSITION_1_ADI_COORDINATES.lastName.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'left',
    maxWidth: 150
  },

  address: {
    x: POSITION_1_ADI_COORDINATES.address.x!,
    y: POSITION_1_ADI_COORDINATES.address.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 300
  },

  // Instructor Signature
  instructorSignature: {
    x: POSITION_1_ADI_COORDINATES.instructorSignature.x!,
    y: POSITION_1_ADI_COORDINATES.instructorSignature.y! + POSITION_3_OFFSET,
    fontSize: 7,
    fontFamily: 'Montserrat',
    align: 'center',
    maxWidth: 200
  }
};

/**
 * Obtener coordenadas para un campo específico en una posición específica
 *
 * @param fieldKey - La clave del campo (ej: 'firstName', 'licenseNumber', etc.)
 * @param position - Número de posición: 1 (top), 2 (middle), o 3 (bottom)
 * @returns Las coordenadas del campo o undefined si no existe
 */
export function getAdiFieldCoordinates(
  fieldKey: string,
  position: 1 | 2 | 3
): FieldAdiCoordinate | undefined {
  switch (position) {
    case 1:
      return POSITION_1_ADI_COORDINATES[fieldKey];
    case 2:
      return POSITION_2_ADI_COORDINATES[fieldKey];
    case 3:
      return POSITION_3_ADI_COORDINATES[fieldKey];
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
export function getAdiPositionCoordinates(
  position: 1 | 2 | 3
): Record<string, FieldAdiCoordinate> {
  switch (position) {
    case 1:
      return POSITION_1_ADI_COORDINATES;
    case 2:
      return POSITION_2_ADI_COORDINATES;
    case 3:
      return POSITION_3_ADI_COORDINATES;
    default:
      return POSITION_1_ADI_COORDINATES;
  }
}
