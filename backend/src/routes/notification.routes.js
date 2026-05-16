import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET MY NOTIFICATIONS
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * MARK AS READ
 */
router.put("/:id/read", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. check if notification exists AND belongs to user (IMPORTANT SECURITY FIX)
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    // 2. mark as read
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        read: true,
      },
    });

    return res.json({
      success: true,
      message: "Notification marked as read",
      data: updated,
    });
  } catch (error) {
    console.error("MARK READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;