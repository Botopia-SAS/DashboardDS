"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")), // Permite cadena vacía en edición
  ssnLast4: z.string().length(4, "Must be exactly 4 digits"),
  hasLicense: z.boolean(),
  licenseNumber: z.string().optional().or(z.literal("")),
});

interface CustomersFormProps {
  initialData?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    password?: string;
    ssnLast4: string;
    hasLicense: boolean;
    licenseNumber?: string;
  } | null;
}

const CustomersForm = ({ initialData }: CustomersFormProps) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      password: initialData ? undefined : "", // Solo se requiere en creación
      ssnLast4: initialData?.ssnLast4 || "",
      hasLicense: initialData?.hasLicense || false,
      licenseNumber: initialData?.licenseNumber || "",
    },
  });

  const hasLicense = form.watch("hasLicense");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = initialData
        ? `/api/customers/${initialData.id}`
        : "/api/customers";
      const updatedValues = {
        ...values,
        hasLicense: !!values.hasLicense,
        licenseNumber: values.hasLicense ? values.licenseNumber : "",
      };

      // Si está en edición y el password está vacío, lo eliminamos del objeto
      if (initialData && !values.password) {
        delete updatedValues.password;
      }

      const method = initialData ? "PATCH" : "POST";
      await fetch(url, {
        method: method,
        body: JSON.stringify(updatedValues),
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success(
        `User ${initialData ? "updated" : "registered"} successfully`
      );
      router.push("/customers");
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Registration failed");
    }
  };

  return (
    <div className="p-10 mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold">
        {initialData ? "Update" : "Register New"} User
      </h1>
      <Separator className="bg-gray-300 my-4" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter last name" />
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
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter email"
                    readOnly={initialData !== null}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ssnLast4"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last 4 Digits of SSN</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter last 4 digits"
                    maxLength={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hasLicense"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked: boolean) =>
                      field.onChange(!!checked)
                    }
                  />
                  <FormLabel>Do you have a driver&apos;s license?</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {hasLicense && (
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter license number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 text-white">
              Register
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/customers")}
              className="bg-gray-500 text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CustomersForm;
