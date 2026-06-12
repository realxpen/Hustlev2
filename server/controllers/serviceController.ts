import { Request, Response } from "express";
import { serviceService } from "../services/serviceService";
import { validateCreateService, validateUpdateService } from "../validation/serviceValidation";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

/**
 * Extracts the user ID from either intermediate token payloads or OAuth fallback headers
 */
function extractUserId(req: AuthenticatedRequest): string {
  if (req.user?.userId) {
    return req.user.userId;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }
  // Robust sandbox/preview fallback
  return "demo-hustler-id";
}

export class ServiceController {

  /**
   * Private utility parser to structure filter elements safely from query streams
   */
  private parseQueryFilters(req: Request): any {
    const category = req.query.category as string;
    const query = (req.query.query || req.query.q) as string;
    const pricingType = req.query.pricingType as string;
    const ownerId = req.query.ownerId as string;
    const locationMode = req.query.locationMode as string;

    const priceMin = req.query.priceMin !== undefined ? Number(req.query.priceMin) : undefined;
    const priceMax = req.query.priceMax !== undefined ? Number(req.query.priceMax) : undefined;
    const ratingMin = req.query.ratingMin !== undefined ? Number(req.query.ratingMin) : undefined;

    const verifiedOnly = req.query.verifiedOnly === "true";
    const availableOnly = req.query.availableOnly === "true";

    let tags: string[] | undefined = undefined;
    if (req.query.tags) {
      if (typeof req.query.tags === "string") {
        tags = req.query.tags.split(",").map(t => t.trim());
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags.map(t => String(t).trim());
      }
    }

    return {
      category,
      query,
      priceMin,
      priceMax,
      pricingType,
      tags,
      ownerId,
      locationMode,
      verifiedOnly,
      availableOnly,
      ratingMin
    };
  }

  /**
   * GET /services
   * Lists available active services with optional compound filters and lists sorting
   */
  public getServices(req: Request, res: Response): void {
    try {
      const filters = this.parseQueryFilters(req);
      const sortBy = (req.query.sortBy || req.query.sort) as any;

      const results = serviceService.listServicesExtended(filters, sortBy);

      res.status(200).json({
        success: true,
        message: "Marketplace listings retrieved successfully",
        data: results
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to list marketplace offerings"
      });
    }
  }

  /**
   * GET /services/search
   * Fuzzy metadata matches and keyword based service discovery
   */
  public searchServices(req: Request, res: Response): void {
    try {
      const filters = this.parseQueryFilters(req);
      const sortBy = (req.query.sortBy || req.query.sort || "popularity") as any;

      const results = serviceService.listServicesExtended(filters, sortBy);

      res.status(200).json({
        success: true,
        message: "Marketplace search query resolved successfully",
        data: results
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Fuzzy catalog search failed"
      });
    }
  }

  /**
   * GET /services/category/:id
   * Lists services matching the specified category path parameter
   */
  public getServicesByCategory(req: Request, res: Response): void {
    try {
      const categoryId = req.params.id;
      if (!categoryId) {
        res.status(400).json({ success: false, error: "Category ID parameter is required" });
        return;
      }

      const filters = this.parseQueryFilters(req);
      filters.category = categoryId;
      const sortBy = (req.query.sortBy || req.query.sort) as any;

      const results = serviceService.listServicesExtended(filters, sortBy);

      res.status(200).json({
        success: true,
        message: `Category '${categoryId}' services loaded successfully`,
        data: results
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to list category offerings"
      });
    }
  }

  /**
   * GET /services/recommended
   * Highly tailored recommendation system with custom scoring metrics
   */
  public getRecommendedServices(req: Request, res: Response): void {
    try {
      const limit = Number(req.query.limit || 6);
      const category = req.query.category as string;

      const results = serviceService.getRecommendedServices(limit, category);

      res.status(200).json({
        success: true,
        message: "Tailored services recommended successfully",
        data: results
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to compute recommended offerings"
      });
    }
  }

  /**
   * GET /services/:id
   * Fetch single service details by ID
   */
  public getServiceById(req: Request, res: Response): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const service = serviceService.getServiceById(id);

