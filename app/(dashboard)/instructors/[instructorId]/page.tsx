"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";
import InstructorForm from "@/components/instructors/InstructorForm";
import type { Slot } from "@/components/instructors/types";
import { InstructorData } from "@/types/instructor";

const VALID_STATUSES = ["free", "cancelled", "scheduled"] as const;
function normalizeSlotStatus(status: any): "free" | "cancelled" | "scheduled" | undefined {
  return VALID_STATUSES.includes(status) ? status : undefined;
}

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
          let flatSchedule = selectedInstructor.schedule;
          if (
            flatSchedule &&
            flatSchedule.length > 0 &&
            (flatSchedule[0] as any).slots
          ) {
            flatSchedule = (flatSchedule || []).flatMap((entry: any) =>
              (entry.slots || []).map((slot: any) => ({
                date: entry.date,
                start: slot.start,
                end: slot.end,
                booked: slot.booked || false,
                studentId: slot.studentId || null,
                status: (normalizeSlotStatus(slot.status) ?? undefined) as "free" | "cancelled" | "scheduled" | undefined,
              } as Slot))
            );
          } else if (flatSchedule) {
            flatSchedule = flatSchedule.map((slot: any) => ({
              ...slot,
              status: (normalizeSlotStatus(slot.status) ?? undefined) as "free" | "cancelled" | "scheduled" | undefined,
            } as Slot));
          }
          setInstructorDetails({ ...selectedInstructor, schedule: flatSchedule });
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
