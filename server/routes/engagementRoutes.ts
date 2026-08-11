import { Router } from 'express';
import { engagementController } from '../controllers/engagementController';
import { extractPassiveUser } from '../middleware/authMiddleware';

const router = Router();

// Track likes
router.post('/like', extractPassiveUser, (req, res) => engagementController.trackLike(req, res));
router.delete('/like', extractPassiveUser, (req, res) => engagementController.removeLike(req, res));

// Track saves
router.post('/save', extractPassiveUser, (req, res) => engagementController.trackSave(req, res));
router.delete('/save', extractPassiveUser, (req, res) => engagementController.removeSave(req, res));

// Track follows
router.post('/follow', extractPassiveUser, (req, res) => engagementController.trackFollow(req, res));
router.delete('/follow', extractPassiveUser, (req, res) => engagementController.removeFollow(req, res));

// Shares and negative signals
router.post('/share', extractPassiveUser, (req, res) => engagementController.trackShare(req, res));
router.post('/not-interested', extractPassiveUser, (req, res) => engagementController.trackNotInterested(req, res));

// Reporting
router.post('/report', extractPassiveUser, (req, res) => engagementController.trackReport(req, res));

export default router;