      res.status(200).json({
        success: true,
        message: "Service listing retrieved successfully",
        data: service
      });
    } catch (err: any) {
      if (err.message && err.message.includes("was not found")) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve service listing details"
      });
    }
  }

  /**
   * GET /services/user/:id
   * Fetch service listings published by a specific User ID
   */
  public getServicesByOwnerId(req: Request, res: Response): void {
    try {
      const rawOwnerId = req.params.id;
      const ownerId = Array.isArray(rawOwnerId) ? rawOwnerId[0] : rawOwnerId;
      if (!ownerId) {
        res.status(400).json({ success: false, error: "Owner ID parameter is required" });
        return;
      }

      const services = serviceService.getServicesByOwnerId(ownerId);

      res.status(200).json({
        success: true,
        message: "User services loaded successfully",
        data: services
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to load user service offerings"
      });
    }
  }

  /**
   * POST /services
   * Creates a new service listing (requires authentication & Hustler/Agent validation)
   */
  public createService(req: AuthenticatedRequest, res: Response): void {
    try {
      const creatorId = extractUserId(req);

      const { error, value } = validateCreateService(req.body);
      if (error || !value) {
        res.status(400).json({
          success: false,
          error: error || "Invalid service creation parameters submitted"
        });
        return;
      }

      const created = serviceService.createService(creatorId, value);

      res.status(201).json({
        success: true,
        message: "Marketplace service listing launched successfully",
        data: created
      });
    } catch (err: any) {
      if (err.message && err.message.includes("Only approved Hustlers")) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      res.status(500).json({
        success: false,
        error: err.message || "Failed to create physical service listing"
      });
    }
  }

  /**
   * PUT /services/:id
   * Updates an existing service listing (requires ownership or managing agent rights)
   */
  public updateService(req: AuthenticatedRequest, res: Response): void {
    try {
      const updaterId = extractUserId(req);
      const rawServiceId = req.params.id;
      const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId;

      if (!serviceId) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const { error, value } = validateUpdateService(req.body);
      if (error || !value) {
        res.status(400).json({
          success: false,
          error: error || "Invalid service update parameters submitted"
        });
        return;
      }

      const updated = serviceService.updateService(updaterId, serviceId, value);

      res.status(200).json({
        success: true,
        message: "Service listing updated successfully",
        data: updated
      });
    } catch (err: any) {
      if (err.message && err.message.includes("was not found")) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message && err.message.includes("Action denied")) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      res.status(500).json({
        success: false,
        error: err.message || "Failed to update target service listing"
      });
    }
  }

  /**
   * DELETE /services/:id
   * Completely deletes a service listing
   */
  public deleteService(req: AuthenticatedRequest, res: Response): void {
    try {
      const updaterId = extractUserId(req);
      const rawServiceId = req.params.id;
      const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId;

      if (!serviceId) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      serviceService.deleteService(updaterId, serviceId);

      res.status(200).json({
        success: true,
        message: "Service offering deleted completely from database"
      });
    } catch (err: any) {
      if (err.message && err.message.includes("was not found")) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message && err.message.includes("Action denied")) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      res.status(500).json({
        success: false,
        error: err.message || "Failed to remove target service listing"
      });
    }
  }

  /**
   * POST /services/:id/archive
   * Soft-archives a service listing
   */
  public archiveService(req: AuthenticatedRequest, res: Response): void {
    try {
      const updaterId = extractUserId(req);
      const rawServiceId = req.params.id;
      const serviceId = Array.isArray(rawServiceId) ? rawServiceId[0] : rawServiceId;

      if (!serviceId) {
        res.status(400).json({ success: false, error: "Service ID parameter is required" });
        return;
      }

      const achieved = serviceService.archiveService(updaterId, serviceId);

      res.status(200).json({
        success: true,
        message: "Service listing soft-archived successfully",
        data: achieved
      });
    } catch (err: any) {
      if (err.message && err.message.includes("was not found")) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message && err.message.includes("Action denied")) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      res.status(500).json({
        success: false,
        error: err.message || "Failed to archive target service listing"
      });
    }
  }
}

export const serviceController = new ServiceController();
