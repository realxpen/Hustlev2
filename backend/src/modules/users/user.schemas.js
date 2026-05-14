import { z } from "zod";

export const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional(),
});
