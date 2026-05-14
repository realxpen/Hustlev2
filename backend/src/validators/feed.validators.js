import { z } from "zod";

export const getFeedSchema = z.object({
  params: z.object({}).optional(),
  body: z.object({}).optional(),
  query: z.object({
    mode: z.enum(["latest", "recommended"]).default("latest"),
    limit: z.coerce.number().int().min(1).max(30).default(15),
    cursor: z.string().trim().optional(),
  }),
});
