"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText } from "lucide-react";
import { useBdiCertificateDownloader, type BdiCertificateData } from "./hooks/use-bdi-certificate-downloader";

interface BdiCertificateModalProps {
  trigger?: React.ReactNode;
  initialData?: Partial<BdiCertificateData>;
  onDownload?: (data: BdiCertificateData) => void;
}

export default function BdiCertificateModal({ 
  trigger, 
  initialData = {},
  onDownload 
}: BdiCertificateModalProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { downloadBdiCertificate } = useBdiCertificateDownloader();

  const [formData, setFormData] = useState<BdiCertificateData>({
    certificateNumber: initialData.certificateNumber || "47558093",
    printDate: initialData.printDate || new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    }),
    courseCompletionDate: initialData.courseCompletionDate || new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    }),
    citationNumber: initialData.citationNumber || "ALONJJE",
    citationCounty: initialData.citationCounty || "PALM BEACH",
    courseProvider: initialData.courseProvider || "DRIVESAFELY",
    providerPhone: initialData.providerPhone || "7024857907",
    schoolName: initialData.schoolName || "AFFORDABLE DRIVING TRAFFIC SCHOOL",
    schoolPhone: initialData.schoolPhone || "5619690150",
    driversLicenseNumber: initialData.driversLicenseNumber || "C21472038S000",
    studentName: initialData.studentName || "CALDERON, ROMELIA",
    dateOfBirth: initialData.dateOfBirth || "4/4/1974",
    reasonAttending: initialData.reasonAttending || "BDI BDI Election"
  });

  const handleInputChange = (field: keyof BdiCertificateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const success = await downloadBdiCertificate(formData);
      if (success) {
        onDownload?.(formData);
        setOpen(false);
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <FileText className="w-4 h-4" />
      Generate BDI Certificate
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            BDI Certificate Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => handleInputChange('certificateNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="printDate">Print Date</Label>
              <Input
                id="printDate"
                value={formData.printDate}
                onChange={(e) => handleInputChange('printDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseCompletionDate">Course Completion Date</Label>
              <Input
                id="courseCompletionDate"
                value={formData.courseCompletionDate}
                onChange={(e) => handleInputChange('courseCompletionDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="citationNumber">Citation Number</Label>
              <Input
                id="citationNumber"
                value={formData.citationNumber}
                onChange={(e) => handleInputChange('citationNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="citationCounty">Citation County</Label>
              <Input
                id="citationCounty"
                value={formData.citationCounty}
                onChange={(e) => handleInputChange('citationCounty', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseProvider">Course Provider</Label>
              <Input
                id="courseProvider"
                value={formData.courseProvider}
                onChange={(e) => handleInputChange('courseProvider', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerPhone">Provider Phone</Label>
              <Input
                id="providerPhone"
                value={formData.providerPhone}
                onChange={(e) => handleInputChange('providerPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                value={formData.schoolName}
                onChange={(e) => handleInputChange('schoolName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolPhone">School Phone</Label>
              <Input
                id="schoolPhone"
                value={formData.schoolPhone}
                onChange={(e) => handleInputChange('schoolPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driversLicenseNumber">Drivers License Number</Label>
              <Input
                id="driversLicenseNumber"
                value={formData.driversLicenseNumber}
                onChange={(e) => handleInputChange('driversLicenseNumber', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reasonAttending">Reason Attending</Label>
              <Input
                id="reasonAttending"
                value={formData.reasonAttending}
                onChange={(e) => handleInputChange('reasonAttending', e.target.value)}
              />
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="border-2 border-gray-300 p-6 bg-white rounded-lg">
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-xl font-bold">State of Florida</h1>
              <p className="text-sm">Department of Highway Safety and Motor Vehicles</p>
              <div className="bg-gray-200 p-2 border border-gray-400 inline-block">
                <h2 className="font-bold text-sm">Course Completion Receipt</h2>
              </div>
            </div>

            <hr className="border-t-2 border-black mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6">
              <div className="space-y-1">
                <div><strong>Certificate Number:</strong> {formData.certificateNumber}</div>
                <div><strong>Print Date:</strong> {formData.printDate}</div>
                <div><strong>Course Completion Date:</strong> {formData.courseCompletionDate}</div>
                <div><strong>Citation Number:</strong> {formData.citationNumber}</div>
                <div><strong>Citation County:</strong> {formData.citationCounty}</div>
              </div>
              <div className="space-y-1">
                <div><strong>Name of Course Provider:</strong> {formData.courseProvider}</div>
                <div><strong>Provider Phone:</strong> {formData.providerPhone}</div>
                <div><strong>Name of School:</strong> {formData.schoolName}</div>
                <div><strong>School Phone:</strong> {formData.schoolPhone}</div>
              </div>
            </div>

            <hr className="border-t border-black mb-4" />

            <div className="space-y-1 text-xs mb-6">
              <div><strong>Drivers License Number:</strong> {formData.driversLicenseNumber}</div>
              <div><strong>Student Name:</strong> {formData.studentName}</div>
              <div><strong>Date Of Birth:</strong> {formData.dateOfBirth}</div>
              <div><strong>Reason Attending:</strong> {formData.reasonAttending}</div>
            </div>

            <div className="text-center text-xs mt-8">
              <p className="font-bold">State of Florida</p>
              <p>Department of Highway Safety and Motor Vehicles</p>
              <p>Driver School Inquiry:</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDownload} 
              className="flex items-center gap-2"
              disabled={isGenerating}
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}