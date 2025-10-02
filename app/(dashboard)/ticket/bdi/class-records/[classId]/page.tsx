"use client";

import Loader from "@/components/custom ui/Loader";
import { columns, Student } from "@/components/ticket/columns";
import { DataTable } from "@/components/ticket/data-table";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function Page() {
  const params = useParams();
  const classId = params.classId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isMounted = useRef(false);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    try {
      // First, get the ticket class to find the real classId
      const ticketClassResponse = await fetch(`/api/ticket/classes/${classId}`);
      if (!ticketClassResponse.ok) {
        throw new Error('Failed to fetch ticket class');
      }
      
      const ticketClassData = await ticketClassResponse.json();
      const realClassId = ticketClassData.data.classId;
      
      if (!realClassId) {
        throw new Error('No classId found in ticket class');
      }

      // Then, get the driving class information
      const drivingClassResponse = await fetch(`/api/classes/${realClassId}`);
      if (!drivingClassResponse.ok) {
        throw new Error('Failed to fetch driving class');
      }
      
      const drivingClassData = await drivingClassResponse.json();
      
      // Debug log
      console.log('BDI Class data obtained:', {
        title: drivingClassData.data.title,
        classType: drivingClassData.data.classType,
        realClassId
      });
      
      // Finally, get the students
      const studentsResponse = await fetch(`/api/ticket/classes/students/${classId}`);
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const studentsData = await studentsResponse.json();
      
      // Add class information to each student
      const studentsWithClassInfo = studentsData.map((student: Student) => ({
        ...student,
        type: "bdi",
        classTitle: drivingClassData.data.title,
        classType: drivingClassData.data.classType
      }));
      
      setStudents(studentsWithClassInfo);
    } catch (error) {
      console.error('Error fetching BDI data:', error);
      toast.error('Error loading class information');
    } finally {
      setLoading(false);
    }
  }, [classId]);
  useEffect(() => {
    if (!isMounted.current) {
      fetchInfo();
      isMounted.current = true;
    }
  }, [classId, fetchInfo]);

  if (loading) {
    return <Loader />;
  }
  const navigate = () => {
    router.back();
  };

  const onUpdate = async (data: Partial<Student>[]) => {
    for (const student of data) {
      const res = await fetch(`/api/ticket/classes/students/${classId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...student, classId, status: "completed" }),
      });
      if (!res.ok) {
        const { message } = await res.json();
        toast.error(message);
        throw new Error(message);
      }
      toast.success("Updated successfully");
      fetchInfo();
    }
  };
  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Tickets</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={navigate} className="hover:scale-110">
              <ArrowLeftIcon size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <DataTable columns={columns} data={students} onUpdate={onUpdate} />
      </div>
    </>
  );
}
