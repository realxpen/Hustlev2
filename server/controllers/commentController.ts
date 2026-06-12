import { Request, Response } from "express";
import { commentService } from "../services/commentService";
import {
  validateCreateComment,
  validateCreateReply,
  validateUpdateComment,
} from "../validation/commentValidation";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

class CommentController {
  // POST /comment
  public createComment(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { error, value } = validateCreateComment(req.body);
    if (error || !value) {
      res.status(400).json({ success: false, error });
      return;
    }

    try {
      const comment = commentService.createComment(
        value.contentId,
        userId,
        value.text,
        value.mentions || [],
      );
      res.status(201).json({ success: true, data: comment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // POST /reply
  public createReply(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { error, value } = validateCreateReply(req.body);
    if (error || !value) {
      res.status(400).json({ success: false, error });
      return;
    }

    try {
      const reply = commentService.createReply(
        value.commentId,
        userId,
        value.text,
        value.mentions || [],
      );
      res.status(201).json({ success: true, data: reply });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // PUT /comment
  public updateComment(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { error, value } = validateUpdateComment(req.body);
    if (error || !value) {
      res.status(400).json({ success: false, error });
      return;
    }

    try {
      const comment = commentService.updateComment(
        value.commentId,
        userId,
        value.text,
        value.isPinned,
      );
      res.status(200).json({ success: true, data: comment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  // DELETE /comment
  public deleteComment(req: AuthenticatedRequest, res: Response): void {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const commentId = req.body.commentId || req.query.commentId;
    if (!commentId) {
      res.status(400).json({ success: false, error: "commentId is required" });
      return;
    }

    try {
      const success = commentService.deleteComment(String(commentId), userId);
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ success: false, error: "Comment not found" });
      }
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  }

  // GET /content/:id/comments
  public getComments(req: AuthenticatedRequest, res: Response): void {
    const rawId = req.params.id;
    const contentId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!contentId) {
      res.status(400).json({ success: false, error: "contentId is required" });
      return;
    }

    try {
      const comments = commentService.getComments(contentId);
      res.status(200).json({ success: true, data: comments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const commentController = new CommentController();
