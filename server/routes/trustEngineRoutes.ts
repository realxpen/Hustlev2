import { Router } from "express";
import { trustEngineController } from "../controllers/trustEngineController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.get("/trust-profile", authenticateJWT, trustEngineController.getTrustProfile.bind(trustEngineController));

export default router;
