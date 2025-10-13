"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { useDateCertificateGenerator } from "./use-date-certificate-generator";
import { useBdiCertificateGenerator } from "./use-bdi-certificate-generator";
import { useAdiCertificateGenerator } from "./use-adi-certificate-generator";
import { useDynamicCertificateGenerator } from "./use-dynamic-certificate-generator";
import { CertificateTemplate } from "@/components/certificate-editor/types";
import { getDefaultBDITemplate } from "@/lib/defaultTemplates/bdiTemplate";

export function useCertificateGenerator() {
  const { generateDateCertificatePDF } = useDateCertificateGenerator();
  const { generateBdiCertificatePDF } = useBdiCertificateGenerator();
  const { generateAdiCertificatePDF } = useAdiCertificateGenerator();
  const { generateDynamicCertificatePDF } = useDynamicCertificateGenerator();

  const generateCertificatePDF = useCallback(
    async (user: Student) => {
      const { type, classType } = user;
      const certType = (classType || type || 'DATE').toUpperCase();

      console.log(`Generating certificate for type: ${certType}`);

      // Try to fetch saved template from database first (only by classType)
      try {
        const templateResponse = await fetch(
          `/api/certificate-templates?classType=${certType}`
        );

        if (templateResponse.ok) {
          const templates = await templateResponse.json();
          if (templates.length > 0) {
            // Use saved template from database
            console.log(`✅ Using saved template for ${certType}`);
            return await generateDynamicCertificatePDF(user, templates[0] as CertificateTemplate);
          }
        }
      } catch (error) {
        console.log('⚠️ No saved template found, using defaults', error);
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

  return { generateCertificatePDF };
}
