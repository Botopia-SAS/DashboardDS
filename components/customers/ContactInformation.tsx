/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

export default function ContactInfromation({
  form,
  initialData,
}: {
  form: any;
  initialData?: any;
}) {
  return (
    <>
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
              <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
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
    </>
  );
}
