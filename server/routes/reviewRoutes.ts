import { Router } from "express";
import { reviewController } from "../controllers/reviewController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authenticateJWT, reviewController.createReview.bind(reviewController));
router.put("/", authenticateJWT, reviewController.updateReview.bind(reviewController));
router.get("/provider/:id/reviews", reviewController.getProviderReviews.bind(reviewController));

export default router;
