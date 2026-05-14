import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { userIdParamSchema } from "../modules/users/user.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", authenticate, asyncHandler(userController.me));
router.get("/:id", authenticate, validateRequest(userIdParamSchema), asyncHandler(userController.getById));

export default router;
