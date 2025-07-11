"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/custom ui/Loader";
import InstructorForm from "@/components/instructors/InstructorForm";
import type { Slot } from "@/components/instructors/types";
import { InstructorData } from "@/types/instructor";

const VALID_STATUSES = ["available", "cancelled", "scheduled"] as const;
function normalizeSlotStatus(status: string | undefined): "available" | "cancelled" | "scheduled" | undefined {
  if (status === "available" || status === "cancelled" || status === "scheduled") return status as any;
  return undefined;
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
            (flatSchedule[0] as { slots?: Array<Slot> }).slots
          ) {
            flatSchedule = (flatSchedule || []).flatMap((entry: { date: string; slots?: Array<Slot> }) =>
              (entry.slots || []).map((slot: Slot) => ({
                date: entry.date,
                start: slot.start,
                end: slot.end,
                booked: slot.booked || false,
                studentId: slot.studentId || null,
                status: (normalizeSlotStatus(slot.status) ?? undefined) as "available" | "cancelled" | "scheduled" | undefined,
              } as Slot))
            );
          } else if (flatSchedule) {
            flatSchedule = flatSchedule.map((slot: Slot) => ({
              ...slot,
              status: (normalizeSlotStatus(slot.status) ?? undefined) as "available" | "cancelled" | "scheduled" | undefined,
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
