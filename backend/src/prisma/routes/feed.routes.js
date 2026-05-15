import { Router } from "express";
import { feedController } from "../../controllers/feed.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { getFeedSchema } from "../../validators/feed.validators.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", authenticate, validateRequest(getFeedSchema), asyncHandler(feedController.getFeed));

export default router;
