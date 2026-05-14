import express from "express";
import morgan from "morgan";
import apiRoutes from "./routes/index.js";
import { env } from "./config/env.js";
import { authLimiter, corsMiddleware, helmetMiddleware, rateLimiter } from "./config/security.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  // Global middleware lives here so every future module inherits the same baseline.
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimiter);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  }

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Hustle backend foundation is running.",
      data: {
        service: "hustle-backend",
        version: "1.0.0",
      },
    });
  });

  app.use("/api/auth", authLimiter);
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
