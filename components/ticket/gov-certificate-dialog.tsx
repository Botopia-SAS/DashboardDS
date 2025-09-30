"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useGovCertificateGenerator,
  GovCertificateData,
} from "./hooks/use-gov-certificate-generator";

interface GovCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GovCertificateDialog({
  open,
  onOpenChange,
}: GovCertificateDialogProps) {
  const { generateGovCertificatePDF } = useGovCertificateGenerator();
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState<GovCertificateData>({
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
  });

  const handleInputChange = (field: keyof GovCertificateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    // Validate required fields
    if (
      !formData.certificateNumber ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.licenseNumber ||
      !formData.completionDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const pdfBlob = await generateGovCertificatePDF(formData);
      const fileName = `Gov_Certificate_${formData.lastName}_${formData.firstName}.pdf`;
      saveAs(pdfBlob, fileName);
      toast.success("Government certificate generated successfully");
      onOpenChange(false);
      // Reset form
      setFormData({
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
      });
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
          {/* Certificate Number */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="certificateNumber" className="text-right">
              Certificate Number *
            </Label>
            <Input
              id="certificateNumber"
              value={formData.certificateNumber}
              onChange={(e) =>
                handleInputChange("certificateNumber", e.target.value)
              }
              className="col-span-3"
              placeholder="4069"
            />
          </div>

          {/* Course Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Course Time *</Label>
            <RadioGroup
              value={formData.courseTime}
              onValueChange={(value) =>
                handleInputChange("courseTime", value as "4hr" | "6hr" | "8hr")
              }
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4hr" id="4hr" />
                <Label htmlFor="4hr">4 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6hr" id="6hr" />
                <Label htmlFor="6hr">6 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="8hr" id="8hr" />
                <Label htmlFor="8hr">8 hours</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Citation/Case Number */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="citationNumber" className="text-right">
              Citation/Case No
            </Label>
            <Input
              id="citationNumber"
              value={formData.citationNumber}
              onChange={(e) => handleInputChange("citationNumber", e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Court */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="court" className="text-right">
              Court
            </Label>
            <Input
              id="court"
              value={formData.court}
              onChange={(e) => handleInputChange("court", e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* County */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="county" className="text-right">
              County
            </Label>
            <Input
              id="county"
              value={formData.county}
              onChange={(e) => handleInputChange("county", e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Attendance Reason */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Attendance *</Label>
            <RadioGroup
              value={formData.attendanceReason}
              onValueChange={(value) =>
                handleInputChange(
                  "attendanceReason",
                  value as "court_order" | "volunteer" | "ticket"
                )
              }
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="court_order" id="court_order" />
                <Label htmlFor="court_order">Court Order</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="volunteer" id="volunteer" />
                <Label htmlFor="volunteer">Volunteer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ticket" id="ticket" />
                <Label htmlFor="ticket">Ticket/Citation</Label>
              </div>
            </RadioGroup>
          </div>

          {/* First Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              First Name *
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Middle Initial */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="middleInitial" className="text-right">
              Middle Initial
            </Label>
            <Input
              id="middleInitial"
              value={formData.middleInitial}
              onChange={(e) =>
                handleInputChange("middleInitial", e.target.value)
              }
              className="col-span-3"
              maxLength={1}
            />
          </div>

          {/* Last Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Last Name *
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* License Number */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="licenseNumber" className="text-right">
              License Number *
            </Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Completion Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="completionDate" className="text-right">
              Completion Date *
            </Label>
            <Input
              id="completionDate"
              type="date"
              value={formData.completionDate}
              onChange={(e) => handleInputChange("completionDate", e.target.value)}
              className="col-span-3"
            />
          </div>
          </div>

          {/* Live Preview Section */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-300 overflow-auto">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Live Preview</h3>
            <div className="relative w-full" style={{ aspectRatio: "1275/540" }}>
              <img
                src="/Certificate.jpg"
                alt="Certificate Template"
                className="w-full h-full object-contain"
              />

              {/* Certificate Number Overlay */}
              {formData.certificateNumber && (
                <div
                  className="absolute text-red-700 font-bold text-lg"
                  style={{ top: "50.5%", left: "87%", transform: "translate(-50%, -50%)" }}
                >
                  {formData.certificateNumber}
                </div>
              )}

              {/* Course Time Checkboxes */}
              <div className="absolute" style={{ top: "35.8%", left: "54.2%", transform: "translateX(-50%)" }}>
                <div className="flex gap-8">
                  {formData.courseTime === "4hr" && <span className="text-red-700 font-bold text-sm">X</span>}
                  {formData.courseTime !== "4hr" && <span className="w-3"></span>}
                  {formData.courseTime === "6hr" && <span className="text-red-700 font-bold text-sm">X</span>}
                  {formData.courseTime !== "6hr" && <span className="w-3"></span>}
                  {formData.courseTime === "8hr" && <span className="text-red-700 font-bold text-sm">X</span>}
                  {formData.courseTime !== "8hr" && <span className="w-3"></span>}
                </div>
              </div>

              {/* Citation Number */}
              {formData.citationNumber && (
                <div
                  className="absolute text-black text-[10px]"
                  style={{ top: "47%", left: "19.5%", transform: "translateY(-50%)" }}
                >
                  {formData.citationNumber}
                </div>
              )}

              {/* Court */}
              {formData.court && (
                <div
                  className="absolute text-black text-[10px]"
                  style={{ top: "47%", left: "45%", transform: "translateY(-50%)" }}
                >
                  {formData.court}
                </div>
              )}

              {/* County */}
              {formData.county && (
                <div
                  className="absolute text-black text-[10px]"
                  style={{ top: "47%", left: "65%", transform: "translateY(-50%)" }}
                >
                  {formData.county}
                </div>
              )}

              {/* Attendance Reason Checkboxes */}
              <div className="absolute" style={{ top: "50.5%", left: "60%", transform: "translateX(-50%)" }}>
                <div className="flex gap-14">
                  {formData.attendanceReason === "court_order" && <span className="text-red-700 font-bold text-sm">X</span>}
                  {formData.attendanceReason !== "court_order" && <span className="w-3"></span>}
                  {formData.attendanceReason === "volunteer" && <span className="text-red-700 font-bold text-sm">X</span>}
                  {formData.attendanceReason !== "volunteer" && <span className="w-3"></span>}
                  <span className="ml-5">
                    {formData.attendanceReason === "ticket" && <span className="text-red-700 font-bold text-sm">X</span>}
                    {formData.attendanceReason !== "ticket" && <span className="w-3"></span>}
                  </span>
                </div>
              </div>

              {/* First Name */}
              {formData.firstName && (
                <div
                  className="absolute text-black font-bold text-[10px]"
                  style={{ top: "61.5%", left: "16.5%", transform: "translateY(-50%)" }}
                >
                  {formData.firstName.toUpperCase()}
                </div>
              )}

              {/* Middle Initial */}
              {formData.middleInitial && (
                <div
                  className="absolute text-black font-bold text-[10px]"
                  style={{ top: "61.5%", left: "32.2%", transform: "translateY(-50%)" }}
                >
                  {formData.middleInitial.toUpperCase()}
                </div>
              )}

              {/* Last Name */}
              {formData.lastName && (
                <div
                  className="absolute text-black font-bold text-[10px]"
                  style={{ top: "61.5%", left: "39.2%", transform: "translateY(-50%)" }}
                >
                  {formData.lastName.toUpperCase()}
                </div>
              )}

              {/* License Number */}
              {formData.licenseNumber && (
                <div
                  className="absolute text-black text-[10px]"
                  style={{ top: "73.6%", left: "19.5%", transform: "translateY(-50%)" }}
                >
                  {formData.licenseNumber}
                </div>
              )}

              {/* Completion Date */}
              {formData.completionDate && (
                <div
                  className="absolute text-black text-[10px]"
                  style={{ top: "73.6%", left: "45.8%", transform: "translateY(-50%)" }}
                >
                  {formData.completionDate}
                </div>
              )}
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
            {isGenerating ? "Generating..." : "Generate Certificate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}