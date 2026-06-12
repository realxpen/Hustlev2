import { Router } from "express";
import { bookingController } from "../controllers/bookingController";
import { extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// POST /booking -> Creates a new contract request / proposal
router.post("/", extractPassiveUser, (req, res) => bookingController.createBooking(req, res));

// POST /booking/accept -> Provider confirms and locks escrow
router.post("/accept", extractPassiveUser, (req, res) => bookingController.acceptBooking(req, res));

// POST /booking/start -> Provider signals commenced work
router.post("/start", extractPassiveUser, (req, res) => bookingController.startBooking(req, res));

// POST /booking/deliver -> Provider registers deliverables / uploads files
router.post("/deliver", extractPassiveUser, (req, res) => bookingController.deliverBooking(req, res));

// POST /booking/complete -> Clients signs off and releases held payment 
router.post("/complete", extractPassiveUser, (req, res) => bookingController.completeBooking(req, res));

// POST /booking/cancel -> Void contract and refund client
router.post("/cancel", extractPassiveUser, (req, res) => bookingController.cancelBooking(req, res));

// POST /booking/dispute -> File a dispute / escrow locked for resolution
router.post("/dispute", extractPassiveUser, (req, res) => bookingController.disputeBooking(req, res));

// GET /booking/events/:bookingId -> Fetch all audit event-driven logs
router.get("/events/:bookingId", extractPassiveUser, (req, res) => bookingController.getBookingLogs(req, res));

export default router;
