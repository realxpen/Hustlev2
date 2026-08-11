import { Request, Response } from "express";
import { ReferralService } from "../services/referralService";

const referralService = new ReferralService();

export class ReferralController {

  /**
   * POST /referrals/create
   * AND back-compat POST /referral/invite
   * Tracks outbound referrals and logs visitor details for anti-fraud scrutiny
   */
  public async createReferral(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.body.userId || "test-client-id";
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: "Nominee 'name' and 'email' parameters are both required"
        });
      }

      // Safe retrieval of visitor IP & user-agent for forensic fraud assessment
      const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp as string).split(",")[0].trim();
      const userAgent = req.headers["user-agent"] || "";

      const invite = await referralService.createReferral(
        userId,
        name,
        email,
        ipAddress,
        userAgent
      );

      return res.json({
        success: true,
        message: "Referral invitation successfully created",
        invite
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /referrals/stats
   * AND back-compat GET /referral/dashboard
   * Returns aggregated program conversions and invitations audit trails
   */
  public async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.query.userId || "test-client-id";
      const data = await referralService.getStats(userId);
      return res.json({
        success: true,
        data
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /referrals/reward
   * AND back-compat POST /referral/simulate-join
   * Simulates/confirms referred user onboarding and processes ledger bonus payments
   */
  public async rewardReferral(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Recipient 'email' parameter is required to identify the reward leg"
        });
      }

      const result = await referralService.rewardReferral(email);
      return res.json({
        success: true,
        message: "Referral successfully approved! Split cash incentives applied to account ledger.",
        result
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /referral/payout
   * Initiates immediate balance withdraw transfer
   */
  public async claimPayout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || req.body.userId || "test-client-id";
      const result = await referralService.claimPayout(userId);
      return res.json({
        success: true,
        message: "Cash referral bonus successfully withdrawn to connected card",
        payout: result
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}
