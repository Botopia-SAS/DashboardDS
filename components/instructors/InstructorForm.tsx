"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
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
import Calendar from "../ui/calendar";
import { Plus, Trash, Repeat } from "lucide-react";

const MAX_MONTHS_AHEAD = 2;

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    photo: z.string().url("Valid photo URL required"),
    certifications: z.string().optional(),
    experience: z.string().optional(),
    schedule: z.array(
        z.object({
            date: z.string(),
            slots: z.array(
                z.object({
                    start: z.string(),
                    end: z.string(),
                    booked: z.boolean().optional(), // ✅ Nuevo campo
                }).refine((slot) => slot.start < slot.end, {
                    message: "Start time must be before end time.",
                })
            ),
        })
    ).optional(),
});

interface InstructorData {
    name?: string;
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
    }[];
}

const InstructorForm = ({ initialData }: { initialData?: InstructorData }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [schedule, setSchedule] = useState<{ 
        date: string; 
        slots: { start: string; end: string; booked?: boolean }[] 
    }[]>(initialData?.schedule || []);
    

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            photo: initialData?.photo || "",
            certifications: initialData?.certifications || "",
            experience: initialData?.experience || "",
            schedule: initialData?.schedule || [],
        },
    });

    // Agregar un día a la agenda
    const addScheduleDay = (date: string) => {
        const now = new Date();
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + MAX_MONTHS_AHEAD);

        if (new Date(date) > maxDate) {
            toast.error(`You can only schedule up to ${MAX_MONTHS_AHEAD} months ahead.`);
            return;
        }

        if (schedule.some((d) => d.date === date)) {
            toast.error("Date already selected.");
            return;
        }

        setSchedule([...schedule, { date, slots: [] }]);
    };

    // Agregar un slot a un día específico
    const addSlot = (date: string) => {
        setSchedule(
            schedule.map((d) =>
                d.date === date ? { ...d, slots: [...d.slots, { start: "", end: "" }] } : d
            )
        );
    };

    // Actualizar un slot específico
    const updateSlot = (date: string, index: number, key: "start" | "end" | "booked", value: string | boolean) => {
        setSchedule(
            schedule.map((d) =>
                d.date === date
                    ? {
                        ...d,
                        slots: d.slots.map((slot, i) =>
                            i === index ? { ...slot, [key]: value } : slot
                        ),
                    }
                    : d
            )
        );
    };
    

    // Eliminar un slot
    const removeSlot = (date: string, index: number) => {
        setSchedule(
            schedule.map((d) =>
                d.date === date ? { ...d, slots: d.slots.filter((_, i) => i !== index) } : d
            )
        );
    };

    // Eliminar un día completo
    const removeScheduleDay = (date: string) => {
        setSchedule(schedule.filter((d) => d.date !== date));
    };

    // Replicar la agenda semanalmente hasta 2 meses adelante
    const replicateWeekly = () => {
        const newSchedule = [...schedule];
        const now = new Date();
        now.setMonth(now.getMonth() + MAX_MONTHS_AHEAD);

        schedule.forEach((day) => {
            const currentDate = new Date(day.date);
            while (currentDate <= now) {
                const formattedDate = currentDate.toISOString().split("T")[0];

                if (!newSchedule.some((d) => d.date === formattedDate)) {
                    newSchedule.push({
                        date: formattedDate,
                        slots: [...day.slots],
                    });
                }

                currentDate.setDate(currentDate.getDate() + 7);
            }
        });

        setSchedule(newSchedule);
        toast.success("Weekly schedule replicated!");
    };

    // Manejo del submit
    const onSubmit = async (values: InstructorData) => {
        setLoading(true);
    
        try {
            const res = await fetch("/api/instructors", {
                method: initialData ? "PUT" : "POST", // Cambia a PUT si es edición
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values, 
                    schedule: schedule.map(day => ({
                        date: day.date,
                        slots: day.slots.map(slot => ({
                            start: slot.start,
                            end: slot.end,
                            booked: slot.booked || false, // ✅ Asegurar que `booked` se envía
                        })),
                    }))
                }),
            });
    
            if (res.ok) {
                toast.success("Instructor saved successfully!");
                router.push("/instructors");
            } else {
                toast.error("Error saving instructor.");
            }
        } catch (err) {
            toast.error("Server error.");
        } finally {
            setLoading(false);
        }
    };    

    return (

        <div className="p-10">
            <p className="text-heading2-bold">{initialData ? "Edit Instructor" : "Create Instructor"}</p>
            <Separator className="bg-grey-1 mt-4 mb-7" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Instructor Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="experience" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Experience</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Experience (Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="certifications" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Certifications</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Certifications (Optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="photo" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Photo</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                                    onChange={(url) => field.onChange(url)}
                                    onRemove={() => field.onChange("")}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Sección de Horario */}
                    <div className="border p-4 rounded-md">
                        <h3 className="text-lg font-semibold">Schedule</h3>
                        <Calendar onSelect={(date) => addScheduleDay(date.toISOString().split("T")[0])} />

                        {schedule.map((day) => (
                            <div key={day.date} className="border-t pt-3 mt-3">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{day.date}</p>
                                    <Button variant="destructive" size="sm" onClick={() => removeScheduleDay(day.date)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>

                                {day.slots.map((slot, index) => (
                                    <div key={index} className="flex items-center gap-2 mt-2">
                                        <Input type="time" value={slot.start} onChange={(e) => updateSlot(day.date, index, "start", e.target.value)} />
                                        <span>to</span>
                                        <Input type="time" value={slot.end} onChange={(e) => updateSlot(day.date, index, "end", e.target.value)} />

                                        {/* Checkbox para indicar si el horario está agendado */}
                                        <label className="flex items-center gap-1">
                                            <input
                                                type="checkbox"
                                                checked={slot.booked || false}
                                                onChange={(e) => updateSlot(day.date, index, "booked", e.target.checked)}
                                            />
                                            <span className="text-gray-700">Booked</span>
                                        </label>

                                        <Button variant="destructive" size="sm" onClick={() => removeSlot(day.date, index)}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}

                                <Button variant="secondary" size="sm" className="mt-2" onClick={() => addSlot(day.date)}>
                                    <Plus className="w-4 h-4 mr-1" /> Add Slot
                                </Button>
                            </div>
                        ))}
                        {/* Botón de Repetir Semanalmente */}
                        <Button variant="secondary" size="sm" className="mt-4" onClick={replicateWeekly}>
                            <Repeat className="w-4 h-4 mr-1" /> Replicate Weekly
                        </Button>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={loading}>
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
