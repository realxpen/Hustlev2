import { Request, Response } from "express";
import { escrowService } from "../services/escrowService";
import { walletService } from "../services/walletService";

export class EscrowController {

  // POST /escrow/fund
  public fund(req: Request, res: Response) {
    try {
      const clientId = (req as any).user?.userId || "test-client-id";
      const { bookingId, amount } = req.body;
      const tx = escrowService.fund(clientId, bookingId, Number(amount));
      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /escrow/release
  public release(req: Request, res: Response) {
    try {
      const clientId = (req as any).user?.userId || "test-client-id";
      const { bookingId, providerId, amount } = req.body;
      const tx = escrowService.release(clientId, providerId || "test-provider-id", bookingId, Number(amount));
      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /escrow/refund
  public refund(req: Request, res: Response) {
    try {
      const clientId = (req as any).user?.userId || "test-client-id";
      const { bookingId, amount } = req.body;
      const tx = escrowService.refund(clientId, bookingId, Number(amount));
      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /escrow/dispute
  public dispute(req: Request, res: Response) {
    try {
      const clientId = (req as any).user?.userId || "test-client-id";
      const { bookingId } = req.body;
      escrowService.dispute(clientId, bookingId);
      res.json({ success: true, message: "Escrow funds frozen for dispute." });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const escrowController = new EscrowController();
