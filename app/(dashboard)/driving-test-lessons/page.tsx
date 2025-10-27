"use client";
import Calendar from "@/components/driving-test-lessons/Calendar";
import InstructorsRow, { Instructor } from "@/components/driving-test-lessons/InstructorsRow";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loader from "@/components/custom ui/Loader";
import DashboardHeader from "@/components/layout/DashboardHeader";

// Extender la interfaz Instructor para incluir los campos de schedule
interface ExtendedInstructor extends Instructor {
  schedule_driving_test?: Array<{
    date: string;
    time: string;
    status: string;
    studentId?: string;
  }>;
  schedule_driving_lesson?: Array<{
    date: string;
    time: string;
    status: string;
    studentId?: string;
  }>;
}

export default function DrivingTestLessonsPage() {
  const [instructors, setInstructors] = useState<ExtendedInstructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<ExtendedInstructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializingInstructor, setInitializingInstructor] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchInstructors();
  }, []);

  // Efecto para auto-seleccionar instructor aleatorio al cargar
  useEffect(() => {
    if (instructors.length > 0 && !selectedInstructor && !searchParams.get('instructorId')) {
      // Seleccionar un instructor aleatorio
      const randomIndex = Math.floor(Math.random() * instructors.length);
      const randomInstructor = instructors[randomIndex];
      handleInstructorSelect(randomInstructor);
    }
  }, [instructors]);

  // Efecto para auto-seleccionar instructor desde URL params
  useEffect(() => {
    const instructorId = searchParams.get('instructorId');
    const targetDate = searchParams.get('date');
    const targetType = searchParams.get('type');
    const eventId = searchParams.get('eventId');

    if (instructorId && instructors.length > 0) {
      const targetInstructor = instructors.find(inst => inst._id === instructorId);
      if (targetInstructor && !selectedInstructor) {

        if (targetDate) {

        }
        handleInstructorSelect(targetInstructor);
      }
    }
  }, [instructors, searchParams, selectedInstructor]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/instructors");
      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstructorSelect = async (instructor: ExtendedInstructor) => {
    try {
      setInitializingInstructor(true);
      
      // Verificar si el instructor necesita inicializar los arrays de schedule
      const needsInitialization = (
        (instructor.canTeachDrivingTest && !instructor.schedule_driving_test) ||
        (instructor.canTeachDrivingLesson && !instructor.schedule_driving_lesson)
      );
      
      if (needsInitialization) {
        // console.log("Initializing schedule arrays for instructor:", instructor._id);
        
        // Preparar los campos a inicializar
        const updateFields: {
          schedule_driving_test?: Array<{
            date: string;
            time: string;
            status: string;
            studentId?: string;
          }>;
          schedule_driving_lesson?: Array<{
            date: string;
            time: string;
            status: string;
            studentId?: string;
          }>;
        } = {};
        
        if (instructor.canTeachDrivingTest && !instructor.schedule_driving_test) {
          updateFields.schedule_driving_test = [];
        }
        
        if (instructor.canTeachDrivingLesson && !instructor.schedule_driving_lesson) {
          updateFields.schedule_driving_lesson = [];
        }
        
        const response = await fetch(`/api/instructors/${instructor._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instructorId: instructor._id,
            ...updateFields
          })
        });

        if (response.ok) {
          const updatedInstructor = await response.json();
          // console.log("✅ Schedule arrays initialized successfully");
          setSelectedInstructor(updatedInstructor);
        } else {
          console.error("Failed to initialize instructor schedules");
          // Still set the instructor even if initialization fails
          setSelectedInstructor(instructor);
        }
      } else {
        // console.log("✅ Instructor already has required schedule arrays");
        setSelectedInstructor(instructor);
      }
      
    } catch (error) {
      console.error("Error selecting instructor:", error);
      setSelectedInstructor(instructor);
    } finally {
      setInitializingInstructor(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 md:p-10 bg-white min-h-screen">
      <DashboardHeader title="Driving Test / Lessons">
        <button
          onClick={() => window.location.href = '/driving-test-lessons/certificates'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
          Certificates Driving Lesson
        </button>
      </DashboardHeader>
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
        <InstructorsRow 
          instructors={instructors} 
          onInstructorSelect={handleInstructorSelect}
          selectedInstructor={selectedInstructor}
        />
        
        {initializingInstructor && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              Initializing instructor schedule...
            </div>
          </div>
        )}

        {!selectedInstructor && !initializingInstructor && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-300">
              <div className="text-gray-500 text-lg font-medium mb-2">
                Select an instructor to configure their schedule
              </div>
              <div className="text-gray-400 text-sm">
                Choose an instructor from the list above to view and manage their driving test and lesson schedules
              </div>
            </div>
          </div>
        )}

        {selectedInstructor && !initializingInstructor && (
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Schedule for {selectedInstructor.name}
              </h2>
              <p className="text-sm text-gray-600">
                {selectedInstructor.email}
              </p>
            </div>
            <Calendar
              selectedInstructor={selectedInstructor}
              targetDate={searchParams.get('date')}
              targetType={searchParams.get('type')}
              targetEventId={searchParams.get('eventId')}
            />
        </div>
        )}
      </div>
    </div>
  );
} 