"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import ImageUpload from "@/components/custom ui/ImageUpload";
import toast from "react-hot-toast";

// ✅ Esquema de validación con `zod`
export const onlineCourseSchema = z.object({
  title: z.string().min(2).max(75),
  description: z.string().min(2).max(2000).trim(),
  image: z.string().optional(), // ✅ Campo para la imagen
  hasPrice: z.boolean().default(false),
  price: z.coerce.number().min(0).optional(),
  type: z.enum(["Book", "Buy"]),
  buttonLabel: z.string().min(1).max(20),
});

export type OnlineCourseType = z.infer<typeof onlineCourseSchema>;

// ✅ Props del componente
interface OnlineCourseFormProps {
  initialData?: (OnlineCourseType & { _id: string }) | null;
}

const OnlineCourseForm: React.FC<OnlineCourseFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [isPriceEnabled, setIsPriceEnabled] = useState(
    initialData?.hasPrice || false
  );

  const form = useForm<z.infer<typeof onlineCourseSchema>>({
    resolver: zodResolver(onlineCourseSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      image: initialData?.image || "",
      hasPrice: initialData?.hasPrice || false,
      price: initialData?.price ?? 0,
      type: initialData?.type || "Book",
      buttonLabel: initialData?.buttonLabel || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof onlineCourseSchema>) => {
    try {
      const url = initialData
        ? `/api/online-courses/${initialData._id}`
        : "/api/online-courses";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast.success(
          `Online Course ${initialData ? "updated" : "created"} successfully`
        );
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
    <div className="min-h-screen flex flex-col bg-gray-100 p-10">
      {/* 🔹 HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          {initialData ? "Edit Online Course" : "Create Online Course"}
        </h1>
      </div>

      <Separator className="bg-gray-300 my-4" />

      <Form {...form}>
        <form
          id="online-course-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-white p-8 rounded-lg shadow-lg w-full  mx-auto space-y-6"
        >
          {/* 🔹 TITLE */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Course Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter title"
                    className="w-full"
                  />
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
                <FormLabel className="font-medium">
                  Course Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter description"
                    rows={4}
                    className="w-full"
                  />
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
                <FormLabel className="font-medium">Course Image</FormLabel>
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

          {/* 🔹 HAS PRICE CHECKBOX */}
          <FormField
            control={form.control}
            name="hasPrice"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked: boolean) => {
                      field.onChange(checked);
                      setIsPriceEnabled(checked);
                    }}
                  />
                </FormControl>
                <FormLabel className="font-medium">
                  This course has a price
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 PRICE (Solo habilitado si `hasPrice` es true) */}
          {isPriceEnabled && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      placeholder="Enter price"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 🔹 TYPE */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Type</FormLabel>
                <FormControl>
                  <Combobox
                    options={[
                      { label: "Book", value: "Book" },
                      { label: "Buy", value: "Buy" },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
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
                <FormLabel className="font-medium">Button Label</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter button label"
                    maxLength={20}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-gray-400 text-gray-600"
              onClick={() => router.push("/classes")}
            >
              Discard
            </Button>
            <Button
              type="submit"
              form="online-course-form"
              className="bg-blue-600 text-white"
            >
              Save Course
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default OnlineCourseForm;
