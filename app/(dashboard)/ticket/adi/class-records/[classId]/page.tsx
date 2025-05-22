"use client";

import Loader from "@/components/custom ui/Loader";
import { columns, Student } from "@/components/ticket/columns";
import { DataTable } from "@/components/ticket/data-table";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Plus } from "lucide-react";
import Link from "next/link";
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
  const fetchInfo = useCallback(() => {
    setLoading(true);
    fetch(`/api/ticket/classes/students/${classId}`)
      .then((res) => res.json())
      .then((data) => {
        // Agregar el tipo de curso 'adi' a cada estudiante para esta ruta
        const studentsWithType = data.map((student: Student) => ({
          ...student,
          type: "adi",
        }));
        setStudents(studentsWithType);
        setLoading(false);
      });
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
            <Link
              href={`/ticket/adi/class-records/${classId}/new`}
              className="hover:underline flex items-center gap-x-2 bg-blue-500 text-white px-3 py-1 rounded-md"
            >
              <Plus className="size-4" />
              Add new
            </Link>
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
