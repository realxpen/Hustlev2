import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .object({
      username: z.string().trim().min(3).max(40).optional(),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9]{7,15}$/, "Phone number must contain 7 to 15 digits.")
        .optional()
        .nullable(),
      profilePhoto: z.string().trim().url().optional().nullable(),
      bio: z.string().trim().max(280).optional().nullable(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one profile field must be provided.",
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
