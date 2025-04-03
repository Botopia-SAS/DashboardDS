/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox } from "../ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

export default function LiscenseInformation({form, hasLicense}: { form: any, hasLicense: boolean }) {
  return (
    <>
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
    </>
  );
}
