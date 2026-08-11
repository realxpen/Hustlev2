import { Router } from 'express';
import { agentController } from '../controllers/agentController';
import { authenticateJWT, requireHustlerRole } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication JWT validation middleware globally on agent control routes
router.use(authenticateJWT);

router.post('/apply', agentController.apply);
router.post('/assign', agentController.assign);
router.get('/dashboard', agentController.getDashboard);
router.get('/hustlers', agentController.getHustlers);

// Advanced auxiliary endpoints for interactive control decks
router.post('/relationship/respond', agentController.respondToProposal);
router.post('/permissions', agentController.updatePermissions);

export default router;
