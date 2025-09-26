"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Separator } from "../ui/separator";
import ContactInfromation from "./ContactInformation";
import LiscenseInformation from "./LiscenseInformation";
import PersonalInformation from "./PersonalInformation";
import SecurityInformation from "./SecurityInformation";

const formSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    middleName: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(4, "Password must be at least 4 characters")
      .optional()
      .or(z.literal("")),
    ssnLast4: z.string().optional(),
    hasLicense: z.boolean(),
    licenseNumber: z.string().optional().or(z.literal("")),
    birthDate: z.string().min(1, "Birth date is required"),
    streetAddress: z.string().optional().or(z.literal("")),
    apartmentNumber: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    state: z.string().optional().or(z.literal("")),
    zipCode: z.string().optional().or(z.literal("")),
    phoneNumber: z.string().min(1, "Phone number is required"),
    sex: z.string(),
    registerForCourse: z.boolean().default(false),
    payedAmount: z.number().min(0, "Amount must be greater than 0").optional(),
    method: z.string().optional(),
    courseId: z.string().optional(),
    fee: z.number().default(50),
    courseType: z.enum(["date", "bdi", "adi"]).optional(),
    country_ticket: z.string().optional(),
    course_country: z.string().optional(),
    bdi_subtype: z
      .enum(["bdi", "4h c.o", "8h c.o", "agressive", "tcac ordered", "other"])
      .optional(),
    citation_number: z.string().optional(),
    case_number: z.string().optional(),
    adi_reason: z
      .enum([
        "3 crashes in 3 years",
        "ADI for Points",
        "adi for HTO",
        "ADI Court Ordered",
        "ADI Department required",
      ])
      .optional(),
    bdi_reason: z
      .enum([
        "BDI Insurance",
        "BDI Hwy Racing Spectator",
        "BDI Election",
        "BDI for TCAC",
        "BDI Court Ordered",
        "BDI Reckless Driving",
        "BDI Red light running",
        "BDI Passing School Bus",
        "BDI for Highway Racing",
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.registerForCourse) {
      if (data.payedAmount && !data.method) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Payment Method is required when an amount is paid",
          path: ["method"],
        });
      }
      if (!data.courseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Course selection is required when registering for a course",
          path: ["courseId"],
        });
      }

      if (data.courseType === "bdi") {
        if (!data.country_ticket) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Country Ticket is required for BDI courses",
            path: ["country_ticket"],
          });
        }
        if (!data.course_country) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Course Country is required for BDI courses",
            path: ["course_country"],
          });
        }
        if (!data.bdi_subtype) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "BDI Subtype is required for BDI courses",
            path: ["bdi_subtype"],
          });
        }
        if (!data.licenseNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "License Number is required for BDI courses",
            path: ["licenseNumber"],
          });
        }
        if (!data.citation_number) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Citation Number is required for BDI courses",
            path: ["citation_number"],
          });
        }
        if (!data.case_number) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Case Number is required for BDI courses",
            path: ["case_number"],
          });
        }
        if (!data.bdi_reason) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reason is required for BDI courses",
            path: ["bdi_reason"],
          });
        }
      }

      if (data.courseType === "adi") {
        if (!data.country_ticket) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Country Ticket is required for ADI courses",
            path: ["country_ticket"],
          });
        }
        if (!data.course_country) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Course Country is required for ADI courses",
            path: ["course_country"],
          });
        }
        if (!data.adi_reason) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reason is required for ADI courses",
            path: ["adi_reason"],
          });
        }
      }
    }
  });

interface CustomersFormProps {
  initialData?: {
    _id: string;
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
    payedAmount: number;
    method: string;
    courseType?: "date" | "bdi" | "adi";
    country_ticket?: string;
    course_country?: string;
    bdi_subtype?:
      | "bdi"
      | "4h c.o"
      | "8h c.o"
      | "agressive"
      | "tcac ordered"
      | "other";
    citation_number?: string;
    case_number?: string;
    adi_reason?:
      | "3 crashes in 3 years"
      | "ADI for Points"
      | "adi for HTO"
      | "ADI Court Ordered"
      | "ADI Department required";
    bdi_reason?:
      | "BDI Insurance"
      | "BDI Hwy Racing Spectator"
      | "BDI Election"
      | "BDI for TCAC"
      | "BDI Court Ordered"
      | "BDI Reckless Driving"
      | "BDI Red light running"
      | "BDI Passing School Bus"
      | "BDI for Highway Racing";
    createdAt?: string; // Añadiendo la fecha de creación
  } | null;
}

const CustomersForm = ({ initialData }: CustomersFormProps) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      password: initialData ? undefined : "",
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
      payedAmount: 0,
      method: "",
      registerForCourse: false,
      courseId: "",
      fee: 50,
      courseType: initialData?.courseType || "date",
      country_ticket: initialData?.country_ticket || "",
      course_country: initialData?.course_country || "",
      bdi_subtype: initialData?.bdi_subtype || undefined,
      citation_number: initialData?.citation_number || "",
      case_number: initialData?.case_number || "",
      adi_reason: initialData?.adi_reason || undefined,
      bdi_reason: initialData?.bdi_reason || undefined,
    },
  });

  const hasLicense = form.watch("hasLicense");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = initialData
        ? `/api/customers/${initialData._id}`
        : "/api/customers";
      const updatedValues = {
        ...values,
        hasLicense: !!values.hasLicense,
        licenseNumber: values.hasLicense ? values.licenseNumber : "",
      };
      //console.log(values);

      if (initialData && !values.password) {
        delete updatedValues.password;
      }

      const method = initialData ? "PATCH" : "POST";
      const response = await fetch(url, {
        method: method,
        body: JSON.stringify(updatedValues),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 400) {
        toast.error("Email is already in use. Please use a different email.");
        return;
      }

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
    <div className="max-w-5xl p-8 mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800">
        {initialData ? "Update" : "Register New"} User
      </h1>
      <Separator className="bg-gray-300 my-6" />

      {/* Displaying registration date for existing users or current date for new users */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
        <p className="text-gray-700 font-medium">
          <span className="font-semibold">Register date:</span>{" "}
          {initialData && initialData.createdAt
            ? new Date(initialData.createdAt).toLocaleString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : new Date().toLocaleString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
        </p>
      </div>

      <Form {...form}>
        <form
          autoComplete="off"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Personal Information
            </h2>
            <PersonalInformation form={form} />
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Contact Information
            </h2>
            <ContactInfromation form={form} initialData={initialData} />
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Security Information
            </h2>
            <SecurityInformation form={form} />
            <LiscenseInformation form={form} hasLicense={hasLicense} />
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
