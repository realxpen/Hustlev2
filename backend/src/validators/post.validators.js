import { z } from "zod";

function parseJson(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}

function parseStringArray(value) {
  const parsed = parseJson(value);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return parsed;
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return value;
}

const postIdParams = z.object({
  id: z.string().trim().min(1),
});

const attachmentSchema = z.object({
  type: z.enum(["service", "product", "training"]),
  entityId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(150),
  subtitle: z.string().trim().max(150).optional(),
  thumbnailUrl: z.string().trim().url().optional().nullable(),
  priceMinor: z.number().int().nonnegative().optional(),
  currency: z.string().trim().max(10).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const audioSchema = z.object({
  title: z.string().trim().max(160).optional(),
  artist: z.string().trim().max(160).optional(),
  url: z.string().trim().url().optional(),
});

const externalMediaSchema = z.object({
  url: z.string().trim().url(),
  mediaType: z.enum(["image", "video"]),
  thumbnailUrl: z.string().trim().url().optional().nullable(),
  mimeType: z.string().trim().max(120).optional(),
  format: z.string().trim().max(50).optional(),
  publicId: z.string().trim().max(255).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().optional(),
  bytes: z.number().int().positive().optional(),
  altText: z.string().trim().max(160).optional(),
});

export const createPostSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    type: z.enum(["video", "image", "text", "mixed"]).optional(),
    caption: z.string().trim().max(2200).optional(),
    hashtags: z.preprocess(parseStringArray, z.array(z.string().trim().min(1).max(50)).max(25)).optional(),
    visibility: z.enum(["public", "followers", "private"]).default("public"),
    allowComments: z.preprocess(parseBoolean, z.boolean()).default(true),
    audio: z.preprocess(parseJson, audioSchema.optional()),
    attachment: z.preprocess(parseJson, attachmentSchema.optional()),
    media: z.preprocess(parseJson, z.array(externalMediaSchema).max(10)).optional(),
  }),
});

export const postIdSchema = z.object({
  params: postIdParams,
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const repostSchema = z.object({
  params: postIdParams,
  query: z.object({}).optional(),
  body: z.object({
    caption: z.string().trim().max(2200).optional(),
    visibility: z.enum(["public", "followers", "private"]).default("public"),
  }),
});

export const savePostSchema = z.object({
  params: postIdParams,
  query: z.object({}).optional(),
  body: z.object({
    collectionId: z.string().trim().min(1).optional(),
  }),
});

export const unsavePostSchema = z.object({
  params: postIdParams,
  body: z.object({}).optional(),
  query: z.object({
    collectionId: z.string().trim().min(1).optional(),
  }),
});
