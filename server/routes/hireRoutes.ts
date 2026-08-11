import { Router } from "express";
import { hireController } from "../controllers/hireController";
import { extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// POST /hire/request - Initiates a new hiring escrow agreement
router.post("/request", extractPassiveUser, (req, res) => hireController.createHireRequest(req, res));

// GET /hire/:id - Fetch custom specifications of high priority contract
router.get("/:id", extractPassiveUser, (req, res) => hireController.getBookingDetails(req, res));

// POST /hire/cancel - Voids an active hiring agreement and releases held payouts back to clients
router.post("/cancel", extractPassiveUser, (req, res) => hireController.cancelHireContract(req, res));

export default router;
