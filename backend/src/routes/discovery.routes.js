import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * DISCOVER HUSTLERS
 */
router.get("/", async (req, res) => {
  try {
    const {
      search,
      skill,
      profession,
      location,
    } = req.query;

    const users = await prisma.user.findMany({
      where: {
        role: "HUSTLER",

        AND: [
          search
            ? {
                OR: [
                  {
                    fullName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    username: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},

          skill
            ? {
                skills: {
                  has: skill,
                },
              }
            : {},

          profession
            ? {
                profession: {
                  contains: profession,
                  mode: "insensitive",
                },
              }
            : {},

          location
            ? {
                location: {
                  contains: location,
                  mode: "insensitive",
                },
              }
            : {},
        ],
      },

      select: {
        id: true,
        fullName: true,
        username: true,
        bio: true,
        avatar: true,
        location: true,
        profession: true,
        skills: true,
        verified: true,
      },
    });

    res.json({
      success: true,
      message: "Discovery results loaded",
      data: users,
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