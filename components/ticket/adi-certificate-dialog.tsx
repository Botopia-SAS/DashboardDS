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
  CertificateForm,
  CertificatePreview,
  usePdfGenerator,
  type AdiCertificateData,
} from "./adi-certificate";
import { UserSearch } from "./gov-certificate/components/user-search";
import { useUserSearch } from "./gov-certificate/hooks/use-user-search";

interface AdiCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData: AdiCertificateData = {
  certificateNumber: "",
  courseDate: new Date().toISOString().split("T")[0],
  courseTime: "",
  courseAddress: "",
  firstName: "",
  middleInitial: "",
  lastName: "",
};

export function AdiCertificateDialog({ open, onOpenChange }: AdiCertificateDialogProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<AdiCertificateData>(initialFormData);

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
    }));
  };

  const handleClearUser = () => {
    clearUser();
    setFormData((prev) => ({
      ...prev,
      firstName: "",
      middleInitial: "",
      lastName: "",
    }));
  };

  const handleInputChange = (field: keyof AdiCertificateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = [
      formData.certificateNumber,
      formData.courseDate,
      formData.courseTime,
      formData.courseAddress,
      formData.firstName,
      formData.lastName,
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
      const fileName = `ADI_Enrollment_Letter_${formData.lastName}_${formData.firstName}.pdf`;
      saveAs(pdfBlob, fileName);
      toast.success("Enrollment letter generated successfully");
      onOpenChange(false);
      setFormData(initialFormData);
      clearUser();
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Error generating enrollment letter");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Generate Enrollment Letter</DialogTitle>
          <DialogDescription>
            Fill in the information to generate an ADI enrollment letter
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
          <div className="flex items-start justify-center overflow-x-hidden">
            <div style={{ transform: "scale(0.95)", transformOrigin: "top center" }}>
              <CertificatePreview 
                key={formData.courseAddress} 
                ref={previewRef} 
                formData={formData} 
              />
            </div>
          </div>
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
            {isGenerating ? "Generating..." : "Generate Enrollment Letter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
