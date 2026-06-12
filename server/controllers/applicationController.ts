import { Request, Response } from "express";
import { applicationService } from "../services/applicationService";

export class ApplicationController {
  // GET /hustler/application
  public async getApplication(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const status = await applicationService.getApplication(userId);
      res.json({ success: true, ...status });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /hustler/apply
  public async apply(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const application = await applicationService.apply(userId, req.body);
      res.json({ success: true, application });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /hustler/application/update
  public async updateApplication(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const application = await applicationService.updateApplication(userId, req.body);
      res.json({ success: true, application });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Admin routes for testing statuses
  public async setStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // pending, approved, rejected, more_info
      const adminId = (req as any).user?.userId || "admin-id";
      
      const application = await applicationService.setStatus(id as string, status as string, adminId);
      res.json({ success: true, application });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const applicationController = new ApplicationController();
