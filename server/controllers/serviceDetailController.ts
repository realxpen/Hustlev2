import { Request, Response } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { profileRepository } from "../repositories/profileRepository";

export class ServiceDetailController {

  /**
   * GET /service/:id
   * Fetch service listing details enriched with owner/provider metadata
   */
  public getServiceDetails(req: Request, res: Response): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const service = serviceRepository.findById(id);
      if (!service) {
        res.status(404).json({ success: false, error: `Service with ID '${id}' was not found or has been archived` });
        return;
      }

      // Increment view counter dynamically to represent engagement
      try {
        serviceRepository.update(id, { views_count: (service.views_count || 0) + 1 });
      } catch (err) {
        // Safe update failover fallback
      }

      // Enrich with provider profile metadata
      const profile = profileRepository.findById(service.owner_id);
      const enrichedService = {
        ...service,
        profiles: profile ? {
          id: profile.id,
          full_name: profile.fullName,
          hustle_name: profile.fullName,
          avatar_url: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
          verified: profile.verified,
          primary_skill: profile.primarySkill,
          rating_average: profile.ratingAverage,
          review_count: profile.reviewCount
        } : {
          id: service.owner_id,
          full_name: "Hustle Partner",
          hustle_name: "Hustle Partner",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.owner_id}`,
          verified: false,
          primary_skill: "Specialist",
          rating_average: 4.9,
          review_count: 5
        }
      };

      res.status(200).json({
        success: true,
        message: "Service details retrieved successfully",
        data: enrichedService
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve service specifications"
      });
    }
  }

  /**
   * GET /service/:id/reviews
   * Retrieve client reviews given to the provider of the specified service
   */
  public getServiceReviews(req: Request, res: Response): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const service = serviceRepository.findById(id);
      if (!service) {
        res.status(404).json({ success: false, error: `Service with ID '${id}' was not found` });
        return;
      }

      const reviews = profileRepository.findReviewsByProfileId(service.owner_id);

      res.status(200).json({
        success: true,
        message: "Service provider reviews retrieved successfully",
        data: reviews
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to look up service provider reviews"
      });
    }
  }

  /**
   * GET /service/:id/content
   * Fetch portfolio works, videos, or content published by the service provider
   */
  public getServiceContent(req: Request, res: Response): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const service = serviceRepository.findById(id);
      if (!service) {
        res.status(404).json({ success: false, error: `Service with ID '${id}' was not found` });
        return;
      }

      const content = profileRepository.findContentByProfileId(service.owner_id);

      res.status(200).json({
        success: true,
        message: "Service provider portfolio content retrieved successfully",
        data: content
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve service provider portfolio content"
      });
    }
  }

  /**
   * GET /service/:id/provider
   * Fetch the user profile detail metadata of the provider listing this service
   */
  public getServiceProvider(req: Request, res: Response): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const service = serviceRepository.findById(id);
      if (!service) {
        res.status(404).json({ success: false, error: `Service with ID '${id}' was not found` });
        return;
      }

      const profile = profileRepository.findById(service.owner_id);
      if (!profile) {
        res.status(404).json({ success: false, error: `Service provider profile with ID '${service.owner_id}' was not found` });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Service provider profile loaded successfully",
        data: profile
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve service provider details"
      });
    }
  }
}

export const serviceDetailController = new ServiceDetailController();
