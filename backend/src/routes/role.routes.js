import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * APPLY FOR ROLE UPGRADE
 */
router.post("/apply", authenticateUser, async (req, res) => {
  try {
    const { role } = req.body;

    const request = await prisma.roleRequest.create({
      data: {
        userId: req.user.userId,
        requestedRole: role,
      },
    });

    return res.json({
      success: true,
      message: "Request submitted successfully",
      data: request,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;