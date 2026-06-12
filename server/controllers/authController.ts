import { Request, Response } from "express";
import { authService } from "../services/authService";
import { 
  validateRegisterPayload, 
  validateLoginPayload, 
  validateOtpPayload 
} from "../validation/authValidation";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class AuthController {
  
  // POST /api/auth/register
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateRegisterPayload(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const result = await authService.register(value);
      res.status(201).json({
        success: true,
        message: "Profile workspace established successfully",
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to create account" });
    }
  }

  // POST /api/auth/login
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = validateLoginPayload(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      const result = await authService.login(value);
      res.status(200).json({
        success: true,
        message: "Login session validated successfully",
        data: result
      });
    } catch (err: any) {
      res.status(401).json({ success: false, error: err.message || "Invalid credentials" });
    }
  }

  // POST /api/auth/logout
  public logout(req: Request, res: Response): void {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        authService.logout(refreshToken);
      }
      res.status(200).json({
        success: true,
        message: "Session revoked and user logged out successfully"
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Logout anomaly detected" });
    }
  }

  // POST /api/auth/verify-phone
  public verifyPhoneOTP(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Access token is lacking or has expired" });
        return;
      }

      const { error, value } = validateOtpPayload(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      authService.verifyPhoneCode(req.user.userId, value.code);
      res.status(200).json({
        success: true,
        message: "Phone number authenticated and bound successfully"
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Verification failed" });
    }
  }

  // POST /api/auth/verify-email
  public verifyEmailOTP(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication credentials required" });
        return;
      }

      const { error, value } = validateOtpPayload(req.body);
      if (error || !value) {
        res.status(400).json({ success: false, error });
        return;
      }

      authService.verifyEmailCode(req.user.userId, value.code);
      res.status(200).json({
        success: true,
        message: "Your email inbox has been validated successfully"
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Email activation failed" });
    }
  }

  // POST /api/auth/resend-code
  public resendOTP(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication credentials required" });
        return;
      }

      const { channel } = req.body;
      if (channel !== "email" && channel !== "phone") {
        res.status(400).json({ success: false, error: "Specify channel: either 'email' or 'phone'" });
        return;
      }

      authService.resendOTP(req.user.userId, channel);
      res.status(200).json({
        success: true,
        message: `Fresh verification pin dispatched via ${channel} network successfully`
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Resend workflow throttled or failed" });
    }
  }

  // POST /api/auth/refresh
  public async refreshTokens(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken || typeof refreshToken !== "string") {
        res.status(400).json({ success: false, error: "Body parameter 'refreshToken' is required" });
        return;
      }

      const result = await authService.refreshTokens(refreshToken);
      res.status(200).json({
        success: true,
        message: "Rotation credentials processed successfully",
        data: result
      });
    } catch (err: any) {
      res.status(401).json({ success: false, error: err.message || "Refresh token expired or revoked" });
    }
  }

  // GET /api/auth/me
  // Fetches current fully loaded session profile
  public getProfile(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Access credentials missing" });
        return;
      }

      const profile = authService.getUserProfile(req.user.userId);
      if (!profile) {
        res.status(404).json({ success: false, error: "Profile not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Current profile summary loaded successfully",
        data: { user: profile }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to load session info" });
    }
  }

  // POST /api/auth/apply-hustler
  // Lets a verified User request elevation to Hustler role
  public applyHustler(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication credentials required" });
        return;
      }

      const result = authService.applyForHustlerRole(req.user.userId, req.body);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Role shift application refused" });
    }
  }

  // POST /api/auth/admin-approve/:userId
  // Admin simulation utility to approve a pending candidate
  public adminApproveHustler(req: Request, res: Response): void {
    try {
      const { userId } = req.params;
      if (!userId || typeof userId !== "string") {
        res.status(400).json({ success: false, error: "Please specify endpoint path 'userId' as a proper string" });
        return;
      }

      authService.adminApproveHustlerRole(userId);
      res.status(200).json({
        success: true,
        message: "User promoted to verified Hustler role. Verification status updated successfully."
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to elevate role status" });
    }
  }
}

export const authController = new AuthController();
