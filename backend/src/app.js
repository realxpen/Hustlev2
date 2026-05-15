import express from "express";
import morgan from "morgan";
import passport from "passport";
import apiRoutes from "./prisma/routes/index.js";
import oauthRoutes from "./prisma/routes/oauth.routes.js";
import { env } from "./config/env.js";
import { setupPassport } from "./config/passport.js";
import { authLimiter, corsMiddleware, helmetMiddleware, rateLimiter } from "./config/security.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  setupPassport();

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimiter);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());

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
  app.use("/api/oauth", oauthRoutes);
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
