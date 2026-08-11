import { Router } from "express";
import { walletController } from "../controllers/walletController";
import { authenticateJWT } from "../middleware/authMiddleware";
import { validateTransaction } from "../validation/walletValidation";

const router = Router();

// Endpoint definitions
router.get("/", authenticateJWT, walletController.getWallet.bind(walletController));
router.get("/transactions", authenticateJWT, walletController.getTransactions.bind(walletController));
router.post("/deposit", authenticateJWT, validateTransaction, walletController.deposit.bind(walletController));
router.post("/withdraw", authenticateJWT, validateTransaction, walletController.withdraw.bind(walletController));
router.post("/transfer", authenticateJWT, validateTransaction, walletController.transfer.bind(walletController));

export default router;
