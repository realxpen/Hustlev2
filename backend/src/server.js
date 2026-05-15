import express from "express";
import cors from "cors";
import morgan from "morgan";


import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import roleRoutes from "./routes/role.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import postRoutes from "./routes/post.routes.js";
import feedRoutes from "./routes/feed.routes.js";

const app = express();

/**
 * MUST BE BEFORE ROUTES
 */
app.use(cors());
app.use(express.json()); // 🔥 REQUIRED
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log("🔥 CONTENT TYPE:", req.headers["content-type"]);
  console.log("🔥 BODY:", req.body);
  next();
});

app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/admin", adminRoutes);
app.use("/media", mediaRoutes);
app.use("/posts", postRoutes);
app.use("/feed", feedRoutes);

// test route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Hustle backend running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(5000, () => {
  console.log("Hustle backend listening on http://localhost:5000");
});