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

      // Try to fetch saved template from database first
      try {
        const templateResponse = await fetch(
          `/api/certificate-templates?classType=${certType}&default=true`
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

      // No saved template exists - Use default templates
      console.log(`🔄 No saved template found for ${certType}, using default BDI template`);

      if (certType === "ADI") {
        // ADI uses its own legacy generator
        console.log('📄 Using ADI legacy generator');
        return generateAdiCertificatePDF(user);
      } else {
        // ALL OTHER TYPES (DATE, BDI, and ANY NEW CLASS) use BDI template as default
        console.log(`🎨 Using default BDI template for ${certType}`);

        try {
          // Get BDI template and generate PDF
          const bdiTemplate = getDefaultBDITemplate(certType);
          console.log('📋 BDI Template loaded:', bdiTemplate.name);
          
          const result = await generateDynamicCertificatePDF(user, bdiTemplate as CertificateTemplate);
          console.log('✅ Certificate generated successfully with BDI template');
          return result;
        } catch (error) {
          console.error('❌ Error generating with BDI template, falling back to legacy generator:', error);
          // Fallback to legacy BDI generator if dynamic fails
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
