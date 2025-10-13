export interface TextElement {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold';
  color: string;
  align?: 'left' | 'center' | 'right';
  italic?: boolean;
  underline?: boolean;
}

export interface ImageElement {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  grayscale?: boolean;
}

export interface ShapeElement {
  id: string;
  type: 'rectangle' | 'line' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
}

export interface Variable {
  key: string;
  label: string;
  example: string;
}

export interface CertificateTemplate {
  _id?: string;
  name: string;
  classType: string;
  pageSize: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  background: {
    type: 'color' | 'image' | 'pdf';
    value?: string;
  };
  textElements: TextElement[];
  imageElements: ImageElement[];
  shapeElements: ShapeElement[];
  availableVariables: Variable[];
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_VARIABLES: Variable[] = [
  // Variables from User
  { key: 'firstName', label: 'First Name (User)', example: 'JOHN' },
  { key: 'lastName', label: 'Last Name (User)', example: 'DOE' },
  { key: 'birthDate', label: 'Birth Date (User)', example: '01/15/1990' },
  { key: 'licenseNumber', label: 'License Number (User)', example: 'D123-456-78-910-0' },
  
  // Variables from Ticket
  { key: 'courseDate', label: 'Course Completion Date (Ticket)', example: 'Nov 10, 2025' },
  { key: 'classTitle', label: 'Class Title (from classId)', example: 'Defensive Driving Course' },
  { key: 'classType', label: 'Class Type (Ticket)', example: 'DATE' },
  { key: 'address', label: 'Address (from locationId → zone)', example: 'Palm Beach County, FL' },
  { key: 'courseTime', label: 'Course Duration (Ticket)', example: '2h' },
  { key: 'certn', label: 'Certificate Number (Ticket)', example: '12345' },
];
