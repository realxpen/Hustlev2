import { Router } from "express";
import { verificationController } from "../controllers/verificationController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.get("/verification-status", authenticateJWT, verificationController.getStatus.bind(verificationController));
router.post("/verify/phone", authenticateJWT, verificationController.verifyPhone.bind(verificationController));
router.post("/verify/email", authenticateJWT, verificationController.verifyEmail.bind(verificationController));
router.post("/verify/identity", authenticateJWT, verificationController.verifyIdentity.bind(verificationController));
router.post("/verify/address", authenticateJWT, verificationController.verifyAddress.bind(verificationController));

export default router;
