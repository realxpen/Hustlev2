import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * CREATE POST
 */
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { mediaUrl, publicId, caption, type } = req.body;

    if (!mediaUrl || !type) {
      return res.status(400).json({
        success: false,
        message: "mediaUrl and type are required",
      });
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.userId,
        mediaUrl,
        publicId,
        caption,
        type,
      },
    });

    res.json({
      success: true,
      message: "Post created",
      data: post,
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