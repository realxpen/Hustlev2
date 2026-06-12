import { Request, Response } from "express";
import { reviewService } from "../services/reviewService";

export class ReviewController {
  // POST /review
  public async createReview(req: Request, res: Response) {
    try {
      const clientId = (req as any).user?.userId || "test-client-id";
      const { bookingId, revieweeId, serviceId, overallRating, categories, content, mediaAttachments } = req.body;
      
      const review = await reviewService.createReview({
        reviewerId: clientId,
        revieweeId,
        bookingId,
        serviceId,
        overallRating: Number(overallRating),
        categories,
        content,
        mediaAttachments
      });
      
      res.json({ success: true, review });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /review
  public async updateReview(req: Request, res: Response) {
    try {
      const clientId = (req as any).user?.userId || "test-client-id";
      const { reviewId, overallRating, categories, content, mediaAttachments } = req.body;
      
      const review = await reviewService.updateReview(reviewId, clientId, {
        overallRating: Number(overallRating),
        categories,
        content,
        mediaAttachments
      });
      
      res.json({ success: true, review });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /provider/:id/reviews
  public async getProviderReviews(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const reviews = await reviewService.getProviderReviews(id as string, Number(page), Number(limit));
      const summary = await reviewService.getProviderSummary(id as string);
      
      res.json({ success: true, summary, reviews });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const reviewController = new ReviewController();
