"use client";

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
import { useEffect, useState } from "react";
import Select, { MultiValue, ActionMeta } from "react-select";

const formSchema = z.object({
  title: z.string().min(2).max(50),
  alsoKnownAs: z.array(z.string().min(1)).default([]),
  length: z.coerce.number().min(0.1, "Must be at least 0.1 hours"),
  price: z.coerce.number().min(0.1, "Price must be greater than 0"),
  overview: z.string().min(10).max(2000),
  objectives: z.array(z.string().min(1)).default([]),
  contact: z.string().regex(/^\d{10,15}$/, "Enter a valid phone number (10-15 digits)"),
  buttonLabel: z.string().min(1).max(20),
  image: z.string().optional(),
  headquarters: z.array(z.string()).min(1, "Please select at least one headquarters"),
});

interface FormProps {
  initialData?: {
    _id: string;
    title: string;
    alsoKnownAs: string[];
    length: number;
    price: number;
    overview: string;
    objectives: string[];
    contact: string;
    buttonLabel: string;
    image?: string;
    headquarters?: string[];
  } | null;
}

const CustomForm: React.FC<FormProps> = ({ initialData }) => {

  const [headquartersOptions, setHeadquartersOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<{ label: string; value: string }[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations"); // 🚀 Petición a Locations
        if (!res.ok) throw new Error("Failed to fetch locations");

        const data = await res.json();

        interface Location {
          zone: string;
        }
        
        const zones = data.map((location: Location) => ({
          label: location.zone,
          value: location.zone,
        }));        

        setHeadquartersOptions(zones);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // ✅ Función para manejar selección en el dropdown
  const handleSelectChange = (newValue: MultiValue<{ label: string; value: string }>, actionMeta: ActionMeta<{ label: string; value: string }>) => {
      const selectedValues = newValue.map((hq) => hq.value);
      console.log(actionMeta)
      form.setValue("headquarters", selectedValues);
      setSelectedHeadquarters(newValue as { label: string; value: string }[]);
    };

  // ✅ Función para manejar "Seleccionar Todos"
  const handleSelectAll = () => {
    if (selectAll) {
      form.setValue("headquarters", []); // Vacía el formulario
      setSelectedHeadquarters([]);
    } else {
      const allValues = headquartersOptions.map((hq) => hq.value);
      form.setValue("headquarters", allValues);
      setSelectedHeadquarters(headquartersOptions);
    }
    setSelectAll(!selectAll);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      alsoKnownAs: initialData?.alsoKnownAs ?? [],
      length: initialData?.length ?? 1,
      price: initialData?.price ?? 0.1,
      overview: initialData?.overview || "",
      objectives: initialData?.objectives ?? [],
      contact: initialData?.contact || "",
      buttonLabel: initialData?.buttonLabel || "",
      image: initialData?.image || "",
      headquarters: initialData?.headquarters ?? [], // ✅ Asegura que sea un array
    },
  });

  // 📌 Cargar las headquarters seleccionadas cuando `initialData` esté disponible
  useEffect(() => {
    if (initialData?.headquarters && headquartersOptions.length > 0) {
      const selected = headquartersOptions.filter(hq =>
         initialData.headquarters?.includes(hq.value)
        );
      setSelectedHeadquarters(selected);
      form.setValue("headquarters", selected.map(hq => hq.value)); // ✅ Sincroniza el formulario
    }
  }, [initialData, headquartersOptions, form]); // 🚀 Se ejecuta cuando `initialData` y `headquartersOptions` cambian

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = initialData ? `/api/classes/${initialData._id}` : "/api/classes";
      const method = initialData ? "PATCH" : "POST";
  
      const payload = {
        ...values,
        headquarters: form.getValues("headquarters"), // ✅ Envía como array
      };

      console.log("[DEBUG] Enviando datos al backend:", payload);
  
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (res.ok) {
        toast.success(`Class ${initialData ? "updated" : "created"} successfully`);
        router.push("/classes");
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
        {initialData ? "Edit Driving Class" : "Create New Driving Class"}
      </h1>
      <Separator className="bg-gray-300 my-4" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 🔹 TITLE */}
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

          {/* 🔹 ALSO KNOWN AS */}
          <FormItem>
            <FormLabel className="pr-4">Also known as</FormLabel>
            {form.watch("alsoKnownAs").map((alias, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={alias}
                  onChange={(e) => {
                    const newAliases = [...form.getValues("alsoKnownAs")];
                    newAliases[index] = e.target.value;
                    form.setValue("alsoKnownAs", newAliases);
                  }}
                  placeholder="Enter alias"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newAliases = form.getValues("alsoKnownAs").filter((_, i) => i !== index);
                    form.setValue("alsoKnownAs", newAliases);
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => form.setValue("alsoKnownAs", [...form.getValues("alsoKnownAs"), ""])}
              className="mt-2 bg-blue-500 text-white"
            >
              + Add Also Know As
            </Button>
          </FormItem>

          {/* 🔹 HEADQUARTERS */}
          <FormItem>
            <FormLabel>Headquarters Available</FormLabel>
            <div className="flex flex-col gap-2">

              {/* ✅ Checkbox para seleccionar todos */}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                <span>Select All</span>
              </label>

              {/* ✅ Multi-Select Dropdown */}
              <Select
                isMulti
                options={headquartersOptions}
                value={selectedHeadquarters}
                onChange={handleSelectChange}
                placeholder="Select locations..."
                className="w-full"
              />
            </div>
            <FormMessage />
          </FormItem>


          {/* 🔹 LENGTH */}
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (hours)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="Enter length" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 PRICE */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="Enter price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 OVERVIEW */}
          <FormField
            control={form.control}
            name="overview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overview</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter overview" rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 🔹 OBJECTIVES */}
          <FormItem>
            <FormLabel className="pr-4">Objectives</FormLabel>
            {form.watch("objectives").map((objective, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={objective}
                  onChange={(e) => {
                    const newObjectives = [...form.getValues("objectives")];
                    newObjectives[index] = e.target.value;
                    form.setValue("objectives", newObjectives);
                  }}
                  placeholder="Enter objective"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newObjectives = form.getValues("objectives").filter((_, i) => i !== index);
                    form.setValue("objectives", newObjectives);
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => form.setValue("objectives", [...form.getValues("objectives"), ""])}
              className="mt-2 bg-blue-500 text-white"
            >
              + Add Objective
            </Button>
          </FormItem>


          {/* 🔹 CONTACT */}
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} placeholder="Enter phone number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 IMAGE UPLOAD */}
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
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

          {/* 🔹 BUTTON LABEL */}
          <FormField
            control={form.control}
            name="buttonLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Button Label</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter button label" maxLength={20} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 BUTTONS */}
          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 text-white">Submit</Button>
            <Button type="button" onClick={() => router.push("/classes")} className="bg-gray-500 text-white">
              Discard
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CustomForm;

