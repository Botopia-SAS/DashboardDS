"use client";

import { Combobox } from "@headlessui/react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../custom ui/Loader";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const US_COUNTIES = [
  "Alameda",
  "Alpine",
  "Amador",
  "Butte",
  "Calaveras",
  "Colusa",
  "Contra Costa",
  "Del Norte",
  "El Dorado",
  "Fresno",
  "Glenn",
  "Humboldt",
  "Imperial",
  "Inyo",
  "Kern",
  "Kings",
  "Lake",
  "Lassen",
  "Los Angeles",
  "Madera",
  "Marin",
  "Mariposa",
  "Mendocino",
  "Merced",
  "Modoc",
  "Mono",
  "Monterey",
  "Napa",
  "Nevada",
  "Orange",
  "Placer",
  "Plumas",
  "Riverside",
  "Sacramento",
  "San Benito",
  "San Bernardino",
  "San Diego",
  "San Francisco",
  "San Joaquin",
  "San Luis Obispo",
  "San Mateo",
  "Santa Barbara",
  "Santa Clara",
  "Santa Cruz",
  "Shasta",
  "Sierra",
  "Siskiyou",
  "Solano",
  "Sonoma",
  "Stanislaus",
  "Sutter",
  "Tehama",
  "Trinity",
  "Tulare",
  "Tuolumne",
  "Ventura",
  "Yolo",
  "Yuba",
];

interface Student {
  id: string;
  email: string;
  role: string;
  name: string;
}

export default function NewStudentForm({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState<string | null>(null);
  const [citationNumber, setCitationNumber] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [countryTicket, setCountryTicket] = useState<string | null>("");
  const [licenseNumber, setLicenseNumber] = useState<string>("");
  const [courseCountry, setCourseCountry] = useState<string | null>("");

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
    if (
      !student ||
      !citationNumber ||
      !reason ||
      !countryTicket ||
      !courseCountry
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/ticket/classes/students/${classId}`);
      if (!res.ok) {
        throw new Error("Error fetching class students");
      }

      const data = await res.json();
      const existingStudents = data.map(
        (item: { studentId: string }) => item.studentId
      );

      if (existingStudents.includes(student)) {
        toast.error("Student already exists in this class");
        return;
      }

      const newStudent = {
        studentId: student || "", // Asegurar que studentId tenga un valor válido
        citation_number: citationNumber || "N/A",
        reason: reason || "N/A",
        country_ticket: countryTicket || "N/A",
        license_number: licenseNumber || "N/A",
        course_country: courseCountry || "N/A",
        case_number: citationNumber || "N/A",
        country_course: courseCountry || "N/A",
      };

      if (!newStudent.studentId) {
        toast.error("Student ID is required");
        setSubmitting(false);
        return;
      }

      const updatedStudents = [...data, newStudent];

      const res2 = await fetch(`/api/ticket/classes/${classId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          students: updatedStudents,
        }),
      });

      if (!res2.ok) {
        throw new Error("Error adding student to class");
      }

      toast.success("Student added successfully");

      setStudent(null);
      setCitationNumber("");
      setReason("");
      setCountryTicket("");
      setLicenseNumber("");
      setCourseCountry("");
    } catch (error) {
      console.error("Error in form submission:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error adding student";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
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
          <Select
            name="studentId"
            onValueChange={(value) => {
              setStudent(value);
            }}
          >
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

        <div className="px-4 py-2">
          <Label>Citation Number</Label>
          <input
            type="text"
            value={citationNumber}
            onChange={(e) => setCitationNumber(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>

        <div className="px-4 py-2">
          <Label>Reason</Label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>

        <div className="px-4 py-2">
          <Label>Country Ticket</Label>
          <Combobox value={countryTicket} onChange={setCountryTicket}>
            <Combobox.Input
              className="w-full border rounded px-2 py-1"
              placeholder="Select a county"
              onChange={(event) => setCountryTicket(event.target.value)}
            />
            <Combobox.Options className="absolute z-10 bg-white border rounded shadow-md max-h-60 overflow-y-auto">
              {US_COUNTIES.filter((county) =>
                (countryTicket || "")
                  .toLowerCase()
                  .includes(county.toLowerCase())
              ).map((county) => (
                <Combobox.Option
                  key={county}
                  value={county}
                  className="cursor-pointer hover:bg-gray-100 px-2 py-1"
                >
                  {county}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </Combobox>
        </div>

        <div className="px-4 py-2">
          <Label>License Number</Label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="px-4 py-2">
          <Label>Course Country</Label>
          <Combobox value={courseCountry} onChange={setCourseCountry}>
            <Combobox.Input
              className="w-full border rounded px-2 py-1"
              placeholder="Select a county"
              onChange={(event) => setCourseCountry(event.target.value)}
            />
            <Combobox.Options className="absolute z-10 bg-white border rounded shadow-md max-h-60 overflow-y-auto">
              {US_COUNTIES.filter((county) =>
                (courseCountry || "")
                  .toLowerCase()
                  .includes(county.toLowerCase())
              ).map((county) => (
                <Combobox.Option
                  key={county}
                  value={county}
                  className="cursor-pointer hover:bg-gray-100 px-2 py-1"
                >
                  {county}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </Combobox>
        </div>

        <Button
          type="submit"
          className="bg-blue-500 text-white mx-4"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add student"}
        </Button>
      </form>
    </>
  );
}
