"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SignatureInput } from "./signature-input";
import type { GovCertificateData, User } from "../types";

interface CertificateFormProps {
  formData: GovCertificateData;
  selectedUser: User | null;
  onInputChange: (field: keyof GovCertificateData, value: string) => void;
}

export function CertificateForm({ formData, selectedUser, onInputChange }: CertificateFormProps) {
  return (
    <div className="space-y-4">
      {/* Certificate Number */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="certificateNumber" className="text-right">
          Certificate Number *
        </Label>
        <Input
          id="certificateNumber"
          value={formData.certificateNumber}
          onChange={(e) => onInputChange("certificateNumber", e.target.value)}
          className="col-span-3"
          placeholder="4069"
        />
      </div>

      {/* Course Time */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Course Time *</Label>
        <RadioGroup
          value={formData.courseTime}
          onValueChange={(value) => onInputChange("courseTime", value)}
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
          onChange={(e) => onInputChange("citationNumber", e.target.value)}
          className="col-span-3"
        />
      </div>

      {/* Court */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="court" className="text-right">Court</Label>
        <Input
          id="court"
          value={formData.court}
          onChange={(e) => onInputChange("court", e.target.value)}
          className="col-span-3"
        />
      </div>

      {/* County */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="county" className="text-right">County</Label>
        <Input
          id="county"
          value={formData.county}
          onChange={(e) => onInputChange("county", e.target.value)}
          className="col-span-3"
        />
      </div>

      {/* Attendance Reason */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Attendance *</Label>
        <RadioGroup
          value={formData.attendanceReason}
          onValueChange={(value) => onInputChange("attendanceReason", value)}
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

      {/* Name Fields */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="firstName" className="text-right">First Name *</Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onInputChange("firstName", e.target.value)}
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="middleInitial" className="text-right">Middle Initial</Label>
        <Input
          id="middleInitial"
          value={formData.middleInitial}
          onChange={(e) => onInputChange("middleInitial", e.target.value)}
          className="col-span-3"
          maxLength={1}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="lastName" className="text-right">Last Name *</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onInputChange("lastName", e.target.value)}
          className="col-span-3"
        />
      </div>

      {/* License Number */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="licenseNumber" className="text-right">License Number *</Label>
        <Input
          id="licenseNumber"
          value={formData.licenseNumber}
          onChange={(e) => onInputChange("licenseNumber", e.target.value)}
          className="col-span-3"
        />
      </div>

      {/* Completion Date */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="completionDate" className="text-right">Completion Date *</Label>
        <Input
          id="completionDate"
          type="date"
          value={formData.completionDate}
          onChange={(e) => onInputChange("completionDate", e.target.value)}
          className="col-span-3"
        />
      </div>

      {/* Instructor Fields */}
      <div className="col-span-4 pt-4 border-t border-gray-300">
        <SignatureInput
          value={formData.instructorSignatureImage || ""}
          onChange={(value) => onInputChange("instructorSignatureImage", value)}
          label="Instructor's Signature"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="instructorSchoolName" className="text-right">Instructor's School Name</Label>
        <Input
          id="instructorSchoolName"
          value={formData.instructorSchoolName}
          onChange={(e) => onInputChange("instructorSchoolName", e.target.value)}
          className="col-span-3"
        />
      </div>
    </div>
  );
}
