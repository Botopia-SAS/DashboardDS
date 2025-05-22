"use client";

import { Student } from "../columns";
import { useCallback } from "react";
import { useDateCertificateGenerator } from "./use-date-certificate-generator";
import { useBdiCertificateGenerator } from "./use-bdi-certificate-generator";
import { useAdiCertificateGenerator } from "./use-adi-certificate-generator";

export function useCertificateGenerator() {
  const { generateDateCertificatePDF } = useDateCertificateGenerator();
  const { generateBdiCertificatePDF } = useBdiCertificateGenerator();
  const { generateAdiCertificatePDF } = useAdiCertificateGenerator();

  const generateCertificatePDF = useCallback(
    async (user: Student) => {
      const { type } = user;

      if (type === "bdi") {
        return generateBdiCertificatePDF(user);
      } else if (type === "adi") {
        return generateAdiCertificatePDF(user);
      } else {
        // Default to date certificate
        return generateDateCertificatePDF(user);
      }
    },
    [
      generateDateCertificatePDF,
      generateBdiCertificatePDF,
      generateAdiCertificatePDF,
    ]
  );

  return { generateCertificatePDF };
}
