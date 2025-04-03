/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

export default function AddressInformation({ form }: { form: any }) {
  return (
    <>
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
              <FormLabel className="text-gray-700 font-medium">City</FormLabel>
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
              <FormLabel className="text-gray-700 font-medium">State</FormLabel>
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
    </>
  );
}
