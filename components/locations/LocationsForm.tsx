"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import toast from "react-hot-toast";
import Select from "react-select"; // 📌 Librería para Select

const formSchema = z.object({
    title: z.string().min(2).max(100),
    description: z.string().min(10).max(2000),
    zone: z.string().min(1, "Please select a valid location"),
    locationImage: z.string().optional(),
    instructors: z.array(z.string()).default([]), // 📌 Array de IDs de instructores
});

// Definir el tipo correcto
interface Instructor {
    _id: string;
    name: string;
}

interface LocationType {
    _id?: string;
    title: string;
    description: string;
    zone: string;
    locationImage?: string;
    instructors: string[]; // Solo guardamos los IDs
}

interface LocationsFormProps {
    initialData?: LocationType;
}

const LocationsForm: React.FC<LocationsFormProps> = ({ initialData }) => {
    const router = useRouter();
    type FormData = z.infer<typeof formSchema>;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            zone: initialData?.zone || "",
            locationImage: initialData?.locationImage || "",
            instructors: initialData?.instructors || [],
        },
    });

    const [instructorsList, setInstructorsList] = useState<Instructor[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // ✅ Obtener instructores desde la API al cargar el formulario
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                const res = await fetch("/api/instructors");
                if (!res.ok) throw new Error("Failed to fetch instructors");
                const data: Instructor[] = await res.json();
                setInstructorsList(data);
            } catch (error) {
                console.error("Error fetching instructors:", error);
            }
        };

        fetchInstructors();
    }, []);

    // 📌 Convertir la lista de instructores en opciones para `react-select`
    const instructorOptions = instructorsList.map((inst) => ({
        value: inst._id,
        label: inst.name,
    }));

    // 📌 Manejar selección de todos los instructores
    const handleSelectAll = () => {
        if (selectAll) {
            form.setValue("instructors", []); // Desmarcar todos
        } else {
            form.setValue("instructors", instructorsList.map((inst) => inst._id)); // Seleccionar todos
        }
        setSelectAll(!selectAll);
    };

    const onSubmit = async (values: FormData) => {
        try {
            const url = initialData?._id ? `/api/locations/${initialData._id}` : "/api/locations";
            const method = initialData?._id ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                toast.success(`Location ${initialData?._id ? "updated" : "created"} successfully`);
                router.push("/locations");
            } else {
                toast.error("Failed to submit form");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong!");
        }
    };

    return (
        <div className="p-10 mx-auto bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-semibold">
                {initialData ? "Edit Location" : "Create New Location"}
            </h1>
            <Separator className="bg-gray-300 my-4" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Title */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter title" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea {...field} placeholder="Enter description" rows={4} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Zone */}
                    <FormField
                        control={form.control}
                        name="zone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Enter a location" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Location Image */}
                    <FormField
                        control={form.control}
                        name="locationImage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location Image</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={field.value ? [field.value] : []}
                                        onChange={(url) => field.onChange(url)}
                                        onRemove={() => field.onChange("")}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Instructors Dropdown */}
                    <FormField
                        control={form.control}
                        name="instructors"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instructors</FormLabel>
                                <FormControl>
                                    <Select
                                        isMulti
                                        options={instructorOptions}
                                        value={instructorOptions.filter((option) => field.value.includes(option.value))}
                                        onChange={(selected) =>
                                            form.setValue("instructors", selected.map((opt) => opt.value))
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Select All Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="cursor-pointer"
                        />
                        <label className="text-gray-700">Select All Instructors</label>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <Button type="submit" className="bg-blue-600 text-white">
                            {initialData ? "Update" : "Submit"}
                        </Button>
                        <Button type="button" onClick={() => router.push("/locations")} className="bg-gray-500 text-white">
                            Discard
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default LocationsForm;
