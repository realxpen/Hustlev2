import { Router, Response, NextFunction } from "express";
import multer from "multer";
import { contentController } from "../controllers/contentController";
import { AuthenticatedRequest, extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// Standard Multer configuration for secure RAM buffering before compression
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 45 * 1024 * 1024 // 45 MB safety limit matching mobile video loops
  }
});

// 1. POST /content/video - Upload and compress a vertical/horizontal trade video
router.post(
  "/video",
  extractPassiveUser,
  upload.single("video"),
  (req, res) => contentController.uploadVideo(req as AuthenticatedRequest, res)
);

// 2. POST /content/image - Upload and optimize a trade image or cover art 
router.post(
  "/image",
  extractPassiveUser,
  upload.single("image"),
  (req, res) => contentController.uploadImage(req as AuthenticatedRequest, res)
);

// 3. POST /content/publish - Bind media coordinates, tag elements, write to profile and discovery carousel
router.post(
  "/publish",
  extractPassiveUser,
  (req, res) => contentController.publishContent(req as AuthenticatedRequest, res)
);

// 4. GET /content/:id - Resolve localized profiles, tag sets, files for one content ID
router.get(
  "/:id",
  extractPassiveUser,
  (req, res) => contentController.getPostDetails(req as AuthenticatedRequest, res)
);

// 5. DELETE /content/:id - Prune a published transaction/reels item from indices
router.delete(
  "/:id",
  extractPassiveUser,
  (req, res) => contentController.deletePost(req as AuthenticatedRequest, res)
);

// --- DRAFT ROUTES ---
// 6. POST /content/draft - Save or update an unfinished post (auto-save capability)
router.post(
  "/draft",
  extractPassiveUser,
  (req, res) => contentController.saveDraft(req as AuthenticatedRequest, res)
);

// 7. GET /content/drafts - Load all drafts for current creator
router.get(
  "/drafts",
  extractPassiveUser,
  (req, res) => contentController.listDrafts(req as AuthenticatedRequest, res)
);

// 8. GET /content/draft/:id - Load specific incomplete draft
router.get(
  "/draft/:id",
  extractPassiveUser,
  (req, res) => contentController.getDraft(req as AuthenticatedRequest, res)
);

// --- ENGAGEMENT ROUTES ---
// 11. POST /content/:id/engage - Like, Share, Save, Not Interested, Report
router.post(
  "/:id/engage",
  extractPassiveUser,
  (req, res) => contentController.handleEngagement(req as AuthenticatedRequest, res)
);

export default router;
