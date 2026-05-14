import { z } from "zod";

export const createCollectionSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(240).optional(),
  }),
});

export const collectionIdSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).default(15).optional(),
    cursor: z.string().trim().optional(),
  }),
});
