import { z } from "zod";

export const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  dni: z.string().min(2, "DNI is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  photo: z.union([z.string().url("Valid photo URL required"), z.array(z.string())]),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  schedule: z
    .array(
      z.object({
        date: z.string(),
        start: z.string(),
        end: z.string(),
        booked: z.boolean().optional(),
        studentId: z.string().nullable().optional(),
        status: z.string().optional(),
      })
    )
    .optional(),
}).refine(() => {
  // Only require password if no initialData (creation)
  // The value of initialData is not here, so real validation is done on submit
  return true;
}, {
  message: "Password is required",
  path: ["password"],
});
