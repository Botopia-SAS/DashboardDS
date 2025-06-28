"use client";

import useClassTypeStore from "@/app/store/classTypeStore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import Loader from "@/components/custom ui/Loader";
import { format, addHours } from "date-fns";

const formSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  date: z.string().min(1, "Date is required"),
  hour: z.string().min(1, "Hour is required"),
  classId: z.string().min(1, "Class is required"),
  instructorId: z.string().min(1, "Instructor is required"),
  duration: z.string(),
  type: z.enum(["date", "bdi", "adi"]).default("date"),
});

// Define the type for form values
type FormValues = z.infer<typeof formSchema>;

interface Location {
  _id: string;
  title: string;
  description: string;
  zone: string;
  locationImage: string;
  instructors: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Instructor {
  _id: string;
  name: string;
  photo: string;
  dni: string;
  certifications?: string;
  experience?: string;
}

interface Class {
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
  classType?: string;
  duration?: string;
}

export default function Page() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { classType } = useClassTypeStore();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>(
    []
  );
  const [endHour, setEndHour] = useState("");
  const [manualEndHour, setManualEndHour] = useState("");

  const router = useRouter();
  const navigate = () => {
    router.back();
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch locations
        const locationsResponse = await fetch("/api/locations");
        if (!locationsResponse.ok) {
          throw new Error("Failed to fetch locations");
        }
        const locationsData = await locationsResponse.json();
        setLocations(locationsData);

        // Fetch instructors
        const instructorsResponse = await fetch("/api/instructors");
        if (!instructorsResponse.ok) {
          throw new Error("Failed to fetch instructors");
        }
        const instructorsData = await instructorsResponse.json();
        setInstructors(instructorsData);

        // Fetch classes
        const classesResponse = await fetch("/api/classes");
        if (!classesResponse.ok) {
          throw new Error("Failed to fetch classes");
        }
        const classesData = await classesResponse.json();
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load necessary data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update filtered instructors when location changes
  useEffect(() => {
    if (selectedLocation) {
      const location = locations.find((loc) => loc._id === selectedLocation);
      if (location && location.instructors) {
        const locationInstructors = instructors.filter((instructor) =>
          location.instructors.includes(instructor._id)
        );
        setFilteredInstructors(locationInstructors);
      } else {
        setFilteredInstructors([]);
      }
    } else {
      setFilteredInstructors(instructors);
    }
  }, [selectedLocation, locations, instructors]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: "",
      date: "",
      hour: "",
      classId: "",
      type: classType || "date",
      duration: "",
      instructorId: "",
    },
  });

  // Watch for location changes to filter instructors
  const watchedLocation = form.watch("locationId");
  useEffect(() => {
    setSelectedLocation(watchedLocation);

    // Reset instructor field when location changes
    if (watchedLocation) {
      form.setValue("instructorId", "");
    }
  }, [watchedLocation, form]);

  // Watch for class changes to set duration automatically based on length
  const watchedClassId = form.watch("classId");
  useEffect(() => {
    if (watchedClassId) {
      const selectedClass = classes.find((c) => c._id === watchedClassId);

      if (selectedClass) {
        // Update class type if it's defined
        if (selectedClass.classType) {
          form.setValue(
            "type",
            selectedClass.classType as "date" | "bdi" | "adi"
          );
        }

        // Set duration based on class length
        if (selectedClass.length) {
          // Map length (hours) to duration string format ("2h", "4h", "8h", "12h")
          let durationValue = "";

          if (selectedClass.length <= 2.5) {
            durationValue = "2h";
          } else if (selectedClass.length <= 5) {
            durationValue = "4h";
          } else if (selectedClass.length <= 10) {
            durationValue = "8h";
          } else {
            durationValue = "12h";
          }

          form.setValue("duration", durationValue);
        }
      }
    }
  }, [watchedClassId, classes, form]);

  // Watch for hour changes to calculate and show end hour
  const watchedHour = form.watch("hour");
  useEffect(() => {
    if (watchedHour && !manualEndHour) {
      const [h, m] = watchedHour.split(":");
      const startDate = new Date(2000, 0, 1, Number(h), Number(m));
      const endDate = addHours(startDate, 2);
      setEndHour(format(endDate, "HH:mm"));
    } else if (!watchedHour) {
      setEndHour("");
    }
  }, [watchedHour, manualEndHour]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const endHourStr = manualEndHour || endHour;
      const payload = { ...values, endHour: endHourStr };
      const response = await fetch("/api/ticket/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create ticket class");
      }

      toast.success("Ticket class created successfully");
      form.reset();
      router.push("/ticket");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while creating the ticket class";
      toast.error(errorMessage);
      console.error("Error creating ticket class:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">Create New Class</h1>
          <Button onClick={navigate} className="hover:scale-110">
            <ArrowLeftIcon size={16} />
          </Button>
        </div>
      </div>
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => {
                // Obtener la fecha actual en formato YYYY-MM-DD
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, "0");
                const day = String(today.getDate()).padStart(2, "0");
                const currentDate = `${year}-${month}-${day}`;

                return (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        min={currentDate} // Establece la fecha mínima como hoy
                        className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">
                      Cannot select dates before today
                    </p>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hour</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="time"
                      className="border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </FormControl>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">End hour:</span>
                    <Input
                      type="time"
                      value={manualEndHour || endHour}
                      onChange={e => setManualEndHour(e.target.value)}
                      className="w-28 text-xs"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60 overflow-y-auto">
                        {locations.map((location) => (
                          <SelectItem key={location._id} value={location._id}>
                            {location.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60 overflow-y-auto">
                        {classes.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedLocation}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            selectedLocation
                              ? "Select an instructor"
                              : "Select a location first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60 overflow-y-auto">
                        {filteredInstructors.length > 0 ? (
                          filteredInstructors.map((instructor) => (
                            <SelectItem
                              key={instructor._id}
                              value={instructor._id}
                            >
                              {instructor.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No instructors available for this location
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="bdi">BDI</SelectItem>
                        <SelectItem value="adi">ADI</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />{" "}
            {/* Duration field removed - now automatically set from class length */}
            <Button
              type="submit"
              className="bg-blue-500 text-white w-full"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Class"}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
