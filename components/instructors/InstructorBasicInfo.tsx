// InstructorBasicInfo.tsx
// Renderiza los campos de información básica del instructor (nombre, usuario, email, etc).

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import ImageUpload from "../custom ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { FieldValues } from "react-hook-form";

interface InstructorBasicInfoProps {
  form: UseFormReturn<FieldValues>;
  generatePassword: () => void;
}

const InstructorBasicInfo = ({ form, generatePassword }: InstructorBasicInfoProps) => {
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Photo - Centered at top */}
      <div className="flex justify-center w-full">
        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem className="w-full max-w-sm">
              <FormLabel className="text-center block">Photo</FormLabel>
              <FormControl>
                <div className="flex justify-center">
                  <ImageUpload
                    value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                    onChange={(url) => field.onChange(url)}
                    onRemove={() => field.onChange("")}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Class Types Checkboxes - Moved up */}
      <div className="space-y-4">
        <FormLabel className="text-center block">Class Types</FormLabel>
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="canTeachTicketClass"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Ticket Class
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canTeachDrivingTest"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Driving Test
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canTeachDrivingLesson"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      Driving Lesson
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Name and DNI */}
      <div className="grid grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Instructor Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DNI</FormLabel>
              <FormControl>
                <Input placeholder="DNI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Experience and Certifications */}
      <div className="grid grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience</FormLabel>
              <FormControl>
                <Textarea placeholder="Experience (Optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="certifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certifications</FormLabel>
              <FormControl>
                <Textarea placeholder="Certifications (Optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Email and Password */}
      <div className="grid grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
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
              <div className="flex gap-2 items-center">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  onClick={generatePassword}
                  className="bg-blue-600 text-white"
                >
                  Generate
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default InstructorBasicInfo; 