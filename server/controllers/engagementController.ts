import { Request, Response } from 'express';
import { engagementService } from '../services/engagementService';
import { validateEngagementAction, validateReportAction } from '../validation/engagementValidation';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

class EngagementController {
  
  // POST /engagement/like
  public trackLike(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.postId) {
      res.status(400).json({ success: false, error: error || "postId required" });
      return;
    }
    engagementService.trackLike(userId, value.postId);
    res.status(200).json({ success: true });
  }

  // DELETE /engagement/like
  public removeLike(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.postId) {
      res.status(400).json({ success: false, error: error || "postId required" });
      return;
    }
    engagementService.removeLike(userId, value.postId);
    res.status(200).json({ success: true });
  }

  // POST /engagement/save
  public trackSave(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.postId) {
      res.status(400).json({ success: false, error: error || "postId required" });
      return;
    }
    engagementService.trackSave(userId, value.postId);
    res.status(200).json({ success: true });
  }

  // DELETE /engagement/save
  public removeSave(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.postId) {
      res.status(400).json({ success: false, error: error || "postId required" });
      return;
    }
    engagementService.removeSave(userId, value.postId);
    res.status(200).json({ success: true });
  }

  // POST /engagement/follow
  public trackFollow(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.creatorId) {
      res.status(400).json({ success: false, error: error || "creatorId required" });
      return;
    }
    engagementService.trackFollow(userId, value.creatorId);
    res.status(200).json({ success: true });
  }

  // DELETE /engagement/follow
  public removeFollow(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.creatorId) {
      res.status(400).json({ success: false, error: error || "creatorId required" });
      return;
    }
    engagementService.removeFollow(userId, value.creatorId);
    res.status(200).json({ success: true });
  }

  // POST /engagement/share
  public trackShare(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.postId) {
      res.status(400).json({ success: false, error: error || "postId required" });
      return;
    }
    engagementService.trackShare(userId, value.postId);
    res.status(200).json({ success: true });
  }

  // POST /engagement/not-interested
  public trackNotInterested(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateEngagementAction(req.body);
    if (error || !value?.postId) {
      res.status(400).json({ success: false, error: error || "postId required" });
      return;
    }
    engagementService.trackNotInterested(userId, value.postId);
    res.status(200).json({ success: true });
  }

  // POST /engagement/report
  public trackReport(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId || "anonymous-user";
    const { error, value } = validateReportAction(req.body);
    if (error || !value) {
      res.status(400).json({ success: false, error });
      return;
    }
    engagementService.trackReport(userId, value.targetId, value.targetType, value.reason);
    res.status(200).json({ success: true });
  }
}

export const engagementController = new EngagementController();
