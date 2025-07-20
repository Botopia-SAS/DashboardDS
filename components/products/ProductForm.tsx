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
import { useState } from "react";
import toast from "react-hot-toast";
import Delete from "../custom ui/Delete";
import Loader from "../custom ui/Loader";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(70),
  description: z.string().min(2, "Description must be at least 2 characters").max(500).trim(),
  hasImage: z.boolean().default(false),
  media: z.array(z.string()).default([]),
  price: z.coerce.number().min(0.1, "Price must be at least $0.10"),
  duration: z.coerce.number().int("Duration must be a whole number").min(1, "Duration must be at least 1 hour").max(24, "Duration cannot exceed 24 hours"),
  category: z.enum(["General", "Road Skills for Life"]),
  type: z.enum(["Book", "Buy","Contact"]),
  buttonLabel: z.string().min(1, "Button label is required").max(20),
});

interface ProductFormProps {
  initialData?: {
    _id: string;
    title: string;
    description: string;
    media: string[];
    price: number;
    duration: number;
    category: "General" | "Road Skills for Life";
    type: "Book" | "Buy" | "Contact";
    buttonLabel: string;
  } | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      hasImage: (initialData?.media?.length ?? 0) > 0 || false,
      media: initialData?.media || [],
      price: initialData?.price ?? 0.1, // Usa `??` para evitar undefined
      duration: initialData?.duration ?? 1,
      category: initialData?.category || "General",
      type: initialData?.type || "Book",
      buttonLabel: initialData?.buttonLabel || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const url = initialData ? `/api/products/${initialData._id}` : "/api/products";

      const res = await fetch(url, {
        method: initialData ? "PATCH" : "POST", // ✅ Usamos PATCH para actualizar, POST para crear
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        setLoading(false);
        toast.success(`Product ${initialData ? "updated" : "created"}`);
        router.push("/products");
      }
    } catch (err) {
      console.log("[products_POST]", err);
      toast.error("Something went wrong! Please try again.");
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="p-10 mx-auto bg-white rounded-lg shadow-md">
      {initialData ? (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Edit Driving Lesson</h1>
          <Delete id={initialData._id} item="product" />
        </div>
      ) : (
        <h1 className="text-2xl font-semibold">Create Driving Lesson</h1>
      )}
      <Separator className="bg-gray-300 my-4" />
      <p className="text-sm text-gray-600 mb-4">* Campos obligatorios</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-9">

          {/* 🔹 TITLE */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} className="border-gray-300 rounded-md shadow-sm" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 DESCRIPTION */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter description" {...field} rows={4} className="border-gray-300 rounded-md shadow-sm" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 SWITCH PARA ACTIVAR/DESACTIVAR IMAGEN */}
          <FormField
            control={form.control}
            name="hasImage"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel>Include Image?</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        form.setValue("media", []);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 🔹 IMAGE UPLOAD (SOLO SE MUESTRA SI hasImage = true) */}
          {form.watch("hasImage") && (
            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={(url) => field.onChange([...field.value, url])}
                      onRemove={(url) => field.onChange(field.value.filter((image) => image !== url))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 🔹 PRICE, DURATION y CATEGORY en una FILA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter price" {...field} className="border-gray-300 rounded-md shadow-sm" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (hours) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" placeholder="Enter duration" {...field} className="border-gray-300 rounded-md shadow-sm" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Combobox
                      options={[
                        { label: "General", value: "General" },
                        { label: "Road Skills for Life", value: "Road Skills for Life" },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 🔹 TYPE y BUTTON LABEL en otra FILA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-32">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
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
              )}
            />

            <FormField
              control={form.control}
              name="buttonLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Label *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter button label (20 characters max)" {...field} maxLength={20} className="border-gray-300 rounded-md shadow-sm" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 🔹 BUTTONS */}
          <div className="flex justify-start gap-4">
            <Button type="submit" className="bg-blue-600 text-white">Submit</Button>
            <Button type="button" onClick={() => router.push("/products")} className="bg-gray-500 text-white">Discard</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;
