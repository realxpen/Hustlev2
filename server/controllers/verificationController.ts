import { Request, Response } from "express";
import { verificationService } from "../services/verificationService";

export class VerificationController {
  public async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const status = await verificationService.getVerificationStatus(userId);
      res.json({ success: true, verifications: status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public async verifyPhone(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const status = await verificationService.verifyPhone(userId, req.body);
      res.json({ success: true, verifications: status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public async verifyEmail(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const status = await verificationService.verifyEmail(userId, req.body);
      res.json({ success: true, verifications: status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public async verifyIdentity(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const status = await verificationService.verifyIdentity(userId, req.body);
      res.json({ success: true, verifications: status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  public async verifyAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const status = await verificationService.verifyAddress(userId, req.body);
      res.json({ success: true, verifications: status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const verificationController = new VerificationController();
