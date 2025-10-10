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
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { useRef } from "react";
import Link from "next/link";

// Configurar la API de Google Maps
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  zone: z.string().optional(),
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

const LIBRARIES: "places"[] = ["places"];

const LocationsForm: React.FC<LocationsFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
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
  const [selectAll, setSelectAll] = useState(false); // ✅ Cargar Google Maps API

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES, // ✅ Usar la constante
  });

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

  useEffect(() => {
    setIsClient(true);
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
      form.setValue(
        "instructors",
        instructorsList.map((inst) => inst._id)
      ); // Seleccionar todos
    }
    setSelectAll(!selectAll);
  };

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // 📌 Define la referencia

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete; // ✅ Guarda la referencia de Autocomplete
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      console.log("📌 Selected Place:", place);

      if (place?.formatted_address) {
        form.setValue("zone", place.formatted_address); // Asigna el valor al formulario
      } else {
        toast.error("Please select a valid address from the dropdown.");
      }
    }
  };

  const onSubmit = async (values: FormData) => {
    try {
      const url = initialData?._id
        ? `/api/locations/${initialData._id}`
        : "/api/locations";
      const method = initialData?._id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast.success(
          `Location ${initialData?._id ? "updated" : "created"} successfully`
        );
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {initialData ? "Edit Location" : "Create New Location"}
        </h1>

        {/* SEO Button - Solo visible si hay initialData (modo edición) */}
        {initialData && (
          <Link href={`/locations/${initialData._id}/seo`}>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2"
            >
              SEO Settings
            </Button>
          </Link>
        )}
      </div>
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
                  <Textarea
                    {...field}
                    placeholder="Enter description"
                    rows={4}
                  />
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
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={onLoad}
                      onPlaceChanged={onPlaceChanged}
                    >
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

          {/* Instructors Dropdown */}
          <FormField
            control={form.control}
            name="instructors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructors</FormLabel>
                <FormControl>
                  {isClient && (
                    <Select
                      isMulti
                      options={instructorOptions}
                      value={instructorOptions.filter((option) =>
                        field.value.includes(option.value)
                      )} // ✅ Usa `field.value`
                      onChange={(selected) =>
                        field.onChange(selected.map((opt) => opt.value))
                      } // ✅ Usa `field.onChange`
                    />
                  )}
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
            <Button
              type="button"
              onClick={() => router.push("/locations")}
              className="bg-gray-500 text-white"
            >
              Discard
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
export default LocationsForm;