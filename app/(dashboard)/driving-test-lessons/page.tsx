"use client";
import Calendar from "@/components/driving-test-lessons/Calendar";
import InstructorsRow, { Instructor } from "@/components/driving-test-lessons/InstructorsRow";
import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";

export default function DrivingTestLessonsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializingInstructor, setInitializingInstructor] = useState(false);

  useEffect(() => {
    fetchInstructors();
  }, []);

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

  const handleInstructorSelect = async (instructor: Instructor) => {
    try {
      setInitializingInstructor(true);
      
      // Check if instructor has schedule arrays, if not, initialize them
      if (!instructor.schedule_driving_test || !instructor.schedule_driving_lesson) {
        //console.log("Initializing schedule arrays for instructor:", instructor._id);
        
        const response = await fetch(`/api/instructors/${instructor._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schedule_driving_test: instructor.schedule_driving_test || [],
            schedule_driving_lesson: instructor.schedule_driving_lesson || []
          })
        });

        if (response.ok) {
          const updatedInstructor = await response.json();
          setSelectedInstructor(updatedInstructor);
        } else {
          console.error("Failed to initialize instructor schedules");
          // Still set the instructor even if initialization fails
          setSelectedInstructor(instructor);
        }
      } else {
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
    <div className="p-6 md:p-10 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md mb-8">
        <h1 className="text-xl font-semibold">Driving Test / Lessons</h1>
      </div>
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
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
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
            <Calendar selectedInstructor={selectedInstructor} />
        </div>
        )}
      </div>
    </div>
  );
} 