/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
} from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "../ui/separator";

import { v4 as uuidv4 } from "uuid";
import EditRecurringModal from "./EditRecurringModal";
import InstructorBasicInfo from "./InstructorBasicInfo";
import InstructorSchedule from "./InstructorSchedule";
import ScheduleModal from "./ScheduleModal";
import { CalendarEvent, InstructorData, Slot, SlotType, User } from "./types";
import {
  generateRecurringSlots,
  getStudentName,
  normalizeSchedule,
  splitIntoHalfHourSlots
} from "./utils";

interface InstructorFormData {
  name: string;
  dni: string;
  email: string;
  password: string;
  photo: string | string[];
  certifications?: string;
  experience?: string;
  schedule?: Slot[];
}

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  dni: z.string().min(2, "DNI is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  photo: z.union([z.string().url("Valid photo URL required"), z.array(z.string())]),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  schedule: z
    .array(
      z.object({
        date: z.string(),
        start: z.string(),
        end: z.string(),
        booked: z.boolean().optional(),
        studentId: z.string().nullable().optional(),
        status: z.string().optional(),
      })
    )
    .optional(),
}).refine(() => {
  // Solo requerir password si no hay initialData (creación)
  // El valor de initialData no está aquí, así que la validación real se hace en el submit
  return true;
}, {
  message: "Password is required",
  path: ["password"],
});

