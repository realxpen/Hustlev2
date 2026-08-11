import { Router } from "express";
import { applicationController } from "../controllers/applicationController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/apply", authenticateJWT, applicationController.apply.bind(applicationController));
router.get("/application", authenticateJWT, applicationController.getApplication.bind(applicationController));
router.post("/application/update", authenticateJWT, applicationController.updateApplication.bind(applicationController));

// Admin routes
router.post("/application/:id/status", authenticateJWT, applicationController.setStatus.bind(applicationController));

export default router;
