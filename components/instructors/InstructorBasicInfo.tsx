// InstructorBasicInfo.tsx
// Renderiza los campos de información básica del instructor (nombre, usuario, email, etc).

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import ImageUpload from "../custom ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import type { FieldValues } from "react-hook-form";

// URL de la imagen por defecto
const DEFAULT_AVATAR_URL = "https://res.cloudinary.com/dukysmhpu/image/upload/v1758735081/avatar_dknrvq.png";

interface InstructorBasicInfoProps {
  form: UseFormReturn<FieldValues>;
  generatePassword: () => void;
}

const InstructorBasicInfo = ({ form, generatePassword }: InstructorBasicInfoProps) => {
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Efecto para asignar imagen por defecto si no hay imagen
  useEffect(() => {
    const currentPhoto = form.getValues('photo');
    if (!currentPhoto || (Array.isArray(currentPhoto) && currentPhoto.length === 0)) {
      form.setValue('photo', DEFAULT_AVATAR_URL);
    }
  }, [form]);

  return (
    <div className="space-y-6">
      {/* Photo - Centered at top */}
      <div className="flex justify-center w-full">
        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem className="w-full max-w-sm">
              <FormLabel className="text-center block">Photo (Optional)</FormLabel>
              <FormControl>
                <div className="flex justify-center flex-col items-center gap-4">
                  {!field.value || (Array.isArray(field.value) && field.value.length === 0) ? (
                    <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center relative">
                          <Image 
                            src={DEFAULT_AVATAR_URL}
                            alt="Default Avatar" 
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-sm text-gray-500">Default Avatar</p>
                      </div>
                    </div>
                  ) : null}
                  <ImageUpload
                    value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                    onChange={(url) => field.onChange(url || DEFAULT_AVATAR_URL)}
                    onRemove={() => field.onChange(DEFAULT_AVATAR_URL)}
                    defaultImageUrl={DEFAULT_AVATAR_URL}
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

      {/* Name */}
      <div className="max-w-md mx-auto">
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