import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * TOGGLE LIKE
 */
router.post("/:postId", authenticateUser, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    // If already liked → remove like
    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      return res.json({
        success: true,
        message: "Post unliked",
      });
    }

    // If not liked → create like
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    res.json({
      success: true,
      message: "Post liked",
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