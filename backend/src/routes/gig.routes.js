import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * CREATE GIG (HUSTLER ONLY)
 */
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { title, description, price, category, images } = req.body;

    // 🚨 ROLE CHECK (IMPORTANT)
const user = await prisma.user.findUnique({
  where: { id: req.user.userId },
});

if (!user || !user.roles.includes("HUSTLER")) {
  return res.status(403).json({
    success: false,
    message: "Only hustlers can create gigs",
  });
}

    if (!title || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        images: images || [],
        userId: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: "Gig created successfully",
      data: gig,
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
 * GET ALL GIGS
 */
router.get("/", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    const where = {};

    // category filter
    if (category) {
      where.category = category;
    }

    // search filter
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const gigs = await prisma.gig.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
            verified: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prisma.gig.count({ where });

    return res.json({
      success: true,
      data: gigs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
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
 * GET SINGLE GIG
 */
router.get("/:id", async (req, res) => {
  try {
    const gig = await prisma.gig.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    return res.json({
      success: true,
      data: gig,
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