"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import { DateSelectArg } from "@fullcalendar/core";
import { EventClickArg } from "@fullcalendar/core";

import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import ImageUpload from "../custom ui/ImageUpload";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { v4 as uuidv4 } from "uuid";
//import bcrypt from "bcryptjs"; Si no se usa eliminarlo
// import { useRef } from "react";  Si no se usa eliminarlo

type CalendarEvent = {
  id?: string; // Opcional si no se usa en FullCalendar
  title: string;
  start: string; // Puede ser Date si FullCalendar lo requiere
  end?: string; // Opcional porque algunos eventos pueden no tener fin
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    recurrence: string;
    booked: boolean;
  };
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(4, "Username must be at least 4 characters"), // ✅ Nombre de usuario obligatorio
  email: z.string().email("Invalid email format"), // ✅ Nuevo campo de email
  password: z.string().min(8, "Password must be at least 8 characters"), // ✅ Contraseña obligatoria
  photo: z.string().url("Valid photo URL required"),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  schedule: z
    .array(
      z.object({
        date: z.string(),
        slots: z.array(
          z
            .object({
              start: z.string(),
              end: z.string(),
              booked: z.boolean().optional(), // ✅ Nuevo campo
            })
            .refine((slot) => slot.start < slot.end, {
              message: "Start time must be before end time.",
            })
        ),
      })
    )
    .optional(),
});

interface InstructorData {
  _id?: string; // Agregar el identificador opcionalmente
  name?: string;
  username?: string;
  email?: string; // ✅ Nuevo campo de email
  password?: string;
  photo?: string;
  certifications?: string;
  experience?: string;
  schedule?: {
    date: string;
    slots: {
      start: string;
      end: string;
      booked?: boolean; // ✅ Nuevo campo
    }[];
    recurrenceEnd?: string | null; // Add this line
  }[];
}

