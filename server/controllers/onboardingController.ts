import { Request, Response } from 'express';
import { onboardingService } from '../services/onboardingService';
import { validateInterests, validateLocation } from '../validation/onboardingValidation';

// Helper to reliably extract user ID from standard authorization header
function getAuthenticatedUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }
  return 'default-guest-hustler';
}

export class OnboardingController {
  
  public getProgress(req: Request, res: Response): void {
    const userId = getAuthenticatedUserId(req);
    const progress = onboardingService.getOnboardingProgress(userId);
    res.status(200).json({
      success: true,
      message: 'Onboarding state retrieved successfully',
      data: progress
    });
  }

  public saveSelectedInterests(req: Request, res: Response): void {
    const userId = getAuthenticatedUserId(req);
    const { error, value } = validateInterests(req.body);

    if (error || !value) {
      res.status(400).json({
        success: false,
        error: error || 'Invalid interests payload submitted'
      });
      return;
    }

    const updatedState = onboardingService.saveInterests(userId, value.interests);
    res.status(200).json({
      success: true,
      message: 'Interests saved successfully',
      data: updatedState
    });
  }

  public saveLocationPermission(req: Request, res: Response): void {
    const userId = getAuthenticatedUserId(req);
    const { error, value } = validateLocation(req.body);

    if (error || !value) {
      res.status(400).json({
        success: false,
        error: error || 'Invalid location permission details'
      });
      return;
    }

    const updatedState = onboardingService.saveLocation(
      userId,
      value.locationAllowed,
      value.coords
    );

    res.status(200).json({
      success: true,
      message: 'Location preference saved successfully',
      data: updatedState
    });
  }

  public finalizeOnboarding(req: Request, res: Response): void {
    const userId = getAuthenticatedUserId(req);
    const updatedState = onboardingService.completeOnboarding(userId);
    
    res.status(200).json({
      success: true,
      message: 'Onboarding marked complete successfully',
      data: updatedState
    });
  }
}

export const onboardingController = new OnboardingController();
