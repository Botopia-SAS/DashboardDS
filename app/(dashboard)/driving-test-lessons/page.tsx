"use client";
import Calendar from "@/components/driving-test-lessons/Calendar";
import InstructorsRow, { Instructor } from "@/components/driving-test-lessons/InstructorsRow";
import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const [showNotif, setShowNotif] = useState(false);
  const [pendingClasses, setPendingClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (!selectedInstructor) {
      setPendingClasses([]);
      return;
    }
    // Unificar clases pendientes de ambos tipos
    const pending: any[] = [];
    if (selectedInstructor.schedule_driving_test) {
      selectedInstructor.schedule_driving_test.forEach((c: any) => {
        if (c.status === "pending") {
          pending.push({ ...c, classType: "driving test" });
        }
      });
    }
    if (selectedInstructor.schedule_driving_lesson) {
      selectedInstructor.schedule_driving_lesson.forEach((c: any) => {
        if (c.status === "pending") {
          pending.push({ ...c, classType: "driving lesson" });
        }
      });
    }
    setPendingClasses(pending);
  }, [selectedInstructor]);

  const handleAccept = async (classItem: any) => {
    try {
      // Solo actualizar el status, mantener el resto de los datos
      setPendingClasses((prev) => prev.filter((c) => c !== classItem));
      await fetch("/api/driving-test-lessons/update-event", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...classItem,
          eventId: classItem._id,
          instructorId: selectedInstructor?._id,
          status: "booked",
        }),
      });
      fetchInstructors();
    } catch (err) {
      alert("Error accepting class");
    }
  };

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
    <div className="p-6 md:p-10 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md mb-8">
        <h1 className="text-xl font-semibold">Driving Test / Lessons</h1>
        <div className="relative">
          <button onClick={() => setShowNotif((v) => !v)} className="relative">
            <Bell className="w-6 h-6" />
            {pendingClasses.length > 0 && (
              <span className="absolute -top-2 -right-3 flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-white shadow">{pendingClasses.length}</span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-96 bg-white text-gray-900 rounded-lg shadow-lg z-50 p-4">
              <h3 className="font-bold mb-2">Pending Classes</h3>
              {pendingClasses.length === 0 ? (
                <p className="text-gray-500">No pending classes</p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {pendingClasses.map((c, idx) => (
                    <li key={idx} className="border-b pb-2 flex flex-col gap-1">
                      <span className="font-medium">{c.classType === "driving test" ? "🚗 Driving Test" : "📘 Driving Lesson"}</span>
                      <span className="text-sm">Student: <b>{c.studentName || c.studentId || "-"}</b></span>
                      <span className="text-xs text-gray-500">Date: {c.date} {c.time ? `- ${c.time}` : ""}</span>
                      <Button size="sm" className="mt-1 w-fit" onClick={() => handleAccept(c)}>Accept</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
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