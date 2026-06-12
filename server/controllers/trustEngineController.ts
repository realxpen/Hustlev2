import { Request, Response } from "express";
import { trustEngineService } from "../services/trustEngineService";

export class TrustEngineController {
  public async getTrustProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const profile = await trustEngineService.getTrustProfile(userId);
      
      // NEVER SEND INTERNAL SCORE TO CLIENT
      res.json({ 
        success: true, 
        trustProfile: {
           visibleLabel: profile.visibleLabel
        } 
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const trustEngineController = new TrustEngineController();
