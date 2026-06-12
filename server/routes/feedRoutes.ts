import { Router, Request, Response, NextFunction } from 'express';
import { feedController } from '../controllers/feedController';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, extractPassiveUser } from '../middleware/authMiddleware';
import { TokenPayload } from '../services/authService';

const router = Router();
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "hustle_super_secure_access_secret_2026";

// GET /feed - retrieve ranked, paginated, filtered feed
router.get('/', extractPassiveUser, (req: Request, res: Response) => feedController.getFeed(req, res));

// Additional Feed Endpoints
router.get('/following', extractPassiveUser, (req: Request, res: Response) => feedController.getFollowingFeed(req, res));
router.get('/nearby', extractPassiveUser, (req: Request, res: Response) => feedController.getNearbyFeed(req, res));
router.get('/learning', extractPassiveUser, (req: Request, res: Response) => feedController.getLearningFeed(req, res));
router.get('/services', extractPassiveUser, (req: Request, res: Response) => feedController.getServicesFeed(req, res));
router.get('/projects', extractPassiveUser, (req: Request, res: Response) => feedController.getProjectsFeed(req, res));
router.get('/verified', extractPassiveUser, (req: Request, res: Response) => feedController.getVerifiedFeed(req, res));

// POST /feed/view - track view action on a video/card
router.post('/view', (req: Request, res: Response) => feedController.trackView(req, res));

// POST /feed/not-interested - mark post as not interested
router.post('/not-interested', extractPassiveUser, (req: Request, res: Response) => feedController.trackNotInterested(req, res));

// POST /feed/like - register/toggle like
router.post('/like', (req: Request, res: Response) => feedController.trackLike(req, res));

// POST /feed/save - register/toggle save
router.post('/save', (req: Request, res: Response) => feedController.trackSave(req, res));

// POST /feed/share - track share action
router.post('/share', (req: Request, res: Response) => feedController.trackShare(req, res));

// POST /feed/follow - social mapping subscription
router.post('/follow', extractPassiveUser, (req: Request, res: Response) => feedController.trackFollow(req, res));

export default router;
