import { Router } from 'express';
import { onboardingController } from '../controllers/onboardingController';

const router = Router();

// GET current progress/state
router.get('/progress', (req, res) => onboardingController.getProgress(req, res));

// POST selected interests / skill chips
router.post('/interests', (req, res) => onboardingController.saveSelectedInterests(req, res));

// POST location mapping settings
router.post('/location', (req, res) => onboardingController.saveLocationPermission(req, res));

// POST complete onboarding cycle
router.post('/complete', (req, res) => onboardingController.finalizeOnboarding(req, res));

export default router;
