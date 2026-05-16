import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { createNotification } from "../utils/notification.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ADMIN MIDDLEWARE
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.roles.includes("ADMIN")) {
      return res.status(403).json({
        success: false,
        message: "Admin only access",
      });
    }

    next();
  } catch (error) {
    console.error("ADMIN MIDDLEWARE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * GET ALL ROLE REQUESTS (ADMIN ONLY)
 */
router.get("/role-requests", authenticateUser, isAdmin, async (req, res) => {
  try {
    const requests = await prisma.roleRequest.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("ROLE REQUESTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * APPROVE ROLE REQUEST (ADMIN ONLY)
 */
router.post("/approve/:id", authenticateUser, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.roleRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: request.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // prevent duplicate roles
    const updatedRoles = [...new Set([...user.roles, request.requestedRole])];

    // update user roles FIRST
    await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: updatedRoles,
      },
    });

    // update request status
    await prisma.roleRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // notification
    await createNotification({
      userId: user.id,
      type: "ROLE_APPROVED",
      message: `Your ${request.requestedRole} request was approved`,
    });

    return res.json({
      success: true,
      message: "Role upgraded successfully",
    });
  } catch (error) {
    console.error("APPROVE ROLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * ADMIN DASHBOARD STATS
 */
router.get("/dashboard", authenticateUser, isAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();

    const totalHustlers = await prisma.user.count({
      where: {
        roles: {
          has: "HUSTLER",
        },
      },
    });

    const totalGigs = await prisma.gig.count();

    const totalBookings = await prisma.booking.count();

    const pendingRequests = await prisma.roleRequest.count({
      where: {
        status: "PENDING",
      },
    });

    const platform = await prisma.platform.findFirst();

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalHustlers,
        totalGigs,
        totalBookings,
        pendingRequests,
        revenue: platform?.revenue ?? 0,
      },
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;