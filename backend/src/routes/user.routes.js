import express from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", authenticateUser, async (req, res) => {
  return res.json({
    success: true,
    message: "Protected route working",
    data: {
      userId: req.user.userId,
      role: req.user.role,
      iat: req.user.iat,
      exp: req.user.exp,
    },
  });
});

export default router;
