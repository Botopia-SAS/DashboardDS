"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdiCertificateData, User } from "../types";

interface CertificateFormProps {
  formData: AdiCertificateData;
  selectedUser: User | null;
  onInputChange: (field: keyof AdiCertificateData, value: string) => void;
}

export function CertificateForm({
  formData,
  selectedUser,
  onInputChange,
}: CertificateFormProps) {
  return (
    <div className="space-y-4">
      {/* Certificate Number */}
      <div className="space-y-2">
        <Label htmlFor="certificateNumber">
          Certificate Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="certificateNumber"
          value={formData.certificateNumber}
          onChange={(e) => onInputChange("certificateNumber", e.target.value)}
          placeholder="Enter certificate number"
        />
      </div>

      {/* Course Date */}
      <div className="space-y-2">
        <Label htmlFor="courseDate">
          Course Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="courseDate"
          type="date"
          value={formData.courseDate}
          onChange={(e) => onInputChange("courseDate", e.target.value)}
        />
      </div>

      {/* Course Time */}
      <div className="space-y-2">
        <Label htmlFor="courseTime">
          Course Time <span className="text-red-500">*</span>
        </Label>
        <Input
          id="courseTime"
          value={formData.courseTime}
          onChange={(e) => onInputChange("courseTime", e.target.value)}
          placeholder="e.g., 9:00 AM - 3:00 PM"
        />
      </div>

      {/* Course Address */}
      <div className="space-y-2">
        <Label htmlFor="courseAddress">
          Course Location <span className="text-red-500">*</span>
        </Label>
        <Input
          id="courseAddress"
          value={formData.courseAddress}
          onChange={(e) => onInputChange("courseAddress", e.target.value)}
          placeholder="Enter course location address"
        />
      </div>

      {/* Student Name Section */}
      <div className="pt-4 border-t border-gray-300">
        <h3 className="text-sm font-semibold mb-3">Student Information</h3>

        {/* First Name */}
        <div className="space-y-2 mb-3">
          <Label htmlFor="firstName">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange("firstName", e.target.value)}
            placeholder="Enter first name"
            disabled={!!selectedUser}
          />
        </div>

        {/* Middle Initial */}
        <div className="space-y-2 mb-3">
          <Label htmlFor="middleInitial">Middle Initial</Label>
          <Input
            id="middleInitial"
            value={formData.middleInitial}
            onChange={(e) => onInputChange("middleInitial", e.target.value)}
            placeholder="M"
            maxLength={1}
            disabled={!!selectedUser}
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange("lastName", e.target.value)}
            placeholder="Enter last name"
            disabled={!!selectedUser}
          />
        </div>
      </div>
    </div>
  );
}
