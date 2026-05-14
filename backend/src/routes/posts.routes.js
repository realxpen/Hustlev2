import { Router } from "express";
import { commentController } from "../controllers/comment.controller.js";
import { postController } from "../controllers/post.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadPostFiles } from "../middleware/upload.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { commentLimiter, engagementLimiter, postCreationLimiter } from "../config/security.js";
import {
  createPostSchema,
  postIdSchema,
  repostSchema,
  savePostSchema,
  unsavePostSchema,
} from "../validators/post.validators.js";
import { createCommentSchema, listCommentsSchema } from "../validators/comment.validators.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post(
  "/",
  authenticate,
  postCreationLimiter,
  uploadPostFiles,
  validateRequest(createPostSchema),
  asyncHandler(postController.createPost),
);

router.get("/:id", authenticate, validateRequest(postIdSchema), asyncHandler(postController.getPostById));
router.post("/:id/like", authenticate, engagementLimiter, validateRequest(postIdSchema), asyncHandler(postController.likePost));
router.delete("/:id/like", authenticate, engagementLimiter, validateRequest(postIdSchema), asyncHandler(postController.unlikePost));
router.post(
  "/:id/comment",
  authenticate,
  commentLimiter,
  validateRequest(createCommentSchema),
  asyncHandler(commentController.createCommentOnPost),
);
router.get(
  "/:id/comments",
  authenticate,
  validateRequest(listCommentsSchema),
  asyncHandler(commentController.listCommentsForPost),
);
router.post("/:id/repost", authenticate, engagementLimiter, validateRequest(repostSchema), asyncHandler(postController.repostPost));
router.delete("/:id/repost", authenticate, engagementLimiter, validateRequest(postIdSchema), asyncHandler(postController.undoRepost));
router.post("/:id/save", authenticate, engagementLimiter, validateRequest(savePostSchema), asyncHandler(postController.savePost));
router.delete("/:id/save", authenticate, engagementLimiter, validateRequest(unsavePostSchema), asyncHandler(postController.unsavePost));

export default router;
