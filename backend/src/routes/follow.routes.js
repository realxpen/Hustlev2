import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * FOLLOW / UNFOLLOW USER
 */
router.post("/:userId", authenticateUser, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    // UNFOLLOW
    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return res.json({
        success: true,
        message: "User unfollowed",
      });
    }

    // FOLLOW
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    res.json({
      success: true,
      message: "User followed",
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
 * GET FOLLOWERS
 */
router.get("/followers/:userId", async (req, res) => {
  try {
    const followers = await prisma.follow.findMany({
      where: {
        followingId: req.params.userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: followers,
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
 * GET FOLLOWING
 */
router.get("/following/:userId", async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: {
        followerId: req.params.userId,
      },
      include: {
        following: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: following,
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