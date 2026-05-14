import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";

function isAllowedOrigin(origin) {
  return !origin || env.clientOrigins.includes(origin);
}

export const socketCorsOptions = {
  origin: env.clientOrigins,
  credentials: true,
};

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
});

export const helmetMiddleware = helmet();

export const rateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

export const postCreationLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.postRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Post creation rate limit reached. Please slow down and try again shortly.",
  },
});

export const engagementLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.engagementRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many engagement actions. Please try again later.",
  },
});

export const commentLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.commentRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many comments sent. Please try again later.",
  },
});
