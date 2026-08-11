import { Router } from "express";
import { profileController } from "../controllers/profileController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

// PUT /profile - Update profile details (requires authenticating)
router.put("/", authenticateJWT, (req, res) => profileController.updateProfile(req, res));

// GET /profile/:id - Retrieve profile (with optional ?eager=true for optimized loading)
router.get("/:id", (req, res) => profileController.getProfile(req, res));

// GET /profile/:id/content - Retrieve user media content/posts
router.get("/:id/content", (req, res) => profileController.getProfileContent(req, res));

// GET /profile/:id/services - Retrieve services offered
router.get("/:id/services", (req, res) => profileController.getProfileServices(req, res));

// GET /profile/:id/reviews - Retrieve client reviews
router.get("/:id/reviews", (req, res) => profileController.getProfileReviews(req, res));

// GET /profile/:id/verifications - Retrieve active safety check badges
router.get("/:id/verifications", (req, res) => profileController.getProfileVerifications(req, res));

export default router;
