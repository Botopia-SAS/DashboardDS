"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

const formSchema = z.object({
    title: z.string().min(2).max(100),
    description: z.string().min(10).max(2000),
    zone: z.string().min(1, "Please select a valid location"),
    locationImage: z.string().optional(),
    instructors: z.array(
        z.object({
            name: z.string().min(1),
            image: z.string().optional().nullable(),
        })
    ).default([]),
});

// Definir el tipo correcto
interface LocationType {
    _id?: string;
    title: string;
    description: string;
    zone: string;
    locationImage?: string;
    instructors: { name: string; image?: string | null }[];
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

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "instructors",
    });

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places"],
    });

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            form.setValue("zone", place?.formatted_address || "");
        }
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

                    {/* Zone - Google Places Autocomplete */}
                    <FormField
                        control={form.control}
                        name="zone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone</FormLabel>
                                <FormControl>
                                    {isLoaded ? (
                                        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                                            <Input {...field} placeholder="Enter a location" />
                                        </Autocomplete>
                                    ) : (
                                        <p>Loading...</p>
                                    )}
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

                    {/* Instructors */}
                    <FormItem>
                        <FormLabel>Instructors</FormLabel>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-4 mb-2 w-full">
                                <Input
                                    className="flex-grow"
                                    {...form.register(`instructors.${index}.name`)}
                                    placeholder="Instructor name"
                                />
                                <ImageUpload
                                    value={
                                        form.watch(`instructors.${index}.image`)
                                            ? [form.watch(`instructors.${index}.image`)].filter(Boolean) as string[]
                                            : []
                                    }
                                    onChange={(url) => form.setValue(`instructors.${index}.image`, url || null)}
                                    onRemove={() => form.setValue(`instructors.${index}.image`, null)}
                                />
                                <Button type="button" variant="destructive" onClick={() => remove(index)}>✕</Button>
                            </div>
                        ))}
                        <Button type="button" onClick={() => append({ name: "", image: null })}>
                            + Add Instructor
                        </Button>
                    </FormItem>

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
