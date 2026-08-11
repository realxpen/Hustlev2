import { Request, Response } from "express";
import { feedService } from "../services/feedService";
import { 
  validateFeedQuery, 
  validatePostAction, 
  validatePostLike, 
  validatePostSave, 
  validatePostShare,
  validateHostFollow,
  validateNotInterestedAction
} from "../validation/feedValidation";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class FeedController {
  
  private _getFeedByType(req: AuthenticatedRequest, res: Response, feedType?: string): void {
    try {
      const { error, value } = validateFeedQuery(req.query);
      if (error) {
        res.status(400).json({ success: false, error });
        return;
      }

      // Read active userId if session exists, else fallback to guest to preserve stateful loops
      const userId = req.user?.userId || "guest-session-view";

      const feed = feedService.getRankedFeed({
        page: value.page || 1,
        limit: value.limit || 10,
        category: value.category,
        lat: value.lat,
        lng: value.lng,
        userId,
        feedType
      });

      res.status(200).json(feed);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || `Failed to load ${feedType || 'ranked'} feed` });
    }
  }

  // GET /feed
  public getFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'for-you');
  }

  // GET /feed/following
  public getFollowingFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'following');
  }

  // GET /feed/nearby
  public getNearbyFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'nearby');
  }

  // GET /feed/learning
  public getLearningFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'learning');
  }

  // GET /feed/services
  public getServicesFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'services');
  }

  // GET /feed/projects
  public getProjectsFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'projects');
  }

  // GET /feed/verified
  public getVerifiedFeed(req: AuthenticatedRequest, res: Response): void {
    this._getFeedByType(req, res, 'verified');
  }

  // POST /feed/view
  public trackView(req: Request, res: Response): void {
    try {
      const { error, value } = validatePostAction(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const succeeded = feedService.trackView(value.postId);
      if (!succeeded) {
        res.status(404).json({ success: false, error: "Feed item post not found" });
        return;
      }

      res.status(200).json({ success: true, message: "View metrics tracked successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Metrics logging pipeline error" });
    }
  }

  // POST /feed/not-interested
  public trackNotInterested(req: AuthenticatedRequest, res: Response): void {
    try {
      const { error, value } = validateNotInterestedAction(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const userId = req.user?.userId || "guest-session-view";
      feedService.trackNotInterested(userId, value.postId);

      res.status(200).json({ success: true, message: "Marked as not interested" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Not interested logging error" });
    }
  }

  // POST /feed/like
  public trackLike(req: Request, res: Response): void {
    try {
      const { error, value } = validatePostLike(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const outcome = feedService.trackLike(value.postId, value.liked);
      if (!outcome.success) {
        res.status(404).json({ success: false, error: "Feed item post not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: value.liked ? "Content liked successfully" : "Content unliked successfully",
        likes_count: outcome.likes_count
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Like tracking pipeline error" });
    }
  }

  // POST /feed/save
  public trackSave(req: Request, res: Response): void {
    try {
      const { error, value } = validatePostSave(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const outcome = feedService.trackSave(value.postId, value.saved);
      if (!outcome.success) {
        res.status(404).json({ success: false, error: "Feed item post not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: value.saved ? "Content bookmarked and saved successfully" : "Removed bookmark successfully",
        saves_count: outcome.saves_count
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Save tracking pipeline error" });
    }
  }

  // POST /feed/share
  public trackShare(req: Request, res: Response): void {
    try {
      const { error, value } = validatePostShare(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const outcome = feedService.trackShare(value.postId, value.target);
      if (!outcome.success) {
        res.status(404).json({ success: false, error: "Feed item post not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Share metrics tracked successfully",
        shares_count: outcome.shares_count
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Share tracking pipeline error" });
    }
  }

  // POST /feed/follow
  public trackFollow(req: AuthenticatedRequest, res: Response): void {
    try {
      const { error, value } = validateHostFollow(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      // Session auth user or fallback guest user
      const userId = req.user?.userId || "guest-session-view";

      const outcome = feedService.trackFollow(userId, value.targetUserId, value.follow);
      if (!outcome.success) {
        res.status(400).json({ success: false, error: "Follow configuration failed" });
        return;
      }

      res.status(200).json({
        success: true,
        message: value.follow ? "Social mapping following active" : "Following relationship removed",
        followed: outcome.followed
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Follow tracking pipeline error" });
    }
  }
}

export const feedController = new FeedController();
