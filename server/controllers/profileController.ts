import { Request, Response } from "express";
import { profileService } from "../services/profileService";
import { validateProfileUpdate } from "../validation/profileValidation";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/**
 * Extracts the user ID from either intermediate middleware states or OAuth fallback headers
 */
function extractUserId(req: AuthenticatedRequest): string {
  if (req.user?.userId) {
    return req.user.userId;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }
  // Safe default fallback for preview/demo capabilities
  return "demo-hustler-id";
}

export class ProfileController {

  /**
   * GET /profile/:id
   * Fetches full profile with optional eager-loading optimizations
   */
  public getProfile(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Profile ID parameter is required" });
        return;
      }

      // Read query flags to check if client requested eager loads to optimize round-trips
      const includeContent = req.query.content === "true" || req.query.eager === "true";
      const includeServices = req.query.services === "true" || req.query.eager === "true";
      const includeReviews = req.query.reviews === "true" || req.query.eager === "true";
      const includeVerifications = req.query.verifications === "true" || req.query.eager === "true";

      const profile = profileService.getProfileById(id, {
        content: includeContent,
        services: includeServices,
        reviews: includeReviews,
        verifications: includeVerifications
      });

      res.status(200).json({
        success: true,
        message: "User profile loaded successfully",
        data: profile
      });
    } catch (err: any) {
      // Gracefully handle not found errors
      if (err.message && err.message.includes("was not found")) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      res.status(500).json({ success: false, error: err.message || "Failed to retrieve user profile" });
    }
  }

  /**
   * PUT /profile
   * Updates authenticated user's profile
   */
  public updateProfile(req: AuthenticatedRequest, res: Response): void {
    try {
      const authenticatedUserId = extractUserId(req);
      
      const { error, value } = validateProfileUpdate(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error: error || "Invalid profile update parameters submitted" });
        return;
      }

      const updatedProfile = profileService.updateProfile(authenticatedUserId, value);

      res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data: updatedProfile
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to update profile entity" });
    }
  }

  /**
   * GET /profile/:id/content
   * Fetches clips and media uploads published by the user
   */
  public getProfileContent(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Profile ID is required" });
        return;
      }

      const content = profileService.getProfileContent(id);

      res.status(200).json({
        success: true,
        message: "Profile media creations retrieved successfully",
        data: content
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch profile content" });
    }
  }

  /**
   * GET /profile/:id/services
   * Fetches service listings provided by the professional
   */
  public getProfileServices(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Profile ID is required" });
        return;
      }

      const services = profileService.getProfileServices(id);

      res.status(200).json({
        success: true,
        message: "Hustler service offerings retrieved successfully",
        data: services
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch profile services" });
    }
  }

  /**
   * GET /profile/:id/reviews
   * Fetches customer reviews given to the provider
   */
  public getProfileReviews(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Profile ID is required" });
        return;
      }

      const reviews = profileService.getProfileReviews(id);

      res.status(200).json({
        success: true,
        message: "Customer reviews list retrieved successfully",
        data: reviews
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch profile reviews" });
    }
  }

  /**
   * GET /profile/:id/verifications
   * Fetches trust credentials and certificate verification statuses
   */
  public getProfileVerifications(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "Profile ID is required" });
        return;
      }

      const verifications = profileService.getProfileVerifications(id);

      res.status(200).json({
        success: true,
        message: "Trust verifications and badges retrieved successfully",
        data: verifications
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch verification status" });
    }
  }
}

export const profileController = new ProfileController();
