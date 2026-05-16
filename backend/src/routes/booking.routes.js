import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * CREATE BOOKING (CLIENT ONLY)
 */
router.post("/:gigId", authenticateUser, async (req, res) => {
  try {
    const gigId = req.params.gigId;
    const { message } = req.body;

    // 1. Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Only clients can book
    if (!user.roles.includes("CLIENT")) {
      return res.status(403).json({
        success: false,
        message: "Only clients can book gigs",
      });
    }

    // 3. Get gig
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
    });

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found",
      });
    }

    // 4. Prevent self-booking
    if (gig.userId === user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot book your own gig",
      });
    }

    // 5. Wallet check
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.balance < gig.price) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // 6. Deduct money from client wallet (ESCROW LOCK)
    await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: wallet.balance - gig.price,
      },
    });

    // 7. Create booking
    const booking = await prisma.booking.create({
      data: {
        gigId,
        clientId: user.id,
        message,
        amount: gig.price,
        status: "PENDING",
      },
    });

    return res.json({
      success: true,
      message: "Booking created with escrow",
      data: booking,
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
 * GET HUSTLER BOOKINGS
 */
router.get("/my", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user.roles.includes("HUSTLER")) {
      return res.status(403).json({
        success: false,
        message: "Only hustlers can access this",
      });
    }

    const gigs = await prisma.gig.findMany({
      where: {
        userId: user.id,
      },
      include: {
        bookings: true,
      },
    });

    return res.json({
      success: true,
      data: gigs,
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
 * ACCEPT BOOKING
 */
router.put("/:bookingId/accept", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user.roles.includes("HUSTLER")) {
      return res.status(403).json({
        success: false,
        message: "Only hustlers can accept bookings",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { gig: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.gig.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Not your gig",
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "ACCEPTED" },
    });

    return res.json({
      success: true,
      message: "Booking accepted",
      data: updated,
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
 * REJECT BOOKING
 */
router.put("/:bookingId/reject", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user.roles.includes("HUSTLER")) {
      return res.status(403).json({
        success: false,
        message: "Only hustlers can reject bookings",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { gig: true },
    });

    if (!booking || booking.gig.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "REJECTED" },
    });

    return res.json({
      success: true,
      message: "Booking rejected",
      data: updated,
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
 * COMPLETE BOOKING + RELEASE FUNDS + PLATFORM COMMISSION
 */
router.post("/:bookingId/complete", authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user.roles.includes("HUSTLER")) {
      return res.status(403).json({
        success: false,
        message: "Only hustlers can complete jobs",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { gig: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.gig.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    if (booking.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Booking already completed",
      });
    }

    // Hustler wallet
    const hustlerWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    // Commission logic
    const platformFee = booking.amount * 0.1;
    const hustlerAmount = booking.amount * 0.9;

    // Pay hustler
    await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: hustlerWallet.balance + hustlerAmount,
      },
    });

    // Store platform revenue
    const platform = await prisma.platform.findFirst();

    if (platform) {
      await prisma.platform.update({
        where: { id: platform.id },
        data: {
          revenue: platform.revenue + platformFee,
        },
      });
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "COMPLETED",
      },
    });

    return res.json({
      success: true,
      message: "Job completed and funds released",
      data: {
        booking: updated,
        hustlerReceived: hustlerAmount,
        platformFee,
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

export default router;