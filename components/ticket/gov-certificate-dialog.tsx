"use client";

import { useState, useRef } from "react";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UserSearch,
  CertificateForm,
  CertificatePreview,
  useUserSearch,
  usePdfGenerator,
  type GovCertificateData,
} from "./gov-certificate";

interface GovCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData: GovCertificateData = {
  certificateNumber: "",
  courseTime: "4hr",
  citationNumber: "",
  court: "",
  county: "",
  attendanceReason: "ticket",
  firstName: "",
  middleInitial: "",
  lastName: "",
  licenseNumber: "",
  completionDate: new Date().toISOString().split("T")[0],
  instructorSignature: "",
  instructorSignatureImage: "",
  instructorSchoolName: "",
};

export function GovCertificateDialog({ open, onOpenChange }: GovCertificateDialogProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<GovCertificateData>(initialFormData);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedUser,
    selectUser,
    clearUser,
  } = useUserSearch();

  const { generatePDF } = usePdfGenerator();

  const handleUserSelect = (user: typeof selectedUser) => {
    if (!user) return;
    selectUser(user);
    setFormData((prev) => ({
      ...prev,
      firstName: user.firstName,
      middleInitial: user.middleName?.charAt(0) || "",
      lastName: user.lastName,
      licenseNumber: user.licenseNumber || "",
    }));
  };

  const handleClearUser = () => {
    clearUser();
    setFormData((prev) => ({
      ...prev,
      firstName: "",
      middleInitial: "",
      lastName: "",
      licenseNumber: "",
    }));
  };

  const handleInputChange = (field: keyof GovCertificateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = [
      formData.certificateNumber,
      formData.firstName,
      formData.lastName,
      formData.licenseNumber,
      formData.completionDate,
    ];
    return required.every((field) => field.trim() !== "");
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!previewRef.current) {
      toast.error("Preview element not found");
      return;
    }

    setIsGenerating(true);
    try {
      const pdfBlob = await generatePDF(formData, previewRef.current);
      const fileName = `Gov_Certificate_${formData.lastName}_${formData.firstName}.pdf`;
      saveAs(pdfBlob, fileName);
      toast.success("Government certificate generated successfully");
      onOpenChange(false);
      setFormData(initialFormData);
      clearUser();
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Error generating certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Generate Government Certificate</DialogTitle>
          <DialogDescription>
            Fill in the information to generate a DTA STOP certificate
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Form Section */}
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <UserSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              selectedUser={selectedUser}
              onUserSelect={handleUserSelect}
              onClearUser={handleClearUser}
            />

            <CertificateForm
              formData={formData}
              selectedUser={selectedUser}
              onInputChange={handleInputChange}
            />
          </div>

          {/* Preview Section */}
          <CertificatePreview ref={previewRef} formData={formData} />
        </div>

        <DialogFooter className="bg-gray-50 p-4 rounded-lg">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
