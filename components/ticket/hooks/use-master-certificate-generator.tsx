"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { useDateCertificateGenerator } from "./use-date-certificate-generator";
import { useBdiCertificateGenerator } from "./use-bdi-certificate-generator";
import { useAdiCertificateGenerator } from "./use-adi-certificate-generator";
import { useInsuranceCertificateGenerator } from "./use-insurance-certificate-generator";
import { useYouthfulOffenderCertificateGenerator } from "./use-youthful-offender-certificate-generator";
import { useDynamicCertificateGenerator } from "./use-dynamic-certificate-generator";
import { CertificateTemplate } from "@/lib/certificateTypes";
import { getDefaultBDITemplate } from "@/lib/defaultTemplates/bdiTemplate";
import { getCertificateConfig } from "@/lib/certificateConfigurations";

// Helper function to normalize class type for database queries (same as calendar)
const normalizeClassType = (type: string): string => {
  return type.toLowerCase().trim().replace(/\s+/g, '-');
};

export function useCertificateGenerator() {
  const { generateDateCertificatePDF } = useDateCertificateGenerator();
  const { generateSingleBdiCertificate: generateBdiCertificatePDF } = useBdiCertificateGenerator();
  const { generateSingleAdiCertificate } = useAdiCertificateGenerator();
  const { generateSingleInsuranceCertificate } = useInsuranceCertificateGenerator();
  const { generateSingleYouthfulOffenderCertificate } = useYouthfulOffenderCertificateGenerator();
  const { generateDynamicCertificatePDF } = useDynamicCertificateGenerator();

  // Function to validate variables before generation
  const validateVariables = useCallback((user: Student, template: CertificateTemplate) => {
    const missingVariables: string[] = [];
    
    // Extract variables used in template
    const usedVariables: string[] = [];
    template.textElements.forEach(element => {
      const matches = element.content.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const variable = match.replace(/\{\{|\}\}/g, '');
          if (!usedVariables.includes(variable)) {
            usedVariables.push(variable);
          }
        });
      }
    });


    // Check which variables are missing from user data
    usedVariables.forEach(variable => {
      const isMissing = !isVariableAvailable(user, variable);
      if (isMissing) {
        missingVariables.push(variable);

      } else {

      }
    });

    const result = {
      isValid: missingVariables.length === 0,
      missingVariables,
      usedVariables
    };


    return result;
  }, []);

  // Helper function to check if a variable is available in user data
  const isVariableAvailable = (user: Student, variableKey: string): boolean => {

    switch (variableKey) {
      case 'firstName':
        return !!user.first_name;
      case 'lastName':
        return !!user.last_name;
      case 'birthDate':
        return !!user.birthDate;
      case 'licenseNumber':
        // License number is optional - always return true
        return true;
      case 'courseDate':
        return !!user.courseDate;
      case 'classType':
        return !!user.classType;
      case 'certn':
        return !!user.certn;
      case 'address':
        // Address is available if we have either the address field or locationId (which gets resolved to address)
        const addressAvailable = !!(user.address || user.locationId);

        return addressAvailable;
      case 'courseTime':
        // CourseTime is available if we have either courseTime or duration field
        const courseTimeAvailable = !!(user.courseTime || user.duration);

        return courseTimeAvailable;
      case 'classTitle':
        return !!user.classTitle;
      default:
        return true; // For derived variables, assume available
    }
  };

  const generateCertificatePDF = useCallback(
    async (user: Student) => {
      const { type, classType } = user;
      const certType = (classType || type || 'DATE').toUpperCase();


      // ALWAYS use PDF-based generators for ADI, BDI, DATE (ignore database)

      // Use specific PDF generators for each type
      if (certType === "ADI") {

        return generateSingleAdiCertificate(user, '/templates_certificates/adi.pdf');
      } else if (certType === "BDI") {

        return generateBdiCertificatePDF(user, '/templates_certificates/bdi.pdf');
      } else if (certType === "INSURANCE DISCOUNT CLASS" || certType === "INSURANCE-DISCOUNT-CLASS") {

        return generateSingleInsuranceCertificate(user, '/templates_certificates/insurance.pdf');
      } else if (certType === "DATE") {

        return generateDateCertificatePDF(user);
      } else if (certType === "YOUTHFUL OFFENDER CLASS" || certType === "YOUTHFUL-OFFENDER-CLASS") {

        return generateSingleYouthfulOffenderCertificate(user, '/templates_certificates/youthful-offender-class.pdf');
      } else {
        // Unknown type - try database first, then fallback

        try {
          const templateResponse = await fetch(
            `/api/certificate-templates?classType=${certType}`
          );

          if (templateResponse.ok) {
            const templates = await templateResponse.json();

            if (templates.length > 0) {

              return await generateDynamicCertificatePDF(user, templates[0] as CertificateTemplate);
            }
          }
        } catch (error) {

        }

        // Final fallback to BDI template

        try {
          const bdiTemplate = getDefaultBDITemplate(certType);
          return await generateDynamicCertificatePDF(user, bdiTemplate as CertificateTemplate);
        } catch (error) {
          console.error('❌ Error with fallback, using BDI PDF:', error);
          return generateBdiCertificatePDF(user, '/templates_certificates/bdi.pdf');
        }
      }
    },
    [
      generateDateCertificatePDF,
      generateBdiCertificatePDF,
      generateSingleAdiCertificate,
      generateSingleInsuranceCertificate,
      generateSingleYouthfulOffenderCertificate,
      generateDynamicCertificatePDF,
    ]
  );

  return { generateCertificatePDF, validateVariables };
}
