import { Router } from "express";
import { serviceController } from "../controllers/serviceController";
import { authenticateJWT, extractPassiveUser } from "../middleware/authMiddleware";

const router = Router();

// GET /services - Lists active, unarchived marketplace services (supports passive user parsing)
router.get("/", extractPassiveUser, (req, res) => serviceController.getServices(req, res));

// GET /services/search - Search listings with query text, filters, and custom sorting
router.get("/search", extractPassiveUser, (req, res) => serviceController.searchServices(req, res));

// GET /services/recommended - Recommended listings based on popularity and engagement metric scores
router.get("/recommended", extractPassiveUser, (req, res) => serviceController.getRecommendedServices(req, res));

// GET /services/category/:id - Fetch services within a specific category with query filters
router.get("/category/:id", extractPassiveUser, (req, res) => serviceController.getServicesByCategory(req, res));

// GET /services/:id - Fetch individual service details
router.get("/:id", extractPassiveUser, (req, res) => serviceController.getServiceById(req, res));

// GET /services/user/:id - Fetch all services listed by a specific owner/hustler
router.get("/user/:id", extractPassiveUser, (req, res) => serviceController.getServicesByOwnerId(req, res));

// POST /services - Creates a new service offering (requires authentication)
router.post("/", authenticateJWT, (req, res) => serviceController.createService(req, res));

// PUT /services/:id - Modify detailed attributes of a service listing (requires authentication)
router.put("/:id", authenticateJWT, (req, res) => serviceController.updateService(req, res));

// DELETE /services/:id - Deletes a service listing from the database system (requires authentication)
router.delete("/:id", authenticateJWT, (req, res) => serviceController.deleteService(req, res));

// POST /services/:id/archive - Archives a service offering (requires authentication)
router.post("/:id/archive", authenticateJWT, (req, res) => serviceController.archiveService(req, res));

export default router;
