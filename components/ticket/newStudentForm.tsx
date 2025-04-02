"use client";

import useClassStore from "@/app/store/classStore";
import { SelectContent } from "@radix-ui/react-select";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../custom ui/Loader";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Student {
  id: string;
  email: string;
  role: string;
  name: string;
}

export default function NewStudentForm() {
  const { classId } = useClassStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    fetch(`/api/customers`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
      });
    setLoading(false);
  }, []);

  const sendForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) {
      alert("Please select a student");
      return;
    }

    const res = await fetch(`/api/ticket/classes/date/students/${classId}`);

    if (!res.ok) {
      alert("Error adding student");
      return;
    }
    const data = await res.json();
    const students = [];
    for (const item of data) {
      students.push(item.id);
    }
    if (students.includes(student)) {
      toast.error("Student already exists in this class");
      return;
    }
    students.push(student);
    const res2 = await fetch(`/api/ticket/classes/${classId}`, {
      method: "PATCH",
      body: JSON.stringify({
        students,
      }),
    });
    fetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        user_id: student,
        classId,
        status: "pending",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res2.ok) {
      alert("Error adding student");
      return;
    }

    toast.success("Student added successfully");
  };

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <form className="space-y-4 p-4 rounded-lg shadow-md" onSubmit={sendForm}>
        <div className="px-4 py-2">
          <Label>Student</Label>
          <Select name="studentId" onValueChange={(value) => setStudent(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {students.map((student) => (
                <SelectItem
                  key={student.id}
                  value={student.id}
                  className="hover:bg-gray-100 cursor-pointer w-full"
                >
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-blue-500 text-white mx-4">Add student</Button>
      </form>
    </>
  );
}
