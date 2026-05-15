import { Router } from "express";
import { profileController } from "../../controllers/profile.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from "../../modules/profile/profile.schemas.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/me", authenticate, asyncHandler(profileController.getMyProfile));
router.patch("/me", authenticate, validateRequest(updateProfileSchema), asyncHandler(profileController.updateMyProfile));

export default router;
