import { z } from "zod";
import { SELF_REGISTRATION_ROLES } from "../users/user.constants.js";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, "Phone number must contain 7 to 15 digits.")
  .optional();

export const registerSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(40),
    email: z.string().trim().email(),
    phone: phoneSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(72, "Password must be 72 characters or less."),
    role: z.enum(SELF_REGISTRATION_ROLES).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrUsername: z.string().trim().min(3),
    password: z.string().min(8),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required."),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address."),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, "Reset token is required."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(72, "Password must be 72 characters or less."),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    verificationToken: z.string().min(1, "Verification token is required."),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
