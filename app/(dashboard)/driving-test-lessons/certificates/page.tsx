"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Loader from "@/components/custom ui/Loader";
import { SignatureCanvas } from "@/components/ticket/SignatureCanvas";
import { PDFDocument } from "pdf-lib";
import {
  useDrivingLessonCertificateGenerator,
  DrivingLessonCertificateData,
} from "@/components/driving-test-lessons/hooks/use-driving-lesson-certificate-generator";

interface DrivingClass {
  _id: string;
  date: string;
  start: string;
  end: string;
  instructorId: string;
  instructorName: string;
  studentId: string;
  studentName: string;
  status: string;
  studentEmail?: string;
  studentPhone?: string;
}

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  licenseNumber?: string; // License number from User
  hour?: string; // Hour from the selected class
  hours?: number; // Total hours accumulated
  completionDate?: string;
  instructorName?: string;
  instructorSignature?: string;
  selectedClassIds?: string[]; // IDs of selected classes (slots)
  certificateId?: string; // ID of the certificate in the database
}

export default function DrivingLessonCertificatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<DrivingClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<DrivingClass[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<'saving' | 'generating' | 'success' | 'error'>('saving');
  const [generateMessage, setGenerateMessage] = useState('');
  const { generateMultipleDrivingLessonCertificates, isGenerating } =
    useDrivingLessonCertificateGenerator();

  // Filters
  const [filterInstructor, setFilterInstructor] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Unique lists for dropdowns
  const [instructors, setInstructors] = useState<string[]>([]);
  const [studentNames, setStudentNames] = useState<string[]>([]);

  // Pagination for students
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  // Pagination for classes
  const [currentClassPage, setCurrentClassPage] = useState(1);
  const classesPerPage = 5;

  useEffect(() => {
    fetchBookedClasses();
  }, []);

  const fetchBookedClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/driving-test-lessons/events");

      if (response.ok) {
        const data = await response.json();

        // Filter only Driving Lessons with "booked" status
        const bookedLessons = data.filter(
          (event: any) =>
            event.classType === 'driving lesson' &&
            event.status === 'booked'
        );

        // Enrich with student information (email and phone)
        const enrichedLessons = await Promise.all(
          bookedLessons.map(async (lesson: any) => {
            if (lesson.studentId) {
              try {
                const studentResponse = await fetch(`/api/customers/${lesson.studentId}`);
                if (studentResponse.ok) {
                  const studentData = await studentResponse.json();
                  return {
                    ...lesson,
                    studentEmail: studentData.email || '',
                    studentPhone: studentData.phoneNumber || studentData.phone || ''
                  };
                }
              } catch (err) {
                console.error(`Error fetching student ${lesson.studentId}:`, err);
              }
            }
            return lesson;
          })
        );

        setClasses(enrichedLessons);
        setFilteredClasses(enrichedLessons);

        // Extract unique instructors and students
        const uniqueInstructors = [...new Set(enrichedLessons.map((c: any) => c.instructorName))];
        const uniqueStudents = [...new Set(enrichedLessons.map((c: any) => c.studentName))];
        setInstructors(uniqueInstructors);
        setStudentNames(uniqueStudents);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = classes;

    if (filterInstructor) {
      filtered = filtered.filter(c => c.instructorName === filterInstructor);
    }

    if (filterStudent) {
      filtered = filtered.filter(c => c.studentName === filterStudent);
    }

    if (filterDate) {
      filtered = filtered.filter(c => c.start?.split('T')[0] === filterDate);
    }

    setFilteredClasses(filtered);
    // Reset to page 1 when filters change
    setCurrentClassPage(1);
  }, [filterInstructor, filterStudent, filterDate, classes]);

  const clearFilters = () => {
    setFilterInstructor("");
    setFilterStudent("");
    setFilterDate("");
  };

  const clearSelectedClasses = () => {
    setSelectedClasses([]);
    setStudents([]);
    setCurrentPage(1);
  };

  const handleClassSelection = async (classId: string) => {
    if (selectedClasses.includes(classId)) {
      // Deselect
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      // Verify unique students
      const currentSelection = filteredClasses.filter((c, index) => 
        selectedClasses.includes(c._id || `class-${index}`)
      );
      
      const newClass = filteredClasses.find((c, index) => (c._id || `class-${index}`) === classId);
      
      if (newClass) {
        // Add the new class temporarily to verify
        const tempSelection = [...currentSelection, newClass];
        const uniqueStudents = new Set(tempSelection.map(c => c.studentId));
        
        // Maximum 3 different unique students
        if (uniqueStudents.size > 3) {
          alert("You can only select classes from up to 3 different students");
          return;
        }
      }
      
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const loadStudentsFromSelectedClasses = async () => {
    if (selectedClasses.length === 0) {
      setStudents([]);
      return;
    }

    try {
      setLoadingStudents(true);

      // Get students from selected classes
      const selectedClassObjects = filteredClasses.filter((c, index) =>
        selectedClasses.includes(c._id || `class-${index}`)
      );

      const studentIds = [...new Set(selectedClassObjects.map(c => c.studentId).filter(Boolean))];

      if (studentIds.length === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      // Group students by ID and accumulate hours
      const studentGroups = new Map();
      
      selectedClassObjects.forEach((classObj, idx) => {
        const studentId = classObj.studentId;
        if (!studentGroups.has(studentId)) {
          studentGroups.set(studentId, {
            id: studentId,
            classes: [],
            selectedClassIds: [] // Store the IDs here
          });
        }
        studentGroups.get(studentId).classes.push(classObj);
        
        // Get the ID from the class object or construct it
        const classId = classObj._id || selectedClasses.find(id => 
          selectedClasses.includes(id) && filteredClasses[filteredClasses.findIndex(c => 
            c._id === id
          )] === classObj
        );
        
        console.log('Processing class:', classObj.date, classObj.start, '- ID:', classId);
        
        // Add the class ID to the selectedClassIds array
        if (classId) {
          studentGroups.get(studentId).selectedClassIds.push(String(classId));
        } else {
          console.warn('Could not find ID for class:', classObj);
        }
      });

      // Fetch student details and calculate total hours
      const studentsData = await Promise.all(
        Array.from(studentGroups.keys()).map(async (studentId) => {
          try {
              const response = await fetch(`/api/customers/${studentId}`);
            if (response.ok) {
              const studentData = await response.json();
              const studentGroup = studentGroups.get(studentId);
              const classes = studentGroup.classes;
              const selectedClassIds = studentGroup.selectedClassIds || [];
              
              console.log('Loading student:', studentData.firstName, '- Selected IDs:', selectedClassIds);
              
              // Calculate total hours for this student
              let totalHours = 0;
              classes.forEach((cls: any) => {
                if (cls.start && cls.end) {
                  const start = new Date(cls.start);
                  const end = new Date(cls.end);
                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  totalHours += hours;
                }
              });
              
              // Get instructor name from first class
              const firstClass = classes[0];
              const instructorName = firstClass?.instructorName || '';
              
              // Try to find existing certificate for this student
              let certificateId = null;
              try {
                const certResponse = await fetch(`/api/driving-test-lessons/certificates?studentId=${studentId}`);
                if (certResponse.ok) {
                  const certs = await certResponse.json();
                  const drivingLessonCert = certs.find((cert: any) => cert.classType === 'driving lesson');
                  if (drivingLessonCert) {
                    certificateId = drivingLessonCert._id;
                  }
                }
              } catch (err) {
                console.error(`Error fetching certificate for student ${studentId}:`, err);
              }
              
              return {
                ...studentData,
                hours: Math.round(totalHours * 100) / 100, // Round to 2 decimals
                completionDate: firstClass?.start ? firstClass.start.split('T')[0] : '',
                instructorName: instructorName,
                selectedClassIds: selectedClassIds,
                certificateId: certificateId,
                licenseNumber: studentData.licenseNumber || ''
              };
            }
          } catch (err) {
            console.error(`Error fetching student ${studentId}:`, err);
          }
          return null;
        })
      );

      setStudents(studentsData.filter(s => s !== null));
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudentsFromSelectedClasses();
  }, [selectedClasses, filteredClasses]);

  // Download certificates function
  const downloadCertificates = useCallback(async () => {
    if (students.length === 0) {
      setGenerateStatus('error');
      setGenerateMessage('No students to generate certificates for');
      setShowGenerateModal(true);
      return;
    }

    // Show modal and start process
    setShowGenerateModal(true);
    setGenerateStatus('saving');
    setGenerateMessage(`Saving certificates to database...`);

    try {
      // Save certificates to database first
      // Helper function to save a certificate
      const saveCert = async (student: Student) => {
        const studentFirstName = (student as any).firstName || student.first_name;
        const studentLastName = (student as any).lastName || student.last_name;
        
        console.log('=== Saving certificate for student ===');
        console.log('Student:', studentFirstName, studentLastName);
        console.log('Student ID:', student._id);
        console.log('Selected class IDs from student:', student.selectedClassIds);
        console.log('Total classes available (filtered):', filteredClasses.length);
        
        // Get all classes that were selected for this student from the filtered classes
        const selectedClassesData = filteredClasses.filter((c, index) => {
          const classId = c._id || `class-${index}`;
          return student.selectedClassIds?.includes(String(classId));
        });
        
        console.log('Found classes for student:', selectedClassesData.length);
        console.log('Found class IDs:', selectedClassesData.map((c, i) => c._id || `class-${i}`));
        
        // Use the first selected class ID or fallback to first in the array
        const mainClassId = selectedClassesData[0]?._id || student.selectedClassIds?.[0];
        
        if (!mainClassId) {
          console.error("No classes selected for this student");
          console.error('Student object:', student);
          setGenerateStatus('error');
          setGenerateMessage(`Error: No classes selected for student ${studentFirstName}`);
          return null;
        }
        
        console.log('Using main class ID:', mainClassId);

        const certData = {
          studentId: student._id,
          classId: mainClassId,
          selectedClassIds: student.selectedClassIds,
          classType: "driving lesson",
          totalHours: student.hours,
          completionDate: student.completionDate,
          instructorName: student.instructorName,
          instructorSignature: student.instructorSignature,
          licenseNumber: student.licenseNumber,
          generated: false
        };

        let response;
        if (student.certificateId) {
          response = await fetch(`/api/driving-test-lessons/certificates`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              certificateId: student.certificateId,
              studentId: student._id,
              classId: mainClassId,
              certificateData: certData
            })
          });
        } else {
          response = await fetch(`/api/driving-test-lessons/certificates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: student._id,
              classId: mainClassId,
              certificateData: certData
            })
          });
        }

        if (response.ok) {
          const result = await response.json();
          return result.certificate?._id;
        } else {
          const error = await response.json();
          console.error('Failed to save certificate:', error);
          return null;
        }
      };

      console.log('Total students to save certificates for:', students.length);
      console.log('Total filteredClasses:', filteredClasses.length);
      console.log('Students array:', students);
      console.log('FilteredClasses array:', filteredClasses);
      
      // Create a copy of students to update
      const updatedStudentsList = [...students];
      
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        console.log(`\n=== Processing student ${i + 1}/${students.length} ===`);
        console.log('Student object:', JSON.stringify(student, null, 2));
        const certId = await saveCert(student);
        
        if (certId && !students[i].certificateId) {
          students[i] = {...students[i], certificateId: certId};
          updatedStudentsList[i] = {...updatedStudentsList[i], certificateId: certId};
        }
      }

      // Update state with new certificate IDs
      setStudents(updatedStudentsList);

      // Update modal status
      setGenerateStatus('generating');
      setGenerateMessage(`Generating PDF certificates for ${students.length} student${students.length > 1 ? 's' : ''}...`);

      // Convert students to certificate data format
      const certificateData: DrivingLessonCertificateData[] = students.map((student) => ({
        firstName: (student as any).firstName || student.first_name || "",
        lastName: (student as any).lastName || student.last_name || "",
        licenseNumber: student.licenseNumber || "",
        completionDate: student.completionDate || "",
        instructorSignature: student.instructorSignature || "",
        hours: student.hours || 0,
        selectedClassIds: student.selectedClassIds || [], // Include slot IDs
      }));


      // Generate PDFs
      const pdfs = await generateMultipleDrivingLessonCertificates(
        certificateData,
        "/templates_certificates/drivinglessons.pdf"
      );

      if (pdfs && pdfs.length > 0) {
        // Combine all PDFs into one if there are multiple
        if (pdfs.length > 1) {
          const combinedPdf = await PDFDocument.create();
          for (const pdfBlob of pdfs) {
            const pdfBytes = await pdfBlob.arrayBuffer();
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page) => combinedPdf.addPage(page));
          }
          const finalBytes = await combinedPdf.save();
          const finalBlob = new Blob([finalBytes as any], { type: "application/pdf" });
          
          // Download
          const url = URL.createObjectURL(finalBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Driving_Lesson_Certificates_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Download single PDF
          const url = URL.createObjectURL(pdfs[0]);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Driving_Lesson_Certificates_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        // Update generated status in database and save selected slot IDs
        for (const student of students) {
          if (student.certificateId) {
            try {
              const response = await fetch(`/api/driving-test-lessons/certificates`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  certificateId: student.certificateId,
                  certificateData: { 
                    generated: true,
                    selectedClassIds: student.selectedClassIds || [],
                  },
                }),
              });
              // Certificate updated successfully
            } catch (err) {
              console.error('Error updating certificate:', err);
            }
          }
        }

        setGenerateStatus('success');
        setGenerateMessage(`Successfully generated and downloaded ${students.length} certificate${students.length > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error("Error downloading certificates:", error);
      setGenerateStatus('error');
      setGenerateMessage('Error downloading certificates. Please try again.');
    }
  }, [students, generateMultipleDrivingLessonCertificates, filteredClasses, classes]);

  // Toggle edit mode for a student
  const toggleEditMode = (studentId: string) => {
    if (editingStudentId === studentId) {
      setEditingStudentId(null);
    } else {
      setEditingStudentId(studentId);
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingStudentId(null);
  };



  // Calculate students for current page
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  // Calculate classes for current page
  const indexOfLastClass = currentClassPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = filteredClasses.slice(indexOfFirstClass, indexOfLastClass);
  const totalClassPages = Math.ceil(filteredClasses.length / classesPerPage);

  if (loading) return <Loader />;

  return (
    <div className="p-6 md:p-10 bg-white min-h-screen">
      <DashboardHeader title="Driving Lesson Certificates">
        <button
          onClick={() => router.push('/driving-test-lessons')}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          ← Back to Schedule
        </button>
      </DashboardHeader>

      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
        {/* Filters */}
        <div className="mb-6 p-4 bg-white rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor
              </label>
              <select
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Instructors</option>
                {instructors.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Students</option>
                {studentNames.map((student) => (
                  <option key={student} value={student}>
                    {student}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredClasses.length} of {classes.length} classes
          </div>
        </div>

        {/* Class Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Select Classes (Max 3 Students)
            </h2>
            {selectedClasses.length > 0 && (
              <button
                onClick={clearSelectedClasses}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Selected
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Selected: {(() => {
              const selectedStudents = new Set(
                filteredClasses.filter((c, index) => 
                  selectedClasses.includes(c._id || `class-${index}`)
                ).map(c => c.studentId)
              );
              return selectedStudents.size;
            })()} unique student{selectedClasses.length > 1 ? 's' : ''} ({selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''})
          </p>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No booked driving lessons found
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {currentClasses.map((cls, index) => {
                const classId = cls._id || `class-${index}`;
                const isSelected = selectedClasses.includes(classId);
                // Check if adding this class would exceed 3 unique students
                const currentUniqueStudents = new Set(
                  filteredClasses
                    .filter((c, i) => selectedClasses.includes(c._id || `class-${i}`))
                    .map(c => c.studentId)
                );
                const wouldExceedLimit = !isSelected && currentUniqueStudents.size >= 3 && !currentUniqueStudents.has(cls.studentId);
                const isDisabled = wouldExceedLimit;

                return (
                  <div
                    key={classId}
                    onClick={() => !isDisabled && handleClassSelection(classId)}
                    className={`
                      p-1.5 rounded border-2 transition-all flex items-center justify-between
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }
                    `}
                  >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-1.5">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Date</p>
                      <p className="text-xs font-medium text-gray-800">
                        {cls.start?.split('T')[0] || cls.date || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Time</p>
                      <p className="text-xs font-medium text-gray-800">
                        {cls.start?.split('T')[1]?.substring(0, 5) || '00:00'} - {cls.end?.split('T')[1]?.substring(0, 5) || '00:00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Instructor</p>
                      <p className="text-xs text-gray-800">{cls.instructorName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Student</p>
                      <p className="text-xs font-medium text-gray-800 leading-tight">{cls.studentName}</p>
                      {cls.studentEmail && (
                        <p className="text-[10px] text-gray-600 leading-tight truncate">{cls.studentEmail}</p>
                      )}
                      {cls.studentPhone && (
                        <p className="text-[10px] text-gray-600 leading-tight">{cls.studentPhone}</p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-blue-600 ml-1.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                );
              })}
              </div>

              {/* Paginación para clases */}
              {filteredClasses.length > classesPerPage && (
                <div className="flex items-center justify-between mt-4 px-4">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstClass + 1} to {Math.min(indexOfLastClass, filteredClasses.length)} of {filteredClasses.length} classes
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentClassPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentClassPage === 1}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {currentClassPage} of {totalClassPages}
                    </span>
                    <button
                      onClick={() => setCurrentClassPage(prev => Math.min(prev + 1, totalClassPages))}
                      disabled={currentClassPage === totalClassPages}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Students Table */}
        <div className="min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Students in Selected Classes
            </h2>
            {students.length > 0 && (
              <button
                onClick={downloadCertificates}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isGenerating ? 'Generating...' : 'Download All Certificates'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto" style={{ minHeight: '350px' }}>
            {loadingStudents ? (
              // Skeleton loader
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Last Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      License Number
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Completion Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Instructor
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : students.length === 0 ? (
              <div>
                {/* Table structure with empty placeholder message */}
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        First Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Last Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        License Number
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Completion Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Instructor
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Always show 5 rows - first row with message */}
                    <tr className="h-[52px]">
                      <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                        {selectedClasses.length === 0
                          ? "Select classes to view students"
                          : "No students found"}
                      </td>
                    </tr>
                    {/* Fill empty rows to maintain consistent height (4 more rows = total 5) */}
                    {Array.from({ length: 4 }).map((_, index) => (
                      <tr key={`empty-${index}`} className="h-[52px]">
                        <td colSpan={7} className="px-4 py-3"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        First Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Last Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        License Number
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Completion Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Instructor
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentStudents.map((student) => {
                      const isEditing = editingStudentId === student._id;
                      return (
                      <tr key={student._id} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={(student as any).firstName || student.first_name || ""}
                              onChange={(e) => {
                                const updatedStudents = students.map(s => 
                                  s._id === student._id ? {...s, firstName: e.target.value, first_name: e.target.value} : s
                                );
                                setStudents(updatedStudents);
                              }}
                              placeholder="First name"
                              className="w-full px-2 py-1 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            (student as any).firstName || student.first_name || "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={(student as any).lastName || student.last_name || ""}
                              onChange={(e) => {
                                const updatedStudents = students.map(s => 
                                  s._id === student._id ? {...s, lastName: e.target.value, last_name: e.target.value} : s
                                );
                                setStudents(updatedStudents);
                              }}
                              placeholder="Last name"
                              className="w-full px-2 py-1 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            (student as any).lastName || student.last_name || "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={student.licenseNumber || ""}
                              onChange={(e) => {
                                const updatedStudents = students.map(s => 
                                  s._id === student._id ? {...s, licenseNumber: e.target.value} : s
                                );
                                setStudents(updatedStudents);
                              }}
                              placeholder="License number"
                              className="w-full px-2 py-1 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            student.licenseNumber || "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <input
                            type="date"
                            value={student.completionDate || ""}
                            onChange={(e) => {
                              const updatedStudents = students.map(s => 
                                s._id === student._id ? {...s, completionDate: e.target.value} : s
                              );
                              setStudents(updatedStudents);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <SignatureCanvas
                            onSave={(signatureUrl, applyToAll = false) => {
                              if (applyToAll) {
                                // Apply signature to all students
                                const updatedStudents = students.map(s => ({
                                  ...s,
                                  instructorSignature: signatureUrl
                                }));
                                setStudents(updatedStudents);
                              } else {
                                // Apply signature only to current student
                                const updatedStudents = students.map(s => 
                                  s._id === student._id ? {...s, instructorSignature: signatureUrl} : s
                                );
                                setStudents(updatedStudents);
                              }
                            }}
                            currentSignature={student.instructorSignature}
                            studentName={`${(student as any).firstName || student.first_name} ${(student as any).lastName || student.last_name}`}
                            showApplyToAll={true}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {student.hours ? `${student.hours}` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setEditingStudentId(null)}
                                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Done
                              </button>
                              <button 
                                onClick={cancelEdit}
                                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => toggleEditMode(student._id)}
                              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                    })}
                    {/* Fill empty rows to maintain consistent height */}
                    {Array.from({ length: Math.max(0, studentsPerPage - currentStudents.length) }).map((_, index) => (
                      <tr key={`empty-${index}`} className="h-[52px]">
                        <td colSpan={7} className="px-4 py-3"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
          </div>

          {/* Paginación */}
          {students.length > studentsPerPage && (
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, students.length)} of {students.length} students
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Certificates Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center">
              {/* Icon based on status */}
              {generateStatus === 'saving' && (
                <div className="w-16 h-16 mb-4">
                  <svg className="animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              
              {generateStatus === 'generating' && (
                <div className="w-16 h-16 mb-4">
                  <svg className="animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              
              {generateStatus === 'success' && (
                <div className="w-16 h-16 mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              {generateStatus === 'error' && (
                <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                {generateStatus === 'saving' && 'Saving Certificates'}
                {generateStatus === 'generating' && 'Generating PDFs'}
                {generateStatus === 'success' && 'Success!'}
                {generateStatus === 'error' && 'Error'}
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                {generateMessage}
              </p>

              {/* Close button - only show on success or error */}
              {(generateStatus === 'success' || generateStatus === 'error') && (
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
