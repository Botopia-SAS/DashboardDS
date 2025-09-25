"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Calendar, Download } from "lucide-react";

// Custom Certificate generator function using PDF template
const generateDateCertificate = async (certificateData: {
  studentName: string;
  dateOfBirth: string;
  className: string;
  certificateNumber: string;
  printDate: string;
  courseCompletionDate: string;
}) => {
  try {
    // Import pdf-lib for PDF manipulation
    const { PDFDocument, rgb } = await import('pdf-lib');

    // Load the existing PDF template
    const existingPdfBytes = await fetch('/date_data.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Get page dimensions
    const { width, height } = firstPage.getSize();
    console.log('Page dimensions:', width, height);
    
    // Embed fonts - Use Times-Roman for a more formal serif look like the original
    const timesFont = await pdfDoc.embedFont('Times-Roman');
    const helveticaFont = await pdfDoc.embedFont('Helvetica');
    
    // Helper function to draw centered text
    const drawCenteredText = (text: string, x: number, y: number, size: number = 12, useSerif: boolean = true) => {
      const font = useSerif ? timesFont : helveticaFont;
      const textWidth = font.widthOfTextAtSize(text, size);
      firstPage.drawText(text, {
        x: x - (textWidth / 2), // Center horizontally
        y: height - y, // PDF coordinates are from bottom, so we subtract from height
        size: size,
        font: font,
        color: rgb(0, 0, 0)
      });
    };
    
    // Add text at your specified coordinates (centered)
    // Nombre + Apellido: x=390, y=242 (center) - keeping original position
    drawCenteredText(certificateData.studentName, 390, 242, 14, true);

    // Cumpleaños: x=390, y=284 (center) - moving down a bit more
    if (certificateData.dateOfBirth) {
      drawCenteredText(certificateData.dateOfBirth, 390, 295, 12, true);
    }

    // Nombre de la Clase: x=390, y=410 (center) - moving down a bit more
    drawCenteredText(certificateData.className, 390, 425, 12, true);

    // Número de Certificado: x=163, y=394 (center) - keeping original position
    drawCenteredText(certificateData.certificateNumber, 163, 394, 12, true);

    // Fecha de Generación: x=390, y=484 (center) - moving down a bit more
    drawCenteredText(certificateData.printDate, 390, 495, 12, true);

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    // Create download link - Convert Uint8Array to ArrayBuffer
    const arrayBuffer = new ArrayBuffer(pdfBytes.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(pdfBytes);
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificate_${certificateData.certificateNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;

  } catch (error) {
    console.error('Error generating certificate with PDF template:', error);
    return false;
  }
};

interface TicketClass {
  _id: string;
  title?: string;
  classType?: string;
  date: string;
  hour: string;
  endHour: string;
  type: string;
  status: string;
  students: string[];
}

interface Student {
  _id?: string;
  id?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  midl?: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;
  dni?: string;
  role?: string;
  createdAt?: string;
}

export default function CertificateGenerator() {
  const [classes, setClasses] = useState<TicketClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [certificateNumber, setCertificateNumber] = useState<string>("");
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch date-type classes with detailed information
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        if (data.success || Array.isArray(data)) {
          const allClasses = data.success ? data.data : data;
          // Filter only 'date' type classes
          const dateClasses = allClasses.filter((cls: TicketClass) => cls.classType === 'date');
          setClasses(dateClasses);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, []);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/customers');
        const data = await response.json();
        console.log('Students data received:', data); // Debug log
        if (Array.isArray(data)) {
          // Map the data to match our interface
          const mappedStudents: Student[] = data.map((student: Record<string, unknown>) => ({
            _id: String(student.id || student._id || ''),
            firstName: String(student.firstName || student.name || ''),
            middleName: String(student.middleName || student.midl || ''),
            lastName: String(student.lastName || ''),
            email: String(student.email || ''),
            birthDate: student.birthDate ? String(student.birthDate) : undefined,
            phoneNumber: student.phoneNumber ? String(student.phoneNumber) : undefined,
            dni: student.dni ? String(student.dni) : undefined,
            role: student.role ? String(student.role) : undefined,
            createdAt: student.createdAt ? String(student.createdAt) : undefined
          }));

          setStudents(mappedStudents);
          setFilteredStudents(mappedStudents);
          console.log('Students loaded:', mappedStudents.length); // Debug log
        } else if (data.success && Array.isArray(data.data)) {
          const mappedStudents: Student[] = data.data.map((student: Record<string, unknown>) => ({
            _id: String(student.id || student._id || ''),
            firstName: String(student.firstName || student.name || ''),
            middleName: String(student.middleName || student.midl || ''),
            lastName: String(student.lastName || ''),
            email: String(student.email || ''),
            birthDate: student.birthDate ? String(student.birthDate) : undefined,
            phoneNumber: student.phoneNumber ? String(student.phoneNumber) : undefined,
            dni: student.dni ? String(student.dni) : undefined,
            role: student.role ? String(student.role) : undefined,
            createdAt: student.createdAt ? String(student.createdAt) : undefined
          }));

          setStudents(mappedStudents);
          setFilteredStudents(mappedStudents);
          console.log('Students loaded:', mappedStudents.length); // Debug log
        } else {
          console.error('Unexpected data format:', data);
          setStudents([]);
          setFilteredStudents([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search term
  useEffect(() => {
    if (!studentSearchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const firstName = student.firstName || '';
        const middleName = student.middleName || '';
        const lastName = student.lastName || '';
        const fullName = `${firstName} ${middleName} ${lastName}`.toLowerCase();
        const email = (student.email || '').toLowerCase();
        const searchTerm = studentSearchTerm.toLowerCase();

        return fullName.includes(searchTerm) || email.includes(searchTerm);
      });
      setFilteredStudents(filtered);
    }
  }, [studentSearchTerm, students]);

  const selectedClassData = classes.find(cls => cls._id === selectedClass);
  const selectedStudentData = students.find(student => student._id === selectedStudent);

  const handleGeneratePDF = async () => {
    if (!selectedClass || !selectedStudent || !certificateNumber.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!selectedClassData || !selectedStudentData) {
      alert('Invalid class or student selection.');
      return;
    }

    setLoading(true);

    try {
      // Format dates
      const classDate = new Date(selectedClassData.date);

      const certificateData = {
        certificateNumber: certificateNumber.trim(),
        printDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'America/New_York'
        }),
        courseCompletionDate: classDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        studentName: `${(selectedStudentData.firstName || selectedStudentData.name || '').toUpperCase()} ${(selectedStudentData.lastName || selectedStudentData.midl || '').toUpperCase()}`,
        dateOfBirth: selectedStudentData.birthDate ? new Date(selectedStudentData.birthDate).toLocaleDateString('en-US') : "",
        className: selectedClassData.title || 'D.A.T.E. Course'
      };

      const success = await generateDateCertificate(certificateData);

      if (success) {
        // Save certificate to database
        const certificateRecord = {
          certificateNumber: certificateData.certificateNumber,
          studentId: selectedStudent,
          studentName: certificateData.studentName,
          classId: selectedClass,
          className: selectedClassData.title || 'Certificate Course',
          classDate: selectedClassData.date,
          issueDate: certificateData.printDate,
          courseCompletionDate: certificateData.courseCompletionDate,
          studentEmail: selectedStudentData.email,
          studentBirthDate: selectedStudentData.birthDate
        };

        try {
          const saveResponse = await fetch('/api/certificados-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(certificateRecord)
          });

          if (saveResponse.ok) {
            console.log('Certificate saved to database');
          } else {
            console.warn('Certificate generated but failed to save to database');
          }
        } catch (saveError) {
          console.error('Error saving certificate:', saveError);
        }

        alert(`Certificate generated successfully for ${selectedStudentData.firstName || selectedStudentData.name || ''} ${selectedStudentData.lastName || selectedStudentData.midl || ''}`);
        // Clear form
        setSelectedClass("");
        setSelectedStudent("");
        setCertificateNumber("");
        setStudentSearchTerm("");
      } else {
        alert('Failed to generate certificate. Please try again.');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('An error occurred while generating the certificate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <FileText className="w-8 h-8" />
          Certificate Generator
        </h1>
        <p className="text-gray-600">
          Generate certificates for course completions
        </p>
      </div>

      <Separator className="mb-8" />

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Certificate Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class-select" className="text-sm font-medium">
              Select Class (Certificate type only) *
            </Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select" className="bg-white border-gray-300">
                <SelectValue placeholder="Choose a certificate class..." />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 shadow-lg">
                {classes.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id} className="hover:bg-gray-100">
                    <div className="flex flex-col">
                      <span className="font-medium">{cls.title || 'Unnamed Class'}</span>
                      <span className="text-xs text-gray-500">
                        {cls.date ? new Date(cls.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : ''}
                        {cls.hour && cls.endHour ? ` - ${cls.hour} to ${cls.endHour}` : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classes.length === 0 && (
              <p className="text-sm text-gray-500">No certificate type classes found.</p>
            )}
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student-search" className="text-sm font-medium">
              Select Student *
            </Label>

            {/* Search Input */}
            <Input
              id="student-search"
              placeholder="Type to search students..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="mb-2"
            />

            {/* Student Selection Results */}
            {studentSearchTerm && (
              <div className="border rounded-md max-h-48 overflow-y-auto bg-white">
                {filteredStudents.length > 0 ? (
                  filteredStudents.slice(0, 10).map((student) => (
                    <button
                      key={student._id}
                      onClick={() => {
                        setSelectedStudent(student._id || '');
                        const firstName = student.firstName || '';
                        const lastName = student.lastName || '';
                        const fullName = `${firstName} ${lastName}`.trim();
                        setStudentSearchTerm(`${fullName} (${student.email})`);
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                        selectedStudent === student._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {student.firstName || ''} {student.middleName || ''} {student.lastName || ''}
                      </div>
                      <div className="text-sm text-gray-500">({student.email})</div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">
                    No students found matching &quot;{studentSearchTerm}&quot;
                  </div>
                )}
              </div>
            )}

            {/* Show total count when not searching */}
            {!studentSearchTerm && (
              <div className="text-xs text-gray-500">
                {students.length > 0 ? (
                  `${students.length} students available. Start typing to search...`
                ) : (
                  <span className="text-red-500">No students found in database.</span>
                )}
              </div>
            )}

            {selectedStudentData && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Selected Student:</span>
                </div>
                <div className="mt-1 text-sm">
                  <div><strong>Name:</strong> {selectedStudentData.firstName || ''} {selectedStudentData.middleName || ''} {selectedStudentData.lastName || ''}</div>
                  <div><strong>Email:</strong> {selectedStudentData.email}</div>
                  <div><strong>Birth Date:</strong> {selectedStudentData.birthDate ? new Date(selectedStudentData.birthDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Not provided'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Certificate Number */}
          <div className="space-y-2">
            <Label htmlFor="cert-number" className="text-sm font-medium">
              Certificate Number *
            </Label>
            <Input
              id="cert-number"
              placeholder="Enter certificate number (e.g., CERT001234)"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
            />
          </div>

          {/* Class and Student Info Summary */}
          {selectedClassData && selectedStudentData && certificateNumber && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-medium text-blue-800 mb-3 text-center">📜 Certificate Preview</h4>
                <div className="space-y-3 text-sm">
                  {/* Student Info */}
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-gray-800 mb-2 text-center">Student Information</h5>
                    <div className="text-center space-y-1">
                      <div className="text-lg font-bold text-gray-900">
                        {selectedStudentData.firstName || ''} {selectedStudentData.middleName || ''} {selectedStudentData.lastName || ''}
                      </div>
                      <div className="text-sm text-gray-600">
                        Date of Birth: {selectedStudentData.birthDate ? new Date(selectedStudentData.birthDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not provided'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Class Info */}
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-gray-800 mb-2 text-center">Course Information</h5>
                    <div className="text-center space-y-1">
                      <div className="font-semibold text-gray-900">
                        {selectedClassData.title || 'Certificate Course'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Class Date: {selectedClassData.date ? new Date(selectedClassData.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not specified'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Certificate Info */}
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-gray-800 mb-2 text-center">Certificate Details</h5>
                    <div className="text-center space-y-1">
                      <div className="font-semibold text-gray-900">
                        Certificate Number: {certificateNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        Issue Date: {new Date().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <div className="pt-4">
            <Button
              onClick={handleGeneratePDF}
              disabled={!selectedClass || !selectedStudent || !certificateNumber.trim() || loading}
              className="w-full md:w-auto"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Certificate PDF
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📋 Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>1. Select Class:</strong> Choose a certificate type class from the dropdown. Only active classes are shown.</p>
            <p><strong>2. Search Student:</strong> Use the search box to filter students by name or email. Type &apos;A&apos; to see all students starting with A.</p>
            <p><strong>3. Select Student:</strong> Choose a student from the filtered dropdown list. Name and email are shown for easy identification.</p>
            <p><strong>4. Certificate Number:</strong> Enter a unique certificate number for tracking purposes.</p>
            <p><strong>5. Generate PDF:</strong> Click the button to download the certificate and save it to the database.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}