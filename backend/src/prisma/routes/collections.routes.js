import { Router } from "express";
import { collectionController } from "../../controllers/collection.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { collectionIdSchema, createCollectionSchema } from "../../validators/collection.validators.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/", authenticate, validateRequest(createCollectionSchema), asyncHandler(collectionController.createCollection));
router.get("/", authenticate, asyncHandler(collectionController.listCollections));
router.get("/:id/posts", authenticate, validateRequest(collectionIdSchema), asyncHandler(collectionController.getCollectionPosts));

export default router;
