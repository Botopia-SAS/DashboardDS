/**
 * Coordenadas específicas para certificados de Driving Lessons
 *
 * IMPORTANTE: Todas las coordenadas Y en este archivo son medidas DESDE ARRIBA
 * (como lo muestra la herramienta pdf-coordinate-tool.html).
 * 
 * El generador convierte automáticamente estas coordenadas a bottom-up
 * usando: pdfY = height - y (porque pdf-lib usa coordenadas bottom-up)
 *
 * Este PDF permite hasta 3 certificados por página (landscape: 792 x 612)
 * Cada certificado ocupa aproximadamente 204 pixels de altura (612 / 3)
 */

export interface FieldDrivingLessonCoordinate {
  x: number;
  y: number;
  fontSize: number;
  fontFamily: 'Times-Roman' | 'Helvetica' | 'Courier' | 'Montserrat';
  align: 'left' | 'center' | 'right';
  maxWidth?: number;
  width?: number; // For images
  height?: number; // For images
  isCheckbox?: boolean;
  checkboxOptions?: Array<{
    value: string;
    x: number;
    y: number;
  }>;
}

// Offsets configurables para las diferentes posiciones
const POSITION_2_OFFSET = 204; // Offset para el segundo certificado
const POSITION_3_OFFSET = 408; // Offset para el tercer certificado

/**
 * Coordenadas para el PRIMER certificado Driving Lesson (parte superior del PDF)
 * Basado en el template drivinglessons.pdf
 * 
 * NOTA: Las coordenadas exactas deben ajustarse basándose en la herramienta pdf-coordinate-tool.html
 * Estas son coordenadas estimadas que deben verificarse
 */
export const POSITION_1_DRIVING_LESSON_COORDINATES: Record<string, FieldDrivingLessonCoordinate> = {
  // Student Name (First Name)
  firstName: {
    x: 150,
    y: 520,
    fontSize: 12,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 200
  },

  // Last Name
  lastName: {
    x: 300,
    y: 520,
    fontSize: 12,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 200
  },

  // License Number
  licenseNumber: {
    x: 150,
    y: 480,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 250
  },

  // Completion Date
  completionDate: {
    x: 500,
    y: 480,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'left'
  },

  // Hours
  hours: {
    x: 500,
    y: 450,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'center'
  },

  // Instructor Signature
  instructorSignature: {
    x: 150,
    y: 350,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    align: 'center',
    maxWidth: 200,
    width: 100,
    height: 30
  }
};

/**
 * Coordenadas para el SEGUNDO certificado Driving Lesson (parte media del PDF)
 * Todas las Y aumentan en POSITION_2_OFFSET pixels desde position 1
 */
export const POSITION_2_DRIVING_LESSON_COORDINATES: Record<string, FieldDrivingLessonCoordinate> = {
  firstName: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.firstName.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.firstName.y! + POSITION_2_OFFSET,
    fontSize: 12,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 200
  },

  lastName: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.lastName.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.lastName.y! + POSITION_2_OFFSET,
    fontSize: 12,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 200
  },

  licenseNumber: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.licenseNumber.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.licenseNumber.y! + POSITION_2_OFFSET,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 250
  },

  completionDate: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.completionDate.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.completionDate.y! + POSITION_2_OFFSET,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'left'
  },

  hours: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.hours.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.hours.y! + POSITION_2_OFFSET,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'center'
  },

  instructorSignature: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.instructorSignature.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.instructorSignature.y! + POSITION_2_OFFSET,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    align: 'center',
    maxWidth: 200,
    width: 100,
    height: 30
  }
};

/**
 * Coordenadas para el TERCER certificado Driving Lesson (parte inferior del PDF)
 * Todas las Y aumentan en POSITION_3_OFFSET pixels desde position 1
 */
export const POSITION_3_DRIVING_LESSON_COORDINATES: Record<string, FieldDrivingLessonCoordinate> = {
  firstName: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.firstName.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.firstName.y! + POSITION_3_OFFSET,
    fontSize: 12,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 200
  },

  lastName: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.lastName.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.lastName.y! + POSITION_3_OFFSET,
    fontSize: 12,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 200
  },

  licenseNumber: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.licenseNumber.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.licenseNumber.y! + POSITION_3_OFFSET,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'left',
    maxWidth: 250
  },

  completionDate: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.completionDate.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.completionDate.y! + POSITION_3_OFFSET,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'left'
  },

  hours: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.hours.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.hours.y! + POSITION_3_OFFSET,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    align: 'center'
  },

  instructorSignature: {
    x: POSITION_1_DRIVING_LESSON_COORDINATES.instructorSignature.x,
    y: POSITION_1_DRIVING_LESSON_COORDINATES.instructorSignature.y! + POSITION_3_OFFSET,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    align: 'center',
    maxWidth: 200,
    width: 100,
    height: 30
  }
};

/**
 * Obtener coordenadas para un campo específico en una posición específica
 *
 * @param fieldKey - La clave del campo (ej: 'firstName', 'licenseNumber', etc.)
 * @param position - Número de posición: 1 (top), 2 (middle), o 3 (bottom)
 * @returns Las coordenadas del campo o undefined si no existe
 */
export function getDrivingLessonFieldCoordinates(
  fieldKey: string,
  position: 1 | 2 | 3
): FieldDrivingLessonCoordinate | undefined {
  switch (position) {
    case 1:
      return POSITION_1_DRIVING_LESSON_COORDINATES[fieldKey];
    case 2:
      return POSITION_2_DRIVING_LESSON_COORDINATES[fieldKey];
    case 3:
      return POSITION_3_DRIVING_LESSON_COORDINATES[fieldKey];
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
export function getDrivingLessonPositionCoordinates(
  position: 1 | 2 | 3
): Record<string, FieldDrivingLessonCoordinate> {
  switch (position) {
    case 1:
      return POSITION_1_DRIVING_LESSON_COORDINATES;
    case 2:
      return POSITION_2_DRIVING_LESSON_COORDINATES;
    case 3:
      return POSITION_3_DRIVING_LESSON_COORDINATES;
    default:
      return POSITION_1_DRIVING_LESSON_COORDINATES;
  }
}

