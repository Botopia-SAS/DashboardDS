"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Calendar, Download, ArrowLeft } from "lucide-react";
import { useBdiCertificateDownloader } from "@/components/ticket/hooks/use-bdi-certificate-downloader";
import Link from "next/link";

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
  email: string;
  phoneNumber?: string;
  birthDate?: string;
  dni?: string;
  ssnLast4?: string;
  hasLicense?: boolean;
  licenseNumber?: string;
  streetAddress?: string;
  apartmentNumber?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  sex?: string;
  role?: string;
  createdAt?: string;
}

export default function BdiCertificateGenerator() {
  const [classes, setClasses] = useState<TicketClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [certificateNumber, setCertificateNumber] = useState<string>("");
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // School information fields
  const [schoolName, setSchoolName] = useState<string>("AFFORDABLE DRIVING TRAFFIC SCHOOL");
  const [schoolPhone, setSchoolPhone] = useState<string>("5619690150");
  const [schoolLocation, setSchoolLocation] = useState<string>("Florida");
  const [courseProvider, setCourseProvider] = useState<string>("DRIVESAFELY");
  const [providerPhone, setProviderPhone] = useState<string>("7024857907");

  // Driver's license number override
  const [driversLicenseNumber, setDriversLicenseNumber] = useState<string>("");

  const { downloadBdiCertificate } = useBdiCertificateDownloader();

  // Fetch BDI-type classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        const data = await response.json();
        if (data.success || Array.isArray(data)) {
          const allClasses = data.success ? data.data : data;
          // Filter only 'bdi' type classes
          const bdiClasses = allClasses.filter((cls: TicketClass) => cls.classType === 'bdi');
          setClasses(bdiClasses);
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
        console.log('Students data received:', data);
        if (Array.isArray(data)) {
          const mappedStudents: Student[] = data.map((student: Record<string, unknown>) => ({
            _id: String(student.id || student._id || ''),
            firstName: String(student.firstName || ''),
            middleName: String(student.middleName || ''),
            lastName: String(student.lastName || ''),
            email: String(student.email || ''),
            birthDate: student.birthDate ? String(student.birthDate) : undefined,
            phoneNumber: student.phoneNumber ? String(student.phoneNumber) : undefined,
            dni: student.dni ? String(student.dni) : undefined,
            ssnLast4: student.ssnLast4 ? String(student.ssnLast4) : undefined,
            hasLicense: Boolean(student.hasLicense),
            licenseNumber: student.licenseNumber ? String(student.licenseNumber) : undefined,
            streetAddress: student.streetAddress ? String(student.streetAddress) : undefined,
            apartmentNumber: student.apartmentNumber ? String(student.apartmentNumber) : undefined,
            city: student.city ? String(student.city) : undefined,
            state: student.state ? String(student.state) : undefined,
            zipCode: student.zipCode ? String(student.zipCode) : undefined,
            sex: student.sex ? String(student.sex) : undefined,
            role: student.role ? String(student.role) : undefined,
            createdAt: student.createdAt ? String(student.createdAt) : undefined
          }));

          setStudents(mappedStudents);
          setFilteredStudents(mappedStudents);
          console.log('Students loaded:', mappedStudents.length);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
        setFilteredStudents([]);
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
      const classDate = new Date(selectedClassData.date);
      const currentDate = new Date();

      const certificateData = {
        certificateNumber: certificateNumber.trim(),
        printDate: currentDate.toLocaleDateString('en-US', {
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
        citationNumber: "",
        citationCounty: "",
        courseProvider: courseProvider,
        providerPhone: providerPhone,
        schoolName: schoolName,
        schoolPhone: schoolPhone,
        schoolLocation: schoolLocation,
        driversLicenseNumber: driversLicenseNumber || selectedStudentData.licenseNumber || "",
        studentName: `${selectedStudentData.lastName?.toUpperCase() || ''}, ${selectedStudentData.firstName?.toUpperCase() || ''}`,
        dateOfBirth: selectedStudentData.birthDate ? new Date(selectedStudentData.birthDate).toLocaleDateString('en-US') : "",
        reasonAttending: "BDI Course Completion"
      };

      const success = await downloadBdiCertificate(certificateData);

      if (success) {
        // Save certificate to database
        const certificateRecord = {
          certificateNumber: certificateData.certificateNumber,
          studentId: selectedStudent,
          studentName: certificateData.studentName,
          classId: selectedClass,
          className: selectedClassData.title || 'BDI Course',
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
            console.log('BDI Certificate saved to database');
          } else {
            console.warn('Certificate generated but failed to save to database');
          }
        } catch (saveError) {
          console.error('Error saving certificate:', saveError);
        }

        alert(`BDI Certificate generated successfully for ${selectedStudentData.firstName} ${selectedStudentData.lastName}`);
        // Clear form
        setSelectedClass("");
        setSelectedStudent("");
        setCertificateNumber("");
        setStudentSearchTerm("");
        setDriversLicenseNumber("");
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
      {/* Navigation Header */}
      <div className="mb-6">
        <Link
          href="/ticket"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket Calendar
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <FileText className="w-8 h-8" />
          BDI Certificate Generator
        </h1>
        <p className="text-gray-600">
          Generate BDI certificates for course completions
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
              Select Class (BDI type only) *
            </Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select" className="bg-white border-gray-300">
                <SelectValue placeholder="Choose a BDI class..." />
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
              <p className="text-sm text-gray-500">No BDI type classes found.</p>
            )}
          </div>

          {/* Student Search and Selection */}
          <div className="space-y-2">
            <Label htmlFor="student-search" className="text-sm font-medium">
              Search & Select Student *
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
                        {student.firstName || ''} {student.lastName || ''}
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
              placeholder="Enter certificate number (e.g., BDI001234)"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
            />
          </div>

          {/* Driver's License Number Override */}
          <div className="space-y-2">
            <Label htmlFor="license-number" className="text-sm font-medium">
              Driver&apos;s License Number
            </Label>
            <Input
              id="license-number"
              placeholder="Enter driver's license number (optional - overrides student record)"
              value={driversLicenseNumber}
              onChange={(e) => setDriversLicenseNumber(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Leave empty to use the license number from student record
            </p>
          </div>

          {/* School Information Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 border-b pb-2">School Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school-name" className="text-sm font-medium">
                  School Name
                </Label>
                <Input
                  id="school-name"
                  placeholder="Enter school name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-phone" className="text-sm font-medium">
                  School Phone
                </Label>
                <Input
                  id="school-phone"
                  placeholder="Enter school phone number"
                  value={schoolPhone}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school-location" className="text-sm font-medium">
                  School Location
                </Label>
                <Input
                  id="school-location"
                  placeholder="Enter school location"
                  value={schoolLocation}
                  onChange={(e) => setSchoolLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-provider" className="text-sm font-medium">
                  Course Provider
                </Label>
                <Input
                  id="course-provider"
                  placeholder="Enter course provider name"
                  value={courseProvider}
                  onChange={(e) => setCourseProvider(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider-phone" className="text-sm font-medium">
                  Provider Phone
                </Label>
                <Input
                  id="provider-phone"
                  placeholder="Enter provider phone number"
                  value={providerPhone}
                  onChange={(e) => setProviderPhone(e.target.value)}
                />
              </div>
            </div>
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
                        {selectedClassData.title || 'BDI Course'}
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
                      {(driversLicenseNumber || selectedStudentData.licenseNumber) && (
                        <div className="text-sm text-gray-600">
                          License Number: {driversLicenseNumber || selectedStudentData.licenseNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* School Info */}
                  <div className="bg-white p-3 rounded border">
                    <h5 className="font-medium text-gray-800 mb-2 text-center">School Information</h5>
                    <div className="text-center space-y-1">
                      <div className="font-semibold text-gray-900">
                        {schoolName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Phone: {schoolPhone}
                      </div>
                      <div className="text-sm text-gray-600">
                        Location: {schoolLocation}
                      </div>
                      <div className="text-sm text-gray-600">
                        Provider: {courseProvider} ({providerPhone})
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
            <p><strong>1. Select Class:</strong> Choose a BDI type class from the dropdown. Only active classes are shown.</p>
            <p><strong>2. Search Student:</strong> Use the search box to filter students by name or email. Type &apos;A&apos; to see all students starting with A.</p>
            <p><strong>3. Select Student:</strong> Choose a student from the filtered dropdown list. Name and email are shown for easy identification.</p>
            <p><strong>4. Certificate Number:</strong> Enter a unique certificate number for tracking purposes.</p>
            <p><strong>5. Generate PDF:</strong> Click the button to download the BDI certificate and save it to the database.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}