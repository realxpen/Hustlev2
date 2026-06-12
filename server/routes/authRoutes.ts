import { Router, Request, Response } from 'express';
import { authController } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Public onboarding authentication routes
router.post('/register', (req: Request, res: Response) => authController.register(req, res));
router.post('/login', (req: Request, res: Response) => authController.login(req, res));
router.post('/logout', (req: Request, res: Response) => authController.logout(req, res));
router.post('/refresh', (req: Request, res: Response) => authController.refreshTokens(req, res));

// Authenticated checks requiring session JWT token
router.get('/me', authenticateJWT, (req: Request, res: Response) => authController.getProfile(req, res));
router.post('/verify-phone', authenticateJWT, (req: Request, res: Response) => authController.verifyPhoneOTP(req, res));
router.post('/verify-email', authenticateJWT, (req: Request, res: Response) => authController.verifyEmailOTP(req, res));
router.post('/resend-otp', authenticateJWT, (req: Request, res: Response) => authController.resendOTP(req, res));
router.post('/apply-hustler', authenticateJWT, (req: Request, res: Response) => authController.applyHustler(req, res));

// Sandbox helper to immediately elevate a user to Hustler role for easy previewing
router.post('/admin-approve/:userId', (req: Request, res: Response) => authController.adminApproveHustler(req, res));

export default router;
