import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET MY PROFILE
 */
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        bio: true,
        avatar: true,
        location: true,
        profession: true,
        skills: true,
        roles: true,
        verified: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * UPDATE PROFILE
 */
router.put("/me", authenticateUser, async (req, res) => {
  console.log("USER ID:", req.user.userId);
  try {
    const {
      fullName,
      username,
      bio,
      avatar,
      location,
      profession,
      skills,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        fullName,
        username,
        bio,
        avatar,
        location,
        profession,
        skills,
      },
    });

    res.json({
      success: true,
      message: "Profile updated",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;