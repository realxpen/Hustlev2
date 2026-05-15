import { Router } from "express";
import authRoutes from "../../routes/auth.routes.js";
import commentsRoutes from "./comments.routes.js";
import collectionsRoutes from "./collections.routes.js";
import feedRoutes from "./feed.routes.js";
import postsRoutes from "./posts.routes.js";
import usersRoutes from "./users.routes.js";
import profileRoutes from "./profile.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Hustle API is healthy.",
  });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/profile", profileRoutes);
router.use("/feed", feedRoutes);
router.use("/posts", postsRoutes);
router.use("/comments", commentsRoutes);
router.use("/collections", collectionsRoutes);

export default router;
