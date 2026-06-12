import { Router } from "express";
import { ReferralController } from "../controllers/referralController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();
const referralController = new ReferralController();

// --- EXPLICITLY REQUESTED PARTNER CONTRACTS ---

// POST /referrals/create
router.post("/create", authenticateJWT, referralController.createReferral.bind(referralController));

// GET /referrals/stats
router.get("/stats", authenticateJWT, referralController.getStats.bind(referralController));

// POST /referrals/reward
router.post("/reward", authenticateJWT, referralController.rewardReferral.bind(referralController));


// --- BACKWARD COMPATIBILITY ENDPOINTS ---

// GET /referral/dashboard
router.get("/dashboard", authenticateJWT, referralController.getStats.bind(referralController));

// POST /referral/invite
router.post("/invite", authenticateJWT, referralController.createReferral.bind(referralController));

// POST /referral/simulate-join
router.post("/simulate-join", authenticateJWT, referralController.rewardReferral.bind(referralController));

// POST /referral/payout
router.post("/payout", authenticateJWT, referralController.claimPayout.bind(referralController));

export default router;
