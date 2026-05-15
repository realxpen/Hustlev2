import { Router } from "express";
import { commentController } from "../../controllers/comment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { commentLimiter } from "../../config/security.js";
import { replyToCommentSchema } from "../../validators/comment.validators.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post(
  "/:id/reply",
  authenticate,
  commentLimiter,
  validateRequest(replyToCommentSchema),
  asyncHandler(commentController.replyToComment),
);

export default router;
