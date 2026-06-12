import { Request, Response } from "express";
import { walletService } from "../services/walletService";

export class WalletController {

  // GET /wallet
  public getWallet(req: Request, res: Response) {
    try {
      // Use test client id if no auth middleware
      const userId = (req as any).user?.userId || "test-client-id";
      const wallet = walletService.getOrCreateWallet(userId);
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /wallet/transactions
  public getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const transactions = walletService.getTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /wallet/deposit
  public deposit(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const { amount, sourceName } = req.body;
      const tx = walletService.deposit(userId, Number(amount), sourceName || "External Bank");
      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /wallet/withdraw
  public withdraw(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const { amount, destinationName } = req.body;
      const tx = walletService.withdraw(userId, Number(amount), destinationName || "Linked Bank Account");
      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // POST /wallet/transfer
  public transfer(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || "test-client-id";
      const { amount, recipientHustleName } = req.body;
      const tx = walletService.transfer(userId, recipientHustleName, Number(amount));
      res.json({ success: true, transaction: tx });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const walletController = new WalletController();
