import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to protect notification resources
router.use(authenticateJWT);

router.get('/', notificationController.getNotifications);
router.post('/create', notificationController.createNotification);
router.post('/read', notificationController.markAsRead);

export default router;
