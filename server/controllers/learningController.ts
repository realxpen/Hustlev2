import { Request, Response } from "express";
import { LearningService } from "../services/learningService";

const learningService = new LearningService();

export class LearningController {
  
  /**
   * POST /learning/progress
   * Updates progress for a specified lesson, computes newly earned XP,
   * checks for path completion milestones.
   */
  public async recordProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.body.userId || "test-client-id";
      const { lessonId } = req.body;

      if (!lessonId) {
        return res.status(400).json({ success: false, error: "lessonId parameter is required" });
      }

      const result = await learningService.recordProgress(userId, lessonId);
      return res.json({
        success: true,
        message: "Lesson progress updated successfully",
        data: {
          progress: result.progress,
          xpEarned: result.xpEarned,
          newlyCompletedPath: result.newlyCompletedPath
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /learning/paths
   * Returns skill paths, sorted and populated with progressive learning stages 
   * and progress tracking percentage counters.
   */
  public async getPaths(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.query.userId || "test-client-id";
      const paths = await learningService.getSkillPathsWithMetrics(userId);
      return res.json({
        success: true,
        count: paths.length,
        paths
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /learning/recommendations
   * Serves personalized sequence recommendations based on the user's unfinished 
   * structural courses and level pacing milestones.
   */
  public async getRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.query.userId || "test-client-id";
      const recommendations = await learningService.getRecommendations(userId);
      return res.json({
        success: true,
        count: recommendations.length,
        recommendations
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /learning/dashboard
   * Returns total XP, lesson completions, and progress details.
   */
  public async getDashboard(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.query.userId || "test-client-id";
      const summary = await learningService.getDashboardSummary(userId);
      return res.json({
        success: true,
        dashboard: summary
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /learning/paths/:pathId/follow
   * Enrolls user in a specific path workflow tracking.
   */
  public async followPath(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.body.userId || "test-client-id";
      const pathId = String(req.params.pathId);

      if (!pathId) {
        return res.status(400).json({ success: false, error: "pathId path parameter is required" });
      }

      const followed = await learningService.subscribeToPath(userId, pathId);
      return res.json({
        success: true,
        message: "Successfully subscribed to study pathway",
        followed
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /learning/paths/:pathId/unfollow
   * Unenrolls/unsubscribes from a dynamic path profile tracker.
   */
  public async unfollowPath(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.body.userId || "test-client-id";
      const pathId = String(req.params.pathId);

      if (!pathId) {
        return res.status(400).json({ success: false, error: "pathId path parameter is required" });
      }

      const followed = await learningService.unsubscribeFromPath(userId, pathId);
      return res.json({
        success: true,
        message: "Successfully unsubscribed from study pathway",
        followed
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
