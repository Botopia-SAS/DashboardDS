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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useEffect, useState } from "react";

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  middleName: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    )
    .optional()
    .or(z.literal("")), // Permite cadena vacía en edición
  ssnLast4: z.string().length(4, "Must be exactly 4 digits"),
  hasLicense: z.boolean(),
  licenseNumber: z.string().optional().or(z.literal("")),
  birthDate: z.string().min(1, "Birth date is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  apartmentNumber: z.string().min(1, "Apartment number is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  sex: z.string(),
  howDidYouHear: z.string(),
  payedAmount: z.number().min(0, "Amount must be greater than 0"),
  method: z.string(),
  registerForCourse: z.boolean().default(false),
  courseId: z.string().optional(),
});

interface CustomersFormProps {
  initialData?: {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email?: string;
    password?: string;
    ssnLast4: string;
    hasLicense: boolean;
    licenseNumber?: string;
    birthDate: string;
    streetAddress: string;
    apartmentNumber: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    sex: string;
    howDidYouHear: string;
    payedAmount:  number;
    method: string;
  } | null;
}

interface Course {
  _id: string;
  locationId: string;
  date: string;
  hour: string;
  classId: string;
  instructorId: string;
  students: string[];
  __v: number;
  locationName: string;
}

const CustomersForm = ({ initialData }: CustomersFormProps) => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      password: initialData ? undefined : "", // Solo se requiere en creación
      ssnLast4: initialData?.ssnLast4 || "",
      hasLicense: initialData?.hasLicense || false,
      licenseNumber: initialData?.licenseNumber || "",
      birthDate: initialData?.birthDate || "",
      streetAddress: initialData?.streetAddress || "",
      apartmentNumber: initialData?.apartmentNumber || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      phoneNumber: initialData?.phoneNumber || "",
      sex: initialData?.sex || "",
      howDidYouHear: initialData?.howDidYouHear || "",
      payedAmount: initialData?.payedAmount || 0,
      method: initialData?.method || "",
      registerForCourse: false,
      courseId: "",
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
      console.log(values);

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

  useEffect(() => {
    fetch("/api/ticket/classes")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
      })
      .catch((error) => console.error("Error fetching classes:", error));
  }, []);

  return (
    <div className="max-w-5xl p-8 mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800">
        {initialData ? "Update" : "Register New"} User
      </h1>
      <Separator className="bg-gray-300 my-6" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Personal Information
            </h2>
            <div className="grid lg:grid-cols-3 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter first name"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Middle Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter middle name"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-auto">
                    <FormLabel className="text-gray-700 font-medium">
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter last name"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Birth Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Gender
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) =>
                          field.onChange(val as "M" | "F")
                        }
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Select the gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Address Information
            </h2>
            <div className="grid lg:grid-cols-3 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-gray-700 font-medium">
                      Street Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter street address"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apartmentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Apartment Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter apartment number"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid lg:grid-cols-3 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      City
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter city"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      State
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter state"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Zip Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter zip code"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Contact Information
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter phone number"
                        type="tel"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email"
                        readOnly={initialData ? true : false}
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Security Information */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Security Information
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter password"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ssnLast4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Last 4 Digits of SSN
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter last 4 digits"
                        maxLength={4}
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="hasLicense"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked: boolean) =>
                          field.onChange(!!checked)
                        }
                        className="border-gray-400"
                      />
                      <FormLabel className="text-gray-700 font-medium cursor-pointer">
                        Do you have a driver&apos;s license?
                      </FormLabel>
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
                      <FormLabel className="text-gray-700 font-medium">
                        License Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter license number"
                          className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Additional Information
            </h2>
            <FormField
              control={form.control}
              name="howDidYouHear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">
                    How did you hear about us?
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter source"
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
          </div>

          {/* Payment Information */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Payment Information
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="payedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Amount Paid
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(+e.target.value)}
                        type="number"
                        placeholder="Enter amount"
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Payment Method
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val as string)}
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Select a payment method"></SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Master Card">
                            Master Card
                          </SelectItem>
                          <SelectItem value="Money Order">
                            Money Order
                          </SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Course Registration (Optional)
            </h2>

            <FormField
              control={form.control}
              name="registerForCourse"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked: boolean) =>
                        field.onChange(!!checked)
                      }
                      className="border-gray-400"
                    />
                    <FormLabel className="text-gray-700 font-medium cursor-pointer">
                      Register this user for a course
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("registerForCourse") && (
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Select Course
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {courses.map((c) => (
                            <SelectItem
                              key={c?._id}
                              value={c?._id}
                              className="hover:bg-gray-100 cursor-pointer"
                            >
                              {new Date(c?.date).toLocaleString("en-US", {
                                weekday: "long",
                                timeZone: "UTC",
                              })}
                              , {new Date(c?.date).getUTCDate()}{" "}
                              {new Date(c?.date).toLocaleString("en-US", {
                                month: "short",
                                timeZone: "UTC",
                              })}{" "}
                              {new Date(c?.date).getUTCFullYear()}{" "}
                              {parseInt(c?.hour.split(":")[0]) > 11
                                ? `${c?.hour} p.m.`
                                : `${c?.hour} a.m.`}{" "}
                              | {c?.locationName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Separator className="bg-gray-300 my-6" />
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              onClick={() => router.push("/customers")}
              className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-6 py-2"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              {initialData ? "Update" : "Register"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CustomersForm;