// Componente principal que maneja el estado global y renderiza los subcomponentes
const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
  const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
  const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<Slot[]>(() =>
    normalizeSchedule(initialData?.schedule || [])
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<{
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    recurrenceEnd?: string | null;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    editAll?: boolean;
    sessionType?: string;
    sessionId?: string;
    slotId?: string;
    studentId?: string;
    status?: "free" | "cancelled" | "scheduled";
  }>({
    start: "",
    end: "",
    booked: false,
    recurrence: "None",
    status: undefined,
    recurrenceEnd: null,
    isEditing: false,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAll, setEditAll] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [slotType, setSlotType] = useState<SlotType>("");

  // Derivo calendarEvents directamente de schedule
  const calendarEvents = schedule.map((slot: Slot) => ({
    title:
      slot.status === "scheduled" && slot.studentId
        ? `Booked: ${getStudentName(slot.studentId, allUsers)}`
        : slot.status === "cancelled"
        ? "Cancelled"
        : slot.status === "free"
        ? "Free"
        : slot.booked
        ? "Booked"
        : "Available",
    start: `${slot.date}T${slot.start}`,
    end: `${slot.date}T${slot.end}`,
    backgroundColor:
      slot.status === "scheduled"
        ? "blue"
        : slot.status === "cancelled"
        ? "red"
        : slot.status === "free"
        ? "gray"
        : slot.booked
        ? "blue"
        : "green",
    borderColor:
      slot.status === "scheduled"
        ? "darkblue"
        : slot.status === "cancelled"
        ? "darkred"
        : slot.status === "free"
        ? "darkgray"
        : slot.booked
        ? "darkblue"
        : "darkgreen",
    textColor: "white",
    extendedProps: {
      recurrence: slot.recurrence || "None",
      booked: slot.booked ?? false,
      studentId: slot.studentId || null,
    },
  }));

  // Genera una contraseña aleatoria
  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
  };

  // 📌 Abrir Modal con los datos del horario seleccionado
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;

    setCurrentSlot({ start, end, booked: false, recurrence: "None" });
    setIsModalOpen(true);
  };

  const handleDeleteSlot = () => {
    if (!currentSlot) return;
    const date = currentSlot.start.split("T")[0];
    const startTime = currentSlot.start.split("T")[1];
    const endTime = currentSlot.end.split("T")[1];

    setSchedule((prevSchedule: Slot[]) =>
      prevSchedule.filter((slot: Slot) => {
        if (slot.date !== date) return true;
        // Elimina si el slot está dentro del rango seleccionado
        return slot.start < startTime || slot.end > endTime;
      })
    );
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    toast.success("Slots deleted!");
  };

  // Auxiliar para status seguro
  function getSlotStatus(
    slotType: SlotType
  ): "free" | "cancelled" | "scheduled" {
    if (slotType === "booked") return "scheduled";
    if (slotType === "cancelled") return "cancelled";
    return "free";
  }

  const handleUpdateSlot = () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    const date = currentSlot.start.split("T")[0];
    const startTime = currentSlot.start.split("T")[1];
    const endTime = currentSlot.end.split("T")[1];

    // Elimina el slot anterior
    const filteredSchedule = schedule.filter((slot) => {
      if (slot.date !== date) return true;
      return slot.start < startTime || slot.end > endTime;
    });

    // Crea el nuevo slot con la configuración actual del modal
    const newSlot: Slot = {
      date,
      start: startTime,
      end: endTime,
      booked: slotType === "booked",
      studentId: slotType === "booked" ? selectedStudent : null,
      status: getSlotStatus(slotType),
      recurrence: currentSlot.recurrence,
      slotId: currentSlot.slotId, // o usa uuidv4() si quieres uno nuevo
    };

    setSchedule([...filteredSchedule, newSlot]);
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    toast.success(
      "Slot updated! Recuerda presionar 'Save Changes' para guardar en la base de datos."
    );
  };

  const handleSaveSlot = () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    if (!slotType) {
      toast.error("Please select a slot type.");
      return;
    }
    if (slotType === "booked" && !selectedStudent) {
      toast.error("Please select a student for a booked slot.");
      return;
    }

    let booked = slotType === "booked" || slotType === "cancelled";
    const status = slotType === "booked" ? "scheduled" : slotType;
    const studentId = slotType === "booked" ? selectedStudent : null;
    if (slotType === "free") booked = false;

    let newSlots: Slot[] = [];
    if (currentSlot.recurrence && currentSlot.recurrence !== "None") {
      let count = 1;
      if (recurrenceEnd) {
        const startDate = new Date(currentSlot.start);
        const endDate = new Date(recurrenceEnd);
        if (currentSlot.recurrence === "Daily") {
          count = differenceInDays(endDate, startDate) + 1;
        } else if (currentSlot.recurrence === "Weekly") {
          count = differenceInWeeks(endDate, startDate) + 1;
        } else if (currentSlot.recurrence === "Monthly") {
          count = differenceInMonths(endDate, startDate) + 1;
        }
        if (count < 1) count = 1;
      } else {
        count =
          currentSlot.recurrence === "Daily"
            ? 7
            : currentSlot.recurrence === "Weekly"
            ? 4
            : 3;
      }
      // Always use currentSlot.start and currentSlot.end as the base for recurrence
      const generated = generateRecurringSlots(
        currentSlot.start,
        currentSlot.end,
        currentSlot.recurrence as "Daily" | "Weekly" | "Monthly",
        count,
        {
          booked,
          studentId,
          status,
        }
      );
      //console.log("Slots generados por recurrencia:", generated);
      // Divide cada slot generado en bloques de 30 minutos
      newSlots = generated.flatMap(slot => {
        const blocks = splitIntoHalfHourSlots(
          `${slot.date}T${slot.start}`,
          `${slot.date}T${slot.end}`,
          {
            booked,
            studentId,
            status,
          }
        );
        //console.log("Bloques de 30 min para", slot, "=>", blocks);
        return blocks.map(s => ({
          date: slot.date, // Usa la fecha del slot recurrente original
          start: s.start,
          end: s.end,
          status: s.status,
          booked: s.booked,
          studentId: s.studentId,
        }));
      });
      // Only add slots that do not already exist
      newSlots = newSlots.filter(
        (slot) =>
          !schedule.some(
            (s) =>
              s.date === slot.date &&
              s.start === slot.start &&
              s.end === slot.end
          )
      );
    } else {
      newSlots = splitIntoHalfHourSlots(currentSlot.start, currentSlot.end, {
        booked,
        studentId,
        status,
      }).map(slot => ({
        date: slot.date,
        start: slot.start,
        end: slot.end,
        status: slot.status,
        booked: slot.booked,
        studentId: slot.studentId,
      }));
    }

    for (const slot of newSlots) {
      if (
        schedule.some(
          (s: Slot) =>
            s.date === slot.date && s.start === slot.start && s.end === slot.end
        )
      ) {
        toast.error("Slot already exists for that time.");
        return;
      }
    }
    setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...newSlots]);
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    setSlotType("");
    toast.success("Slots saved!");
  };

  const handleEventClick = async (eventInfo: EventClickArg) => {
    const { start, end } = eventInfo.event;

    if (!start || !end) {
      return;
    }

    const formattedStart =
      start.toISOString().split("T")[0] +
      "T" +
      start.toTimeString().slice(0, 5);
    const formattedEnd =
      end.toISOString().split("T")[0] + "T" + end.toTimeString().slice(0, 5);

    // Busca el slot real en el schedule para obtener el status real
    const realSlot = schedule.find(
      (s: Slot) =>
        s.date === formattedStart.split("T")[0] &&
        s.start === formattedStart.split("T")[1] &&
        s.end === formattedEnd.split("T")[1]
    );

    setCurrentSlot({
      start: formattedStart,
      end: formattedEnd,
      booked: realSlot?.booked || false,
      recurrence: realSlot?.recurrence || "None",
      isEditing: true,
      originalStart: formattedStart,
      originalEnd: formattedEnd,
      slotId: realSlot?.slotId || uuidv4(),
      studentId: realSlot?.studentId || "",
      status: realSlot?.status,
    });

    // Si es booked, consulta la base de datos de users para mostrar el estudiante
    if (realSlot?.status === "scheduled" && realSlot?.studentId) {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        //console.log("Usuarios traídos de la API:", users);
        const filtered = users
          .filter((u: User) => u.role?.toLowerCase() === "user")
          .map((u: User) => ({
            ...u,
            name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          }));
        setAllUsers(filtered);
        setSelectedStudent(realSlot.studentId);
      } catch {
        setSelectedStudent("");
      }
    } else {
      setSelectedStudent("");
    }

    setIsModalOpen(true);
  };

  const form = useForm<InstructorFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      dni: initialData?.dni || "",
      email: initialData?.email || "",
      password: "",
      photo: initialData?.photo || "",
      certifications: initialData?.certifications || "",
      experience: initialData?.experience || "",
      schedule: initialData?.schedule || [],
    },
  });

  // Manejo del submit
  const onSubmit = async (values: InstructorFormData) => {
    if (!initialData && !values.password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);

    // Asegura que photo sea string
    const photoString = Array.isArray(values.photo)
      ? values.photo[0] || ""
      : values.photo || "";

    const bodyToSend: Record<string, unknown> = {
      instructorId: initialData?._id ?? "",
      ...values,
      photo: photoString,
      schedule: schedule.map((slot: Slot) => ({
        date: slot.date,
        start: slot.start,
        end: slot.end,
        status: slot.status,
        booked: slot.booked,
        studentId: slot.studentId || null,
      })),
    };

    if (initialData && !bodyToSend.password) {
      delete bodyToSend.password;
    }

    try {
      const res = await fetch(`/api/instructors`, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json();
      //console.log("Respuesta del backend:", res.status, data);

      if (res.ok) {
        toast.success("Instructor saved successfully!");
        window.location.href = "/instructors";
      } else {
        toast.error(data.message || "Error saving instructor.");
      }
    } catch (error) {
      console.error("❌ Server error:", error);
      toast.error("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <p className="text-heading2-bold">
        {initialData ? "Edit Instructor" : "Create Instructor"}
      </p>
      <Separator className="bg-grey-1 mt-4 mb-7" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <InstructorBasicInfo
            form={form}
            generatePassword={generatePassword}
          />

          <InstructorSchedule
            calendarEvents={calendarEvents}
            handleDateSelect={handleDateSelect}
            handleEventClick={handleEventClick}
          />

          <ScheduleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            currentSlot={currentSlot}
            setCurrentSlot={setCurrentSlot}
            handleSaveSlot={handleSaveSlot}
            handleUpdateSlot={handleUpdateSlot}
            handleDeleteSlot={handleDeleteSlot}
            recurrenceOptions={recurrenceOptions}
            recurrenceEnd={recurrenceEnd}
            setRecurrenceEnd={setRecurrenceEnd}
            slotType={slotType}
            setSlotType={setSlotType}
            allUsers={allUsers}
            selectedStudent={selectedStudent}
            setSelectedStudent={setSelectedStudent}
          />

          <EditRecurringModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            setIsModalOpen={setIsModalOpen}
            setEditAll={setEditAll}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white"
            >
              {initialData ? "Save Changes" : "Create Instructor"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/instructors")}
            >
              Discard
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InstructorForm;
