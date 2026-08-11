import { Router } from "express";
import { escrowController } from "../controllers/escrowController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/fund", authenticateJWT, escrowController.fund.bind(escrowController));
router.post("/release", authenticateJWT, escrowController.release.bind(escrowController));
router.post("/refund", authenticateJWT, escrowController.refund.bind(escrowController));
router.post("/dispute", authenticateJWT, escrowController.dispute.bind(escrowController));

export default router;
