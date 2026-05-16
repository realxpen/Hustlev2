import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * APPLY FOR ROLE (HUSTLER / AGENT)
 */
router.post("/apply", authenticateUser, async (req, res) => {
  try {
    console.log("DECODED USER:", req.user);

    const { requestedRole } = req.body;
    const userId = req.user.userId;

    // validate role
    if (!["HUSTLER", "AGENT"].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role request",
      });
    }

    // check user exists
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User does not exist in database",
      });
    }

    // prevent duplicate request
    const existing = await prisma.roleRequest.findFirst({
      where: {
        userId,
        requestedRole,
        status: "PENDING",
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already applied for this role",
      });
    }

    // create request
    const request = await prisma.roleRequest.create({
      data: {
        requestedRole,
        userId,
      },
    });

    return res.json({
      success: true,
      message: "Role application submitted",
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

/**
 * GET MY ROLE REQUESTS
 */
router.get("/my-requests", authenticateUser, async (req, res) => {
  try {
    const requests = await prisma.roleRequest.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * APPROVE ROLE
 */
router.post("/approve/:id", authenticateUser, async (req, res) => {
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

    // update request status
    await prisma.roleRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
      },
    });

    // find user
    const user = await prisma.user.findUnique({
      where: {
        id: request.userId,
      },
    });

    // update roles
    const updatedRoles = [
      ...new Set([
        ...user.roles,
        request.requestedRole,
      ]),
    ];

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        roles: updatedRoles,
      },
    });

    // create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "ROLE_APPROVED",
        message: `Your ${request.requestedRole} role request was approved`,
      },
    });

    return res.json({
      success: true,
      message: "Role approved and assigned",
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