import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./modules/auth/auth.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Hustle backend is live 🚀" });
});

const PORT = process.env.PORT || 4000;

console.log("Auth routes loaded");

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});