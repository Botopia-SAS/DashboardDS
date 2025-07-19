"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";
import InstructorForm from "@/components/instructors/InstructorForm";
import { InstructorData } from "@/components/instructors/types";

const InstructorDetails = ({
  params,
}: {
  params: Promise<{ instructorId?: string }>;
}) => {
  const [loading, setLoading] = useState(true);
  const [instructorDetails, setInstructorDetails] =
    useState<InstructorData | null>(null);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params; // Espera a que params se resuelva
      setInstructorId(resolvedParams?.instructorId ?? null);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    const fetchInstructorDetails = async () => {
      if (!instructorId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/instructors?instructorId=${instructorId}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();

        // 📌 Filtrar el instructor correcto
        const selectedInstructor = data.find(
          (inst: InstructorData) => inst._id === instructorId
        );

        if (!selectedInstructor) {
          setInstructorDetails(null);
        } else {
          setInstructorDetails(selectedInstructor);
        }
      } catch (err) {
        console.error("Error occurred:", err);
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) fetchInstructorDetails();
  }, [instructorId]);

  if (loading) return <Loader />;
  if (!instructorDetails)
    return <p className="text-center text-red-500">Instructor not found</p>;

  return <InstructorForm initialData={instructorDetails} />;
};

export default InstructorDetails;
