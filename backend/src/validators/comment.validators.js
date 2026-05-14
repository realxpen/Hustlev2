import { z } from "zod";

const postIdParams = z.object({
  id: z.string().trim().min(1),
});

export const createCommentSchema = z.object({
  params: postIdParams,
  query: z.object({}).optional(),
  body: z.object({
    body: z.string().trim().min(1).max(1000),
  }),
});

export const replyToCommentSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1),
  }),
  query: z.object({}).optional(),
  body: z.object({
    body: z.string().trim().min(1).max(1000),
  }),
});

export const listCommentsSchema = z.object({
  params: postIdParams,
  body: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).default(10),
    cursor: z.string().trim().optional(),
  }),
});
