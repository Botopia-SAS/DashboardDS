// InstructorBasicInfo.tsx
// Renderiza los campos de información básica del instructor (nombre, usuario, email, etc).

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import ImageUpload from "../custom ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";

interface InstructorBasicInfoProps {
  form: UseFormReturn<any>;
  generatePassword: () => void;
}

const InstructorBasicInfo = ({ form, generatePassword }: InstructorBasicInfoProps) => {
  return (
    <>
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

      <div className="flex gap-28">
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

        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo</FormLabel>
              <FormControl>
                <ImageUpload
                  value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                  onChange={(url) => field.onChange(url)}
                  onRemove={() => field.onChange("")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-24">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
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
              <div className="flex gap-2">
                <FormControl>
                  <Input type="password" placeholder="Enter password" {...field} />
                </FormControl>
                <Button type="button" onClick={generatePassword} className="bg-blue-600 text-white">
                  Generate
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default InstructorBasicInfo; 