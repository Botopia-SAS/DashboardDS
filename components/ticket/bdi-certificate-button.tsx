"use client";

import React from "react";
import BdiCertificateModal from "./bdi-certificate-modal";
import { Student } from "./columns";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { BdiCertificateData } from "./hooks/use-bdi-certificate-downloader";

interface BdiCertificateButtonProps {
  student: Student;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function BdiCertificateButton({ 
  student, 
  variant = "outline", 
  size = "sm" 
}: BdiCertificateButtonProps) {
  
  // Transform student data to certificate data
  const getCertificateData = (): Partial<BdiCertificateData> => {
    return {
      certificateNumber: String(student.certn || ""),
      courseCompletionDate: student.courseDate || new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit' 
      }),
      citationNumber: student.citation_number || "",
      driversLicenseNumber: student.licenseNumber || "",
      studentName: `${student.last_name || ""}, ${student.first_name || ""}${student.midl ? " " + student.midl : ""}`,
      // You can add more fields mapping here based on your Student type
    };
  };

  const handleDownload = (data: BdiCertificateData) => {
    console.log("BDI Certificate downloaded for:", data.studentName);
    // You can add additional logic here, like tracking downloads
  };

  return (
    <BdiCertificateModal
      trigger={
        <Button variant={variant} size={size} className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          BDI Certificate
        </Button>
      }
      initialData={getCertificateData()}
      onDownload={handleDownload}
    />
  );
}

export default BdiCertificateButton;