const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
  const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
  const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<
    {
      date: string;
      slots: {
        start: string;
        end: string;
        booked: boolean;
        recurrence: string;
        recurrenceEnd?: string | null; // 🆕 Agregar aquí también
        sessionType?: string;
        sessionId?: string;
        slotId?: string; // Add slotId property
      }[];
    }[]
  >([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarKey, setCalendarKey] = useState(0); // 🔹 Clave única para forzar re-render
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<{
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    recurrenceEnd?: string | null; // 🆕 Agregado para manejar la duración de la recurrencia
    isEditing?: boolean; // 🔹 Agregamos esta propiedad opcional
    originalStart?: string; // 🔹 Agregado
    originalEnd?: string; // 🔹 Agregado
    editAll?: boolean; // 🆕 Agregado para editar todas las instancias
    sessionType?: string; // 🆕 Tipo de reserva (Clase, Sesión, etc.)
    sessionId?: string; // 🆕 ID de la sesión
    slotId?: string; // Add slotId property
  }>({
    start: "",
    end: "",
    booked: false,
    recurrence: "None",
    recurrenceEnd: null, // Valor inicial
    isEditing: false, // Inicialmente, asumimos que no estamos editando
  });
  const [copiedSlot, setCopiedSlot] = useState<{
    duration: number;
    booked: boolean;
    recurrence: string;
  } | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editAll, setEditAll] = useState(false);

  useEffect(() => {
    if (schedule.length === 0) return; // Evita actualizaciones innecesarias

    const newEvents = schedule.flatMap((day) =>
      day.slots.map((slot) => ({
        title: slot.booked ? "Booked" : "Available",
        start: slot.start,
        end: slot.end,
        backgroundColor: slot.booked ? "blue" : "green",
        borderColor: slot.booked ? "darkblue" : "darkgreen",
        textColor: "white",
        extendedProps: { recurrence: slot.recurrence, booked: slot.booked },
      }))
    );

    console.log("📆 Actualizando eventos en FullCalendar:", newEvents);
    setCalendarEvents(newEvents);

    // 🔹 FORZAMOS el re-render solo cuando `schedule` cambie
    setCalendarKey((prevKey) => prevKey + 1);
  }, [schedule]); // Se ejecuta cada vez que schedule cambia

  useEffect(() => {
    console.log("🔄 Reiniciando FullCalendar");
    setCalendarKey((prevKey) => prevKey + 1);
  }, [schedule]);

  useEffect(() => {
    const events = schedule.flatMap((day) =>
      day.slots.map((slot) => ({
        title: slot.booked ? "Booked" : "Available",
        start: slot.start,
        end: slot.end,
        backgroundColor: slot.booked ? "blue" : "green",
        borderColor: slot.booked ? "darkblue" : "darkgreen",
        textColor: "white",
        extendedProps: { recurrence: slot.recurrence, booked: slot.booked },
      }))
    );

    console.log(
      "📆 Eventos de FullCalendar actualizados:",
      JSON.stringify(events, null, 2)
    );
  }, [schedule]);

  useEffect(() => {
    if (schedule.length === 0) return; // ✅ Evita actualizar si el estado está vacío

    console.log("📆 Schedule actualizado, recalculando eventos...");

    const newEvents = schedule.flatMap((day) =>
      day.slots.map((slot) => ({
        title: slot.booked ? "Booked" : "Available",
        start: slot.start,
        end: slot.end,
        backgroundColor: slot.booked ? "blue" : "green",
        borderColor: slot.booked ? "darkblue" : "darkgreen",
        textColor: "white",
        extendedProps: { recurrence: slot.recurrence, booked: slot.booked },
      }))
    );

    setCalendarEvents(newEvents);

    setTimeout(() => {
      setCalendarKey((prevKey) => prevKey + 1);
    }, 50);

    return undefined; // ✅ Se asegura que no devuelva JSX ni nada inesperado
  }, [schedule]);

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
    const date = start.split("T")[0];

    console.log("📌 handleDateSelect ejecutado con datos:", {
      start,
      end,
      date,
    });

    // 📌 Asignar `currentSlot` antes de abrir el modal
    setCurrentSlot({ start, end, booked: false, recurrence: "None" });

    setIsModalOpen(true);
  };

  const handleDeleteSlot = (deleteAll: boolean) => {
    console.log("❌ handleDeleteSlot ejecutado con deleteAll =", deleteAll);
    console.log("📌 currentSlot antes de eliminar:", currentSlot);

    if (!currentSlot || !currentSlot.slotId) {
      toast.error("No slot selected for deletion.");
      return;
    }

    setSchedule((prevSchedule) => {
      const updatedSchedule = prevSchedule
        .map((day) => ({
          ...day,
          slots: day.slots.filter((slot) => {
            const slotDate = new Date(slot.start).toISOString().split("T")[0];
            const currentSlotDate = new Date(currentSlot.start)
              .toISOString()
              .split("T")[0];

            if (deleteAll) {
              return !(
                new Date(slotDate) >= new Date(currentSlotDate) &&
                normalizeTime(slot.start) ===
                  normalizeTime(currentSlot.start) &&
                normalizeTime(slot.end) === normalizeTime(currentSlot.end) &&
                slot.recurrence === currentSlot.recurrence
              );
            }

            return !(
              normalizeTime(slot.start) === normalizeTime(currentSlot.start) &&
              normalizeTime(slot.end) === normalizeTime(currentSlot.end) &&
              slotDate === currentSlotDate
            );
          }),
        }))
        .filter((day) => day.slots.length > 0);

      console.log("✅ Nuevo schedule después de eliminar:", updatedSchedule);
      return updatedSchedule;
    });

    setDeleteModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });

    toast.success(deleteAll ? "All future events deleted!" : "Slot deleted!");
  };

  const normalizeTime = (dateString: string) => {
    return dateString.includes("-") ? dateString.split("-")[0] : dateString;
  };

  const handleUpdateSlot = () => {
    console.log("📝 handleUpdateSlot ejecutado");

    if (
      !currentSlot ||
      !currentSlot.originalStart ||
      !currentSlot.originalEnd
    ) {
      console.error("❌ No hay currentSlot definido.");
      return;
    }

    setSchedule((prevSchedule) => {
      return prevSchedule.map((day) => {
        return {
          ...day,
          slots: day.slots.map((slot) => {
            const slotDate = slot.start.split("T")[0];
            const currentSlotDate = currentSlot.originalStart
              ? currentSlot.originalStart.split("T")[0]
              : "";

            if (
              normalizeTime(slot.start) ===
                normalizeTime(currentSlot.originalStart || "") &&
              normalizeTime(slot.end) ===
                normalizeTime(currentSlot.originalEnd || "") &&
              slot.recurrence === currentSlot.recurrence &&
              (editAll || slotDate === currentSlotDate) // 🔹 Editar solo uno o todos
            ) {
              return {
                ...slot,
                start:
                  slot.start.split("T")[0] +
                  "T" +
                  currentSlot.start.split("T")[1],
                end:
                  slot.end.split("T")[0] + "T" + currentSlot.end.split("T")[1],
                booked: currentSlot.booked,
                recurrence: currentSlot.recurrence,
                slotId: slot.slotId || uuidv4(), // 🔥 Mantener slotId original o generar uno si no existe
              };
            }
            return slot;
          }),
        };
      });
    });

    setIsModalOpen(false);
    setEditModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });

    toast.success(editAll ? "All slots updated!" : "Slot updated!");
  };

  const handleSaveSlot = () => {
    console.log("🚀 handleSaveSlot ejecutado");

    if (!currentSlot) {
      console.error("❌ No hay currentSlot definido.");
      return;
    }

    const slotDate = currentSlot.start.split("T")[0];

    setSchedule((prevSchedule) => {
      const existingDayIndex = prevSchedule.findIndex(
        (day) => day.date === slotDate
      );
      let updatedSchedule;

      // 📌 Agregar slotId al nuevo slot
      const newSlot = {
        ...currentSlot,
        slotId:
          currentSlot.slotId && currentSlot.slotId.trim() !== ""
            ? currentSlot.slotId
            : uuidv4(),
        recurrenceEnd,
      };

      console.log("📌 Guardando slot con slotId:", newSlot.slotId);

      if (existingDayIndex !== -1) {
        updatedSchedule = [...prevSchedule];
        updatedSchedule[existingDayIndex] = {
          ...updatedSchedule[existingDayIndex],
          slots: [...updatedSchedule[existingDayIndex].slots, newSlot],
        };
      } else {
        updatedSchedule = [
          ...prevSchedule,
          { date: slotDate, slots: [newSlot] },
        ];
      }

      // 📌 Agregar eventos recurrentes SOLO hasta la fecha de finalización
      if (currentSlot.recurrence !== "None") {
        console.log(
          `🔁 Generando eventos recurrentes hasta ${recurrenceEnd}...`
        );

        let newDate = new Date(slotDate);
        let recurrenceCount = 0;
        const maxRecurrences = 400;

        while (
          recurrenceEnd === null ||
          newDate.toISOString().split("T")[0] <= recurrenceEnd
        ) {
          if (recurrenceCount >= maxRecurrences) break; // 🔹 Seguridad para evitar loops infinitos

          newDate = new Date(newDate);
          if (currentSlot.recurrence === "Daily")
            newDate.setDate(newDate.getDate() + 1);
          if (currentSlot.recurrence === "Weekly")
            newDate.setDate(newDate.getDate() + 7);
          if (currentSlot.recurrence === "Monthly")
            newDate.setMonth(newDate.getMonth() + 1);

          const newDateString = newDate.toISOString().split("T")[0];

          if (recurrenceEnd !== null && newDateString > recurrenceEnd) break; // 🔹 Seguridad adicional

          const existingRecurringDayIndex = updatedSchedule.findIndex(
            (day) => day.date === newDateString
          );

          // 📌 Clonar el slot con un nuevo ID para cada recurrencia
          const recurringSlot = {
            ...currentSlot,
            start: `${newDateString}T${currentSlot.start.split("T")[1]}`,
            end: `${newDateString}T${currentSlot.end.split("T")[1]}`,
            slotId: uuidv4(), // 🔹 Genera un nuevo slotId para cada recurrencia
          };

          if (existingRecurringDayIndex !== -1) {
            updatedSchedule[existingRecurringDayIndex].slots.push(
              recurringSlot
            );
          } else {
            updatedSchedule.push({
              date: newDateString,
              slots: [recurringSlot],
            });
          }

          recurrenceCount++;
        }
      }

      console.log("✅ Nuevo schedule con slotId agregado:", updatedSchedule);
      return updatedSchedule;
    });

    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    toast.success("Schedule saved!");
  };

  const handleEventClick = (eventInfo: EventClickArg) => {
    const { start, end, extendedProps } = eventInfo.event;

    // Verificar si start o end son null antes de usarlos
    if (!start || !end) {
      console.error("❌ Evento sin fechas válidas:", eventInfo.event);
      return;
    }

    const formattedStart =
      start.toISOString().split("T")[0] +
      "T" +
      start.toTimeString().slice(0, 5);
    const formattedEnd =
      end.toISOString().split("T")[0] + "T" + end.toTimeString().slice(0, 5);

    console.log("🖊️ Editando slot con recurrencia:", extendedProps?.recurrence);

    setCurrentSlot({
      start: formattedStart,
      end: formattedEnd,
      booked: extendedProps?.booked || false,
      recurrence: extendedProps?.recurrence || "None",
      isEditing: true,
      originalStart: formattedStart,
      originalEnd: formattedEnd,
      slotId:
        extendedProps?.slotId && extendedProps?.slotId.trim() !== ""
          ? extendedProps?.slotId
          : uuidv4(), // 📌 Asegurar slotId
    });

    if (extendedProps?.recurrence !== "None") {
      setEditModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      username: initialData?.username || "",
      email: initialData?.email || "",
      password: "",
      photo: initialData?.photo || "",
      certifications: initialData?.certifications || "",
      experience: initialData?.experience || "",
      schedule: initialData?.schedule || [],
    },
  });

  // Manejo del submit
  const onSubmit = async (values: InstructorData) => {
    console.log("✅ Enviando al servidor los siguientes valores:", values);
    console.log("📅 Schedule antes de enviar:", schedule);

    setLoading(true);

    try {
      const res = await fetch(`/api/instructors`, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: initialData?._id ?? "",
          ...values,
          schedule: schedule.map((day) => ({
            date: day.date,
            slots: day.slots.map((slot) => ({
              start: slot.start,
              end: slot.end,
              booked: slot.booked || false,
              recurrence: slot.recurrence,
            })),
          })),
        }),
      });

      console.log("🛜 Respuesta del servidor:", res);

      if (res.ok) {
        toast.success("Instructor saved successfully!");
        router.push("/instructors");
      } else {
        const errorText = await res.text();
        console.error("❌ Error en la respuesta:", errorText);
        toast.error("Error saving instructor.");
      }
    } catch (err) {
      console.error("❌ Server error:", err);
      toast.error("Server error.");
    } finally {
      setLoading(false);
    }
  };

  const formattedEvents = schedule.flatMap((day) =>
    day.slots.map((slot) => ({
      title: slot.booked ? "Booked" : "Available",
      start: slot.start,
      end: slot.end,
      backgroundColor: slot.booked ? "blue" : "green",
      borderColor: slot.booked ? "darkblue" : "darkgreen",
      textColor: "white",
      extendedProps: { recurrence: slot.recurrence, booked: slot.booked },
    }))
  );

  console.log("📆 Eventos de FullCalendar:", formattedEvents);

  return (
    <div className="p-10">
      <p className="text-heading2-bold">
        {initialData ? "Edit Instructor" : "Create Instructor"}
      </p>
      <Separator className="bg-grey-1 mt-4 mb-7" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Instructor Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-28">
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Experience (Optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Certifications (Optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={
                        Array.isArray(field.value)
                          ? field.value
                          : field.value
                          ? [field.value]
                          : []
                      }
                      onChange={(url) => field.onChange(url)}
                      onRemove={() => field.onChange("")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-24">
            {/* Nombre de Usuario */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contraseña con botón de generación */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      onClick={generatePassword}
                      className="bg-blue-600 text-white"
                    >
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 📅 **Calendario Interactivo** */}
          <div className=" h-full overflow-y-auto">
            <h3 className="text-lg font-semibold">Schedule</h3>
            {/* 📅 FullCalendar */}
            <FullCalendar
              key={calendarKey} // 🔹 Solo se actualiza cuando `schedule` cambia
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              selectable
              editable
              slotMinTime="08:00:00"
              slotMaxTime="19:00:00"
              slotDuration="00:30:00"
              height="auto"
              contentHeight="auto"
              events={calendarEvents} // 🔹 Ahora usa el estado dinámico
              select={handleDateSelect}
              eventClick={handleEventClick}
            />
          </div>

          {/* 📌 Modal de Configuración */}
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h2 className="text-lg font-bold mb-4">Configure Schedule</h2>

              {/* ⏰ Horarios */}
              <label className="block text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={
                  currentSlot?.start
                    ? currentSlot.start.split("T")[1].slice(0, 5)
                    : ""
                }
                onChange={(e) =>
                  setCurrentSlot((prev) =>
                    prev
                      ? {
                          ...prev,
                          start: `${prev.start.split("T")[0]}T${
                            e.target.value
                          }`,
                        }
                      : prev
                  )
                }
              />

              <label className="block text-sm font-medium mt-2">End Time</label>
              <Input
                type="time"
                value={
                  currentSlot?.end
                    ? currentSlot.end.split("T")[1].slice(0, 5)
                    : ""
                }
                onChange={(e) =>
                  setCurrentSlot((prev) =>
                    prev
                      ? {
                          ...prev,
                          end: `${prev.end.split("T")[0]}T${e.target.value}`,
                        }
                      : prev
                  )
                }
              />

              {/* 📌 Opción de Repetición */}
              <label className="block text-sm font-medium mt-2">
                Recurrence
              </label>
              <Select
                value={currentSlot?.recurrence || "None"}
                onValueChange={(val) =>
                  setCurrentSlot((prev) =>
                    prev ? { ...prev, recurrence: val } : prev
                  )
                }
              >
                {recurrenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>

              {/* 📌 Selección de Duración de Recurrencia */}
              {currentSlot?.recurrence !== "None" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium">
                    Recurrence Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={recurrenceEnd === null}
                      onChange={(e) =>
                        setRecurrenceEnd(
                          e.target.checked
                            ? null
                            : new Date().toISOString().split("T")[0]
                        )
                      }
                    />
                    <label className="text-sm">Indefinite</label>
                  </div>

                  {recurrenceEnd !== null && (
                    <Input
                      type="date"
                      value={recurrenceEnd}
                      onChange={(e) => setRecurrenceEnd(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              )}

              {/* ✅ Checkbox para Agendar */}
              <div className="mt-3 flex items-center">
                <input
                  type="checkbox"
                  checked={currentSlot?.booked || false}
                  onChange={(e) =>
                    setCurrentSlot((prev) =>
                      prev ? { ...prev, booked: e.target.checked } : prev
                    )
                  }
                  className="mr-2"
                />
                <label className="text-sm">Booked</label>
              </div>

              {/* 📌 Botones */}
              <div className="mt-4 flex justify-between">
                <Button onClick={() => setIsModalOpen(false)} variant="outline">
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    if (currentSlot) {
                      const startHour = new Date(currentSlot.start).getHours();
                      const startMinutes = new Date(
                        currentSlot.start
                      ).getMinutes();
                      const endHour = new Date(currentSlot.end).getHours();
                      const endMinutes = new Date(currentSlot.end).getMinutes();

                      // Calculamos la duración en minutos
                      const duration =
                        endHour * 60 +
                        endMinutes -
                        (startHour * 60 + startMinutes);

                      setCopiedSlot({
                        booked: currentSlot.booked,
                        recurrence: currentSlot.recurrence,
                        duration,
                      });
                      toast.success("Slot copied!");
                    }
                  }}
                >
                  Copy
                </Button>

                <Button
                  onClick={
                    currentSlot?.isEditing ? handleUpdateSlot : handleSaveSlot
                  }
                >
                  {currentSlot?.isEditing ? "Update" : "Save"}
                </Button>

                <Button
                  onClick={() => {
                    if (copiedSlot && currentSlot) {
                      const startTime = new Date(currentSlot.start);
                      const startHour = startTime.getHours();
                      const startMinutes = startTime.getMinutes();

                      // Calculamos la nueva hora final
                      const newEndTime = new Date(startTime);
                      newEndTime.setMinutes(
                        startTime.getMinutes() + copiedSlot.duration
                      );

                      const formattedStart = `${
                        currentSlot.start.split("T")[0]
                      }T${startHour.toString().padStart(2, "0")}:${startMinutes
                        .toString()
                        .padStart(2, "0")}`;
                      const formattedEnd = `${
                        currentSlot.start.split("T")[0]
                      }T${newEndTime
                        .getHours()
                        .toString()
                        .padStart(2, "0")}:${newEndTime
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`;

                      const newSlot = {
                        start: formattedStart,
                        end: formattedEnd,
                        booked: copiedSlot.booked,
                        recurrence: copiedSlot.recurrence,
                      };

                      setCurrentSlot(newSlot);
                      toast.success("Slot pasted!");
                    } else {
                      toast.error("No slot copied!");
                    }
                  }}
                >
                  Paste Last Slot
                </Button>

                <Button
                  onClick={() => {
                    if (!currentSlot) {
                      toast.error("No slot selected for deletion.");
                      return;
                    }

                    setIsModalOpen(false); // Cierra el modal de edición
                    setDeleteModalOpen(true); // Abre el modal de confirmación de eliminación
                  }}
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Dialog>

          {/* 📌 Modal para Confirmar Edición */}
          <Dialog
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h2 className="text-lg font-bold mb-4">Edit Recurring Event</h2>
              <p>
                Do you want to edit this event only or all future occurrences?
              </p>
              <div className="mt-4 flex justify-between">
                <Button
                  onClick={() => {
                    setEditAll(false);
                    setIsModalOpen(true);
                    setEditModalOpen(false);
                  }}
                >
                  This Event Only
                </Button>
                <Button
                  onClick={() => {
                    setEditAll(true);
                    setIsModalOpen(true);
                    setEditModalOpen(false);
                  }}
                >
                  All Future Events
                </Button>
              </div>
            </div>
          </Dialog>

          {/* 📌 Modal para Confirmar Eliminación */}
          <Dialog
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
              <h2 className="text-lg font-bold mb-4">Delete Recurring Event</h2>
              <p>
                Do you want to delete this event only or all future occurrences?
              </p>
              <div className="mt-4 flex justify-between">
                <Button onClick={() => handleDeleteSlot(false)}>
                  This Event Only
                </Button>
                <Button onClick={() => handleDeleteSlot(true)}>
                  All Future Events
                </Button>
              </div>
            </div>
          </Dialog>

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
