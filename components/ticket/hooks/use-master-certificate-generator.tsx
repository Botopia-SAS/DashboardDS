"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { useDateCertificateGenerator } from "./use-date-certificate-generator";
import { useBdiCertificateGenerator } from "./use-bdi-certificate-generator";
import { useAdiCertificateGenerator } from "./use-adi-certificate-generator";
import { useDynamicCertificateGenerator } from "./use-dynamic-certificate-generator";
import { CertificateTemplate } from "@/components/certificate-editor/types";
import { getDefaultBDITemplate } from "@/lib/defaultTemplates/bdiTemplate";

// Helper function to normalize class type for database queries (same as calendar)
const normalizeClassType = (type: string): string => {
  return type.toLowerCase().trim().replace(/\s+/g, '-');
};

export function useCertificateGenerator() {
  const { generateDateCertificatePDF } = useDateCertificateGenerator();
  const { generateBdiCertificatePDF } = useBdiCertificateGenerator();
  const { generateAdiCertificatePDF } = useAdiCertificateGenerator();
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

    console.log(`🔍 Validating variables for user ${user.first_name} ${user.last_name}:`);
    console.log(`📋 Used variables in template:`, usedVariables);

    // Check which variables are missing from user data
    usedVariables.forEach(variable => {
      const isMissing = !isVariableAvailable(user, variable);
      if (isMissing) {
        missingVariables.push(variable);
        console.log(`❌ Missing variable: ${variable}`);
      } else {
        console.log(`✅ Available variable: ${variable}`);
      }
    });

    const result = {
      isValid: missingVariables.length === 0,
      missingVariables,
      usedVariables
    };

    console.log(`📊 Validation result:`, result);
    return result;
  }, []);

  // Helper function to check if a variable is available in user data
  const isVariableAvailable = (user: Student, variableKey: string): boolean => {
    console.log(`🔍 Checking variable ${variableKey} for user:`, {
      firstName: user.first_name,
      lastName: user.last_name,
      address: user.address,
      duration: user.duration,
      courseTime: user.courseTime,
      locationId: user.locationId
    });

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
        console.log(`📍 Address check: address="${user.address}", locationId="${user.locationId}", available=${addressAvailable}`);
        return addressAvailable;
      case 'courseTime':
        // CourseTime is available if we have either courseTime or duration field
        const courseTimeAvailable = !!(user.courseTime || user.duration);
        console.log(`⏱️ CourseTime check: courseTime="${user.courseTime}", duration="${user.duration}", available=${courseTimeAvailable}`);
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

      console.log(`🔍 Generating certificate for type: ${certType}`);
      console.log(`📊 User data:`, { classType, type, certType });

      // Try to fetch saved template from database first (only by classType)
      try {
        const templateResponse = await fetch(
          `/api/certificate-templates?classType=${certType}`
        );

        console.log(`🌐 API Response status: ${templateResponse.status}`);

        if (templateResponse.ok) {
          const templates = await templateResponse.json();
          console.log(`📋 Templates found: ${templates.length}`);
          
          if (templates.length > 0) {
            // Use saved template from database
            console.log(`✅ Using saved template for ${certType}:`, templates[0].name);
            return await generateDynamicCertificatePDF(user, templates[0] as CertificateTemplate);
          } else {
            console.log(`❌ No templates found in database for ${certType}`);
          }
        } else {
          console.log(`❌ API request failed with status: ${templateResponse.status}`);
        }
      } catch (error) {
        console.log('⚠️ Error fetching template from database:', error);
      }

      // No saved template exists - ALL TYPES use BDI template as default (including ADI)
      console.log(`🔄 No saved template found for ${certType}, using default BDI template`);

      try {
        // Get BDI template and generate PDF for ALL types
        const bdiTemplate = getDefaultBDITemplate(certType);
        console.log('📋 BDI Template loaded:', bdiTemplate.name);

        const result = await generateDynamicCertificatePDF(user, bdiTemplate as CertificateTemplate);
        console.log('✅ Certificate generated successfully with BDI template');
        return result;
      } catch (error) {
        console.error('❌ Error generating with BDI template, falling back to legacy generator:', error);

        // Fallback to appropriate legacy generator based on type
        if (certType === "ADI") {
          return generateAdiCertificatePDF(user);
        } else {
          return generateBdiCertificatePDF(user);
        }
      }
    },
    [
      generateDateCertificatePDF,
      generateBdiCertificatePDF,
      generateAdiCertificatePDF,
      generateDynamicCertificatePDF,
    ]
  );

  return { generateCertificatePDF, validateVariables };
}
