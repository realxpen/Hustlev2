import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../modules/auth/auth.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), asyncHandler(authController.register));
router.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
