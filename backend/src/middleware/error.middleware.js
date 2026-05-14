import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error.";
  let details = error.details;

  if (error.code === "P2002") {
    statusCode = 409;
    const fieldName = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "field";
    message = `A record with this ${fieldName} already exists.`;
  }

  if (error.message === "Origin is not allowed by CORS.") {
    statusCode = 403;
    message = error.message;
  }

  if (error.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed.";
    details = error.flatten();
  }

  const response = {
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.nodeEnv !== "production" && error.stack ? { stack: error.stack } : {}),
  };

  res.status(statusCode).json(response);
}
