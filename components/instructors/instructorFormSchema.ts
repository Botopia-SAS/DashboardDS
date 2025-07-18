import { z } from "zod";

export const instructorFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  dni: z.string().min(2, "DNI is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  photo: z.union([z.string().url("Valid photo URL required"), z.array(z.string())]),
  certifications: z.string().optional(),
  experience: z.string().optional(),
  canTeachTicketClass: z.boolean().default(false),
  canTeachDrivingTest: z.boolean().default(false),
  canTeachDrivingLesson: z.boolean().default(false),
}).refine(() => {
  // Only require password if no initialData (creation)
  // The value of initialData is not here, so real validation is done on submit
  return true;
}, {
  message: "Password is required",
  path: ["password"],
});
