/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import RelativeInformation from "./RelativeInformation";

interface Course {
  _id: string;
  locationId: string;
  date: string;
  hour: string;
  classId: string;
  instructorId: string;
  students: string[];
  duration: string;
  type: string;
  __v: number;
  locationName: string;
}

export default function RegisterAndPaymentInformation({
  form,
  courses,
  courseType,
}: {
  form: any;
  courses: Course[];
  courseType: string;
}) {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  useEffect(() => {
    setFilteredCourses(courses.filter((c) => c.type === courseType));
  }, [courseType, courses]);
  return (
    <>
      <RelativeInformation form={form} courseType={courseType} />
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
                  {filteredCourses.map((c) => (
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
                      | {c?.locationName} | {c.duration} |{" "}
                      {c.type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Payment Information
        </h2>
      </div>
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
                    <SelectItem value="Master Card">Master Card</SelectItem>
                    <SelectItem value="Money Order">Money Order</SelectItem>
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
    </>
  );
}
