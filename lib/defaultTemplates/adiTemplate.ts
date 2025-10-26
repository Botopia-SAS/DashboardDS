import { CertificateTemplate } from "@/lib/certificateTypes";
import { CERTIFICATE_CONFIGURATIONS } from "@/lib/certificateConfigurations";

/**
 * ADI Certificate Template
 * Uses configuration from certificateConfigurations.ts
 */
export const getDefaultADITemplate = (): Omit<CertificateTemplate, '_id' | 'createdAt' | 'updatedAt'> => {
  const config = CERTIFICATE_CONFIGURATIONS.ADI;

  return {
    name: config.name,
    classType: config.classType,
    pageSize: config.pageSize,
    certificatesPerPage: config.certificatesPerPage,
    background: {
      type: 'pdf',
      value: config.pdfTemplate,
    },

    // Variables from configuration
    availableVariables: config.tableVariables,

    // No shapes, text, or images - the PDF has everything
    shapeElements: [],
    textElements: [],
    imageElements: [],
    checkboxElements: [],

    isDefault: true,
    isActive: true,
  };
};
