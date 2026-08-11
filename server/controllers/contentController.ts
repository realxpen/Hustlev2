import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { contentService } from "../services/contentService";
import { validatePublishContent } from "../validation/contentValidation";

export class ContentController {
  
  /**
   * POST /content/video
   * Parses video files via Multer, extracts, and compresses
   */
  public async uploadVideo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No video file provided. Check your multipart form-data payload."
        });
        return;
      }

      // Check mime type safety
      if (!req.file.mimetype.startsWith("video/")) {
        res.status(400).json({
          success: false,
          error: `Invalid file mime format: '${req.file.mimetype}'. Expected video asset.`
        });
        return;
      }

      const media = await contentService.processUploadedVideo(req.file);

      res.status(200).json({
        success: true,
        message: "Video file parsed, compressed, and metadata indexed successfully",
        data: media
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Video upload pipeline failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Deep server pipeline error while transcoding video asset"
      });
    }
  }

  /**
   * POST /content/image
   * Parses image files via Multer, extracts, and optimizes
   */
  public async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No image file provided. Check your multipart form-data payload."
        });
        return;
      }

      // Check mime type safety
      if (!req.file.mimetype.startsWith("image/")) {
        res.status(400).json({
          success: false,
          error: `Invalid file mime format: '${req.file.mimetype}'. Expected image asset.`
        });
        return;
      }

      const media = await contentService.processUploadedImage(req.file);

      res.status(200).json({
        success: true,
        message: "Image file parsed, optimized, and thumbnail bound successfully",
        data: media
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Image upload pipeline failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Deep server pipeline error while optimizing image asset"
      });
    }
  }

  /**
   * POST /content/publish
   * Aggregates media descriptions, tags, location, and publishes Content post
   */
  public publishContent(req: AuthenticatedRequest, res: Response): void {
    try {
      const { error, value } = validatePublishContent(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      // Determine creator target
      // 1. Explicitly requested in request body
      // 2. Logged-in session credentials
      // 3. Fallback to active sandbox profile "creator-marcus" if testing guest/headless
      const defaultCreatorId = req.user?.userId || "creator-marcus";

      const post = contentService.publishContent(value, defaultCreatorId);

      res.status(201).json({
        success: true,
        message: "Your trade craftsmanship has been published and mapped live to the reels!",
        data: post
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Publish content pipeline failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to commit content publication to active indexes"
      });
    }
  }

  /**
   * GET /content/:id
   * Retrieves single Content post details
   */
  public getPostDetails(req: AuthenticatedRequest, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Content identifier path parameter required" });
        return;
      }

      const post = contentService.getPostDetails(id);
      if (!post) {
        res.status(404).json({
          success: false,
          error: `Content post with identifier ID '${id}' could not be resolved in central indices`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: post
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Details resolution pipeline failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Internal failure resolving requested metadata"
      });
    }
  }

  /**
   * DELETE /content/:id
   * Removes specific Content post from memory and profiles
   */
  public deletePost(req: AuthenticatedRequest, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Content identifier path parameter required" });
        return;
      }

      const succeeded = contentService.deletePost(id);
      if (!succeeded) {
        res.status(404).json({
          success: false,
          error: `Content post with ID '${id}' does not exist or has already been pruned`
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Content post successfully deleted and pruned from profiles and feeds"
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Pruning failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to complete post erasure routines"
      });
    }
  }
  /**
   * POST /content/draft
   * Creates or updates an auto-saved draft
   */
  public saveDraft(req: AuthenticatedRequest, res: Response): void {
    try {
      const creatorId = req.user?.userId || "creator-marcus"; // fallback
      const draft = contentService.createOrUpdateDraft(creatorId, req.body);
      
      res.status(200).json({
        success: true,
        message: "Draft successfully auto-saved",
        data: draft
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Draft save failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to commit draft to storage memory"
      });
    }
  }

  /**
   * GET /content/drafts
   * List all drafts for current user
   */
  public listDrafts(req: AuthenticatedRequest, res: Response): void {
    try {
      const creatorId = req.user?.userId || "creator-marcus"; // fallback
      const drafts = contentService.getUserDrafts(creatorId);
      
      res.status(200).json({
        success: true,
        data: drafts
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Draft fetch failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch user drafts list"
      });
    }
  }

  /**
   * GET /content/draft/:id
   * Get specific draft
   */
  public getDraft(req: AuthenticatedRequest, res: Response): void {
    try {
      const id = req.params.id as string;
      const draft = contentService.getDraft(id);
      
      if (!draft) {
        res.status(404).json({ success: false, error: "Draft not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: draft
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Draft fetch failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch draft"
      });
    }
  }

  // --- ENGAGEMENT ---
  
  /**
   * POST /content/:id/engage
   * Handle generic interactions like like, share, save, not_interested, report
   */
  public handleEngagement(req: AuthenticatedRequest, res: Response): void {
    try {
      const contentId = req.params.id as string;
      const userId = req.user?.userId || "guest";
      const payload = req.body; // Expects EngagementPayload

      if (!payload.action) {
        res.status(400).json({ success: false, error: "Engagement action type is required" });
        return;
      }

      contentService.trackEngagement(contentId, userId, payload);
      
      res.status(200).json({
        success: true,
        message: `Action ${payload.action} successfully tracked`
      });
    } catch (err: any) {
      console.error("[CONTENT-CONTROLLER] Track engagement failure:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to track engagement action"
      });
    }
  }
}

export const contentController = new ContentController();
