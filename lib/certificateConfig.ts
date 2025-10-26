/**
 * Certificate Configuration System
 *
 * Define PDF templates and their variables for each class type.
 * To add a new certificate:
 * 1. Design your PDF template
 * 2. Place it in /public/ folder (e.g., /public/my_certificate.pdf)
 * 3. Add configuration below with the class type and PDF path
 * 4. Define the variables and their coordinates
 */

export interface CertificateVariable {
  key: string;
  label: string;
  x: number;  // X coordinate on PDF
  y: number;  // Y coordinate on PDF
  fontSize?: number;
  fontFamily?: 'Times-Roman' | 'Helvetica' | 'Courier';
  align?: 'left' | 'center' | 'right';
  transform?: (value: any, student?: any) => string;  // Optional transformation function
}

export interface CertificateConfig {
  classType: string;
  pdfPath: string;  // Path to PDF in /public/ folder
  displayName: string;
  variables: CertificateVariable[];
}

/**
 * Certificate configurations for each class type
 */
export const CERTIFICATE_CONFIGS: Record<string, CertificateConfig> = {
  // DATE Certificate Configuration
  'DATE': {
    classType: 'DATE',
    pdfPath: '/templates_certificates/date.pdf',
    displayName: 'DATE Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 242,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'birthDate',
        label: 'Birth Date',
        x: 390,
        y: 290,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          return value ? new Date(value).toLocaleDateString('en-US') : '';
        }
      },
      {
        key: 'classType',
        label: 'Class Type',
        x: 385,
        y: 385,
        fontSize: 18,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => (value || 'DATE').toUpperCase()
      },
      {
        key: 'classTitle',
        label: 'Class Title',
        x: 390,
        y: 415,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => value || 'Certificate Course'
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 163,
        y: 394,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => String(value || '')
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 487,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'America/New_York'
          });
        }
      }
    ]
  },

  // BDI Certificate Configuration
  'BDI': {
    classType: 'BDI',
    pdfPath: '/bdi_certificate.pdf',  // You can create this PDF template
    displayName: 'BDI Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 310,
        y: 304,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          const middleName = student?.midl || '';
          return `${firstName.toUpperCase()} ${middleName.toUpperCase()} ${lastName.toUpperCase()}`.trim();
        }
      },
      {
        key: 'licenseNumber',
        label: 'License Number',
        x: 310,
        y: 258,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 310,
        y: 281,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 650,
        y: 235,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      },
      {
        key: 'address',
        label: 'Course Location',
        x: 310,
        y: 327,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      },
      {
        key: 'citationNumber',
        label: 'Citation Number',
        x: 310,
        y: 235,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      }
    ]
  },

  // ADI Certificate Configuration
  'ADI': {
    classType: 'ADI',
    pdfPath: '/adi_certificate.pdf',  // You can create this PDF template
    displayName: 'ADI Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 310,
        y: 304,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          const middleName = student?.midl || '';
          return `${firstName.toUpperCase()} ${middleName.toUpperCase()} ${lastName.toUpperCase()}`.trim();
        }
      },
      {
        key: 'licenseNumber',
        label: 'License Number',
        x: 310,
        y: 258,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 310,
        y: 281,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 650,
        y: 235,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      },
      {
        key: 'address',
        label: 'Course Location',
        x: 310,
        y: 327,
        fontSize: 11,
        fontFamily: 'Helvetica',
        align: 'left'
      }
    ]
  },

  // 8 Hours IDI Certificate
  '8 HOURS IDI': {
    classType: '8 HOURS IDI',
    pdfPath: '/templates_certificates/8-hours.pdf',
    displayName: '8 Hours IDI Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  },

  // 8 Hours Aggressive Certificate
  '8 HOURS AGGRESSIVE': {
    classType: '8 HOURS AGGRESSIVE',
    pdfPath: '/templates_certificates/8-hours.pdf',
    displayName: '8 Hours Aggressive Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  },

  // Hyphenated versions for 8-hours certificates (normalized keys)
  '8-HOURS-IDI': {
    classType: '8-HOURS-IDI',
    pdfPath: '/templates_certificates/8-hours.pdf',
    displayName: '8 Hours IDI Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  },

  '8-HOURS-AGGRESSIVE': {
    classType: '8-HOURS-AGGRESSIVE',
    pdfPath: '/templates_certificates/8-hours.pdf',
    displayName: '8 Hours Aggressive Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  },

  '8-HOURS-SUSPENSION': {
    classType: '8-HOURS-SUSPENSION',
    pdfPath: '/templates_certificates/8-hours.pdf',
    displayName: '8 Hours Suspension Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  },

  // Youthful Offender Certificate
  'YOUTHFUL OFFENDER CLASS': {
    classType: 'YOUTHFUL OFFENDER CLASS',
    pdfPath: '/youthful_offender_certificate.pdf',
    displayName: 'Youthful Offender Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  },

  // Insurance Discount Certificate
  'INSURANCE DISCOUNT CLASS': {
    classType: 'INSURANCE DISCOUNT CLASS',
    pdfPath: '/insurance_discount_certificate.pdf',
    displayName: 'Insurance Discount Certificate',
    variables: [
      {
        key: 'studentName',
        label: 'Student Full Name',
        x: 390,
        y: 250,
        fontSize: 14,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value, student) => {
          const firstName = student?.first_name || '';
          const lastName = student?.last_name || '';
          return `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
        }
      },
      {
        key: 'courseDate',
        label: 'Course Completion Date',
        x: 390,
        y: 300,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center',
        transform: (value) => {
          const date = value ? new Date(value) : new Date();
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      },
      {
        key: 'certn',
        label: 'Certificate Number',
        x: 390,
        y: 350,
        fontSize: 12,
        fontFamily: 'Times-Roman',
        align: 'center'
      }
    ]
  }
};

/**
 * Get certificate configuration for a specific class type
 * Falls back to DATE configuration if class type not found
 */
export function getCertificateConfig(classType: string): CertificateConfig {
  // Normalize: uppercase, trim, and convert spaces to hyphens
  const normalizedType = classType.toUpperCase().trim().replace(/\s+/g, '-');
  return CERTIFICATE_CONFIGS[normalizedType] || CERTIFICATE_CONFIGS['DATE'];
}

/**
 * Get all available class types
 */
export function getAvailableClassTypes(): string[] {
  return Object.keys(CERTIFICATE_CONFIGS);
}

/**
 * Check if a class type has a certificate configuration
 */
export function hasCertificateConfig(classType: string): boolean {
  const normalizedType = classType.toUpperCase().trim();
  return normalizedType in CERTIFICATE_CONFIGS;
}
