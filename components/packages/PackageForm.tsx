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
import { Combobox } from "@/components/ui/combobox";

// ✅ Definir esquema de validación con `zod`
export const packageSchema = z.object({
  title: z.string().min(2).max(75),
  description: z.string().min(2).max(500).trim(), // 🔹 Volvemos a agregarlo
  media: z.array(z.string()).default([]),
  price: z.coerce.number().min(0.1),
  category: z.enum(["Lessons", "Packages"]), // ✅ Agregamos "Lessons"
  type: z.enum(["Book", "Buy", "Contact"]),
  buttonLabel: z.string().min(1).max(20),
});

export type PackageType = z.infer<typeof packageSchema>;

// ✅ Definir props del componente
interface PackageFormProps {
  initialData?: PackageType & { _id: string } | null;
}

const PackageForm: React.FC<PackageFormProps> = ({ initialData }) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "", // 🔹 Agregado aquí
      media: initialData?.media ?? [], // ✅ Asegurar siempre array
      price: initialData?.price ?? 0.1,
      category: initialData?.category || "Packages",
      type: initialData?.type || "Book",
      buttonLabel: initialData?.buttonLabel || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof packageSchema>) => {
    try {
      const url = initialData ? `/api/packages/${initialData._id}` : "/api/packages";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast.success(`Package ${initialData ? "updated" : "created"} successfully`);
        router.push("/packages");
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
        {initialData ? "Edit Package" : "Create New Package"}
      </h1>
      <Separator className="bg-gray-300 my-4" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 🔹 TITLE */}
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter description" rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* 🔹 IMAGE UPLOAD */}
          <FormField control={form.control} name="media" render={({ field }) => (
            <FormItem>
              <FormLabel>Media (Images/Videos)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={(url) => field.onChange([...field.value, url])}
                  onRemove={(url) => field.onChange(field.value.filter((img) => img !== url))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* 🔹 PRICE */}
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} placeholder="Enter price" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* 🔹 CATEGORY */}
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { label: "Lessons", value: "Lessons" },
                    { label: "Packages", value: "Packages" },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />


          {/* 🔹 TYPE */}
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { label: "Book", value: "Book" },
                    { label: "Buy", value: "Buy" },
                    { label: "Contact", value: "Contact" },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* 🔹 BUTTON LABEL */}
          <FormField control={form.control} name="buttonLabel" render={({ field }) => (
            <FormItem>
              <FormLabel>Button Label</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter button label" maxLength={20} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* 🔹 SUBMIT BUTTON */}
          <Button type="submit" className="bg-blue-600 text-white">Submit</Button>
        </form>
      </Form>
    </div>
  );
};

export default PackageForm;
