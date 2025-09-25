"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface BdiCertificateData {
  certificateNumber: string;
  printDate: string;
  courseCompletionDate: string;
  citationNumber: string;
  citationCounty: string;
  courseProvider: string;
  providerPhone: string;
  schoolName: string;
  schoolPhone: string;
  driversLicenseNumber: string;
  studentName: string;
  dateOfBirth: string;
  reasonAttending: string;
}

export default function BdiCertificate() {
  const [formData, setFormData] = useState<BdiCertificateData>({
    certificateNumber: "47558093",
    printDate: "Sep 10, 2025",
    courseCompletionDate: "Sep 10, 2025",
    citationNumber: "ALONJJE",
    citationCounty: "PALM BEACH",
    courseProvider: "DRIVESAFELY",
    providerPhone: "7024857907",
    schoolName: "AFFORDABLE DRIVING TRAFFIC SCHOOL",
    schoolPhone: "5619690150",
    driversLicenseNumber: "C21472038S000",
    studentName: "CALDERON, ROMELIA",
    dateOfBirth: "4/4/1974",
    reasonAttending: "BDI BDI Election"
  });

  const certificateRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof BdiCertificateData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Header - State of Florida
      page.drawText("State of Florida", {
        x: width / 2 - 60,
        y: height - 50,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("Department of Highway Safety and Motor Vehicles", {
        x: width / 2 - 150,
        y: height - 70,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      // Title box
      page.drawRectangle({
        x: 40,
        y: height - 110,
        width: width - 80,
        height: 25,
        color: rgb(0.8, 0.8, 0.8),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText("Course Completion Receipt", {
        x: width / 2 - 90,
        y: height - 105,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Horizontal line
      page.drawLine({
        start: { x: 40, y: height - 130 },
        end: { x: width - 40, y: height - 130 },
        thickness: 2,
        color: rgb(0, 0, 0),
      });

      let yPosition = height - 160;

      // Certificate information section
      const leftColumnFields = [
        { label: "Certificate Number:", value: formData.certificateNumber },
        { label: "Print Date:", value: formData.printDate },
        { label: "Course Completion Date:", value: formData.courseCompletionDate },
        { label: "Citation Number:", value: formData.citationNumber },
        { label: "Citation County:", value: formData.citationCounty },
      ];

      const rightColumnFields = [
        { label: "Name of Course Provider:", value: formData.courseProvider },
        { label: "Provider Phone:", value: formData.providerPhone },
        { label: "Name of School:", value: formData.schoolName },
        { label: "School Phone:", value: formData.schoolPhone },
      ];

      // Left column
      leftColumnFields.forEach((field, index) => {
        const y = yPosition - (index * 25);
        page.drawText(field.label, {
          x: 50,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(field.value, {
          x: 180,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      });

      // Right column
      rightColumnFields.forEach((field, index) => {
        const y = yPosition - (index * 25);
        page.drawText(field.label, {
          x: 320,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(field.value, {
          x: 450,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      });

      // Horizontal line separator
      page.drawLine({
        start: { x: 40, y: yPosition - 140 },
        end: { x: width - 40, y: yPosition - 140 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 170;

      // Student information section
      const studentFields = [
        { label: "Drivers License Number:", value: formData.driversLicenseNumber },
        { label: "Student Name:", value: formData.studentName },
        { label: "Date Of Birth:", value: formData.dateOfBirth },
        { label: "Reason Attending:", value: formData.reasonAttending },
      ];

      studentFields.forEach((field, index) => {
        const y = yPosition - (index * 25);
        page.drawText(field.label, {
          x: 50,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(field.value, {
          x: 180,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      });

      // Bottom section
      yPosition -= 150;

      page.drawText("State of Florida", {
        x: width / 2 - 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText("Department of Highway Safety and Motor Vehicles", {
        x: width / 2 - 120,
        y: yPosition - 20,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText("Driver School Inquiry:", {
        x: width / 2 - 70,
        y: yPosition - 40,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      // Convert PDF to bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BDI_Certificate_${formData.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            BDI Certificate Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <div className="border-2 border-gray-300 p-6 bg-white" ref={certificateRef}>
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-xl font-bold">State of Florida</h1>
              <p className="text-sm">Department of Highway Safety and Motor Vehicles</p>
              <div className="bg-gray-200 p-2 border border-gray-400">
                <h2 className="font-bold">Course Completion Receipt</h2>
              </div>
            </div>

            <hr className="border-t-2 border-black mb-4" />

            <div className="grid grid-cols-2 gap-8 text-sm mb-6">
              <div className="space-y-2">
                <div><strong>Certificate Number:</strong> {formData.certificateNumber}</div>
                <div><strong>Print Date:</strong> {formData.printDate}</div>
                <div><strong>Course Completion Date:</strong> {formData.courseCompletionDate}</div>
                <div><strong>Citation Number:</strong> {formData.citationNumber}</div>
                <div><strong>Citation County:</strong> {formData.citationCounty}</div>
              </div>
              <div className="space-y-2">
                <div><strong>Name of Course Provider:</strong> {formData.courseProvider}</div>
                <div><strong>Provider Phone:</strong> {formData.providerPhone}</div>
                <div><strong>Name of School:</strong> {formData.schoolName}</div>
                <div><strong>School Phone:</strong> {formData.schoolPhone}</div>
              </div>
            </div>

            <hr className="border-t border-black mb-4" />

            <div className="space-y-2 text-sm mb-6">
              <div><strong>Drivers License Number:</strong> {formData.driversLicenseNumber}</div>
              <div><strong>Student Name:</strong> {formData.studentName}</div>
              <div><strong>Date Of Birth:</strong> {formData.dateOfBirth}</div>
              <div><strong>Reason Attending:</strong> {formData.reasonAttending}</div>
            </div>

            <div className="text-center text-sm mt-8">
              <p className="font-bold">State of Florida</p>
              <p>Department of Highway Safety and Motor Vehicles</p>
              <p>Driver School Inquiry:</p>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <Button onClick={generatePDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download BDI Certificate PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}