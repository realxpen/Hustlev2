import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET ALL ROLE REQUESTS
 */
router.get("/role-requests", authenticateUser, async (req, res) => {
  const requests = await prisma.roleRequest.findMany({
    include: { user: true },
  });

  res.json({
    success: true,
    data: requests,
  });
});

/**
 * APPROVE ROLE REQUEST
 */
router.post("/approve/:id", authenticateUser, async (req, res) => {
  const request = await prisma.roleRequest.findUnique({
    where: { id: req.params.id },
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "Request not found",
    });
  }

  // update user role
  await prisma.user.update({
    where: { id: request.userId },
    data: { role: request.requestedRole },
  });

  // update request status
  await prisma.roleRequest.update({
    where: { id: req.params.id },
    data: { status: "APPROVED" },
  });

  res.json({
    success: true,
    message: "Role upgraded successfully",
  });
});

export default router;