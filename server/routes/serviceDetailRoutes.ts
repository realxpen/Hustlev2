import { Router } from "express";
import { serviceDetailController } from "../controllers/serviceDetailController";
import { extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// GET /service/:id - Fetch individual service details with enriched provider metadata
router.get("/:id", extractPassiveUser, (req, res) => serviceDetailController.getServiceDetails(req, res));

// GET /service/:id/reviews - Retrieve client reviews given to the provider of the service
router.get("/:id/reviews", extractPassiveUser, (req, res) => serviceDetailController.getServiceReviews(req, res));

// GET /service/:id/content - Fetch portfolio works, videos, or posts of the service provider
router.get("/:id/content", extractPassiveUser, (req, res) => serviceDetailController.getServiceContent(req, res));

// GET /service/:id/provider - Fetch full profile characteristics of the provider listing the service
router.get("/:id/provider", extractPassiveUser, (req, res) => serviceDetailController.getServiceProvider(req, res));

export default router;
