import { Router } from "express";
import { LearningController } from "../controllers/learningController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();
const learningController = new LearningController();

// Progression logging
router.post("/progress", authenticateJWT, learningController.recordProgress.bind(learningController));

// Skill streams structure
router.get("/paths", authenticateJWT, learningController.getPaths.bind(learningController));

// Personalized curriculum recommendation
router.get("/recommendations", authenticateJWT, learningController.getRecommendations.bind(learningController));

// Dynamic user learner metrics
router.get("/dashboard", authenticateJWT, learningController.getDashboard.bind(learningController));

// Interactive follow/unfollow path subscriptions
router.post("/paths/:pathId/follow", authenticateJWT, learningController.followPath.bind(learningController));
router.post("/paths/:pathId/unfollow", authenticateJWT, learningController.unfollowPath.bind(learningController));

export default router;
