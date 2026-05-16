import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET MY WALLET
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    return res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/create", authenticateUser, async (req, res) => {
  try {
    const existing = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });

    if (existing) {
      return res.json({
        success: true,
        message: "Wallet already exists",
        data: existing,
      });
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: req.user.userId,
        balance: 0,
      },
    });

    return res.json({
      success: true,
      message: "Wallet created",
      data: wallet,
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
 * FUND WALLET (DEPOSIT MONEY)
 */
router.post("/fund", authenticateUser, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { userId: req.user.userId },
      data: {
        balance: wallet.balance + amount,
      },
    });

    return res.json({
      success: true,
      message: "Wallet funded successfully",
      data: updatedWallet,
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
