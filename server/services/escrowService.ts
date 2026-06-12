import { walletService } from "./walletService";
import { walletRepository } from "../repositories/walletRepository";
import { Transaction } from "../types/wallet";
import crypto from "crypto";

export class EscrowService {
  /**
   * Lock funds from Client Wallet into Escrow
   */
  public fund(clientId: string, bookingId: string, amount: number): Transaction {
    // 1. We just use walletService lockEscrow which handles double entry
    return walletService.lockEscrow(clientId, amount, bookingId);
  }

  /**
   * Release funds from Escrow to Provider Wallet
   */
  public release(clientId: string, providerId: string, bookingId: string, amount: number): Transaction {
    const clientWallet = walletService.getOrCreateWallet(clientId);
    const providerWallet = walletService.getOrCreateWallet(providerId);
    
    if (clientWallet.escrowBalance < amount) {
      throw new Error("Insufficient escrow balance to release");
    }

    const txId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Transaction record for provider
    const tx: Transaction = {
      id: txId,
      walletId: providerWallet.id,
      amount: amount,
      type: 'payout',
      status: 'completed',
      title: 'Escrow Released',
      sub: `From Booking #${bookingId.substring(0, 8)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: now,
      referenceId: bookingId
    };

    walletRepository.saveTransaction(tx);

    // 2. Ledger Recording: Debit Client Escrow, Credit Provider Wallet
    const entry1 = {
      id: crypto.randomUUID(),
      transactionId: txId,
      account: `USER_ESCROW_${clientWallet.id}`,
      debit: amount,
      credit: 0,
      createdAt: now
    };
    const entry2 = {
      id: crypto.randomUUID(),
      transactionId: txId,
      account: `USER_WALLET_${providerWallet.id}`,
      debit: 0,
      credit: amount,
      createdAt: now
    };
    walletRepository.saveLedgerEntries([entry1, entry2]);

    // 3. Update Balances
    walletRepository.updateWallet(clientWallet.id, {
      escrowBalance: clientWallet.escrowBalance - amount
    });
    
    walletRepository.updateWallet(providerWallet.id, {
      balance: providerWallet.balance + amount,
      totalEarnings: providerWallet.totalEarnings + amount
    });

    return tx;
  }

  /**
   * Refund funds from Escrow back to Client Wallet
   */
  public refund(clientId: string, bookingId: string, amount: number): Transaction {
    const clientWallet = walletService.getOrCreateWallet(clientId);
    
    if (clientWallet.escrowBalance < amount) {
      throw new Error("Insufficient escrow balance to refund");
    }

    const txId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Transaction record for client refund
    const tx: Transaction = {
      id: txId,
      walletId: clientWallet.id,
      amount: amount,
      type: 'refund',
      status: 'completed',
      title: 'Escrow Refunded',
      sub: `From Booking #${bookingId.substring(0, 8)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: now,
      referenceId: bookingId
    };

    walletRepository.saveTransaction(tx);

    // 2. Ledger Recording: Debit Client Escrow, Credit Client Wallet
    const entry1 = {
      id: crypto.randomUUID(),
      transactionId: txId,
      account: `USER_ESCROW_${clientWallet.id}`,
      debit: amount,
      credit: 0,
      createdAt: now
    };
    const entry2 = {
      id: crypto.randomUUID(),
      transactionId: txId,
      account: `USER_WALLET_${clientWallet.id}`,
      debit: 0,
      credit: amount,
      createdAt: now
    };
    walletRepository.saveLedgerEntries([entry1, entry2]);

    // 3. Update Balances
    walletRepository.updateWallet(clientWallet.id, {
      escrowBalance: clientWallet.escrowBalance - amount,
      balance: clientWallet.balance + amount,
      totalSpending: clientWallet.totalSpending - amount // Reverse the spending tracked during lock
    });

    return tx;
  }

  /**
   * Put booking in Dispute (No direct ledger change, just state, maybe handled in booking, 
   * but we can mark a transaction if we want, or just abstract it here)
   */
  public dispute(clientId: string, bookingId: string): void {
    // Escrow funds remain in `USER_ESCROW_${clientWallet.id}`
    // But they are frozen from release/refund until resolved by admin
    // In a real system, we might move to `SYSTEM_DISPUTE` account
    const clientWallet = walletService.getOrCreateWallet(clientId);
    const txId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Create an informational transaction, 0 amount
    const tx: Transaction = {
      id: txId,
      walletId: clientWallet.id,
      amount: 0,
      type: 'escrow payment',
      status: 'failed', // Hack for ui to show disputed maybe, or we can use 'escrow'
      title: 'Dispute Raised',
      sub: `Funds Frozen - Booking #${bookingId.substring(0, 8)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: now,
      referenceId: bookingId
    };

    walletRepository.saveTransaction(tx);
  }
}

export const escrowService = new EscrowService();
