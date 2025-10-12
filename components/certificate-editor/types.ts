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
  { key: 'studentName', label: 'Student Full Name', example: 'JOHN MICHAEL DOE' },
  { key: 'firstName', label: 'First Name', example: 'JOHN' },
  { key: 'lastName', label: 'Last Name', example: 'DOE' },
  { key: 'middleName', label: 'Middle Name', example: 'MICHAEL' },
  { key: 'certn', label: 'Certificate Number', example: '12345' },
  { key: 'birthDate', label: 'Birth Date', example: '01/15/1990' },
  { key: 'courseDate', label: 'Course Completion Date', example: 'Nov 10, 2025' },
  { key: 'printDate', label: 'Print Date', example: 'Nov 15, 2025' },
  { key: 'classTitle', label: 'Class Title', example: 'Defensive Driving Course' },
  { key: 'classType', label: 'Class Type', example: 'DATE' },
  { key: 'licenseNumber', label: 'License Number', example: 'D123-456-78-910-0' },
  { key: 'citationNumber', label: 'Citation Number', example: 'CIT-2025-001' },
  { key: 'address', label: 'Address', example: '123 Main St, City, FL 12345' },
  { key: 'courseAddress', label: 'Course Address', example: '3167 Forest Hill Blvd, West Palm Beach, FL' },
  { key: 'courseTime', label: 'Course Time', example: '9:00 AM - 5:00 PM' },
  { key: 'instructorName', label: 'Instructor Name', example: 'Jane Smith' },
];
