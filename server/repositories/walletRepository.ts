import { Wallet, Transaction, LedgerEntry } from "../types/wallet";
import crypto from "crypto";

class WalletRepository {
  private wallets = new Map<string, Wallet>();
  private transactions = new Map<string, Transaction>();
  private ledger = new Map<string, LedgerEntry>();

  public createWallet(ownerId: string, currency: string = 'USD'): Wallet {
    const existing = Array.from(this.wallets.values()).find(w => w.ownerId === ownerId);
    if (existing) return existing;

    const id = `wallet-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newWallet: Wallet = {
      id,
      ownerId,
      balance: 0,
      escrowBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      totalSpending: 0,
      currency,
      createdAt: now,
      updatedAt: now
    };
    
    this.wallets.set(id, newWallet);
    return newWallet;
  }

  public getWalletByOwnerId(ownerId: string): Wallet | undefined {
    return Array.from(this.wallets.values()).find(w => w.ownerId === ownerId);
  }
  
  public getWalletById(id: string): Wallet | undefined {
    return this.wallets.get(id);
  }

  public updateWallet(id: string, updates: Partial<Wallet>): Wallet {
    const wallet = this.wallets.get(id);
    if (!wallet) throw new Error("Wallet not found");
    
    const updated = { ...wallet, ...updates, updatedAt: new Date().toISOString() };
    this.wallets.set(id, updated);
    return updated;
  }

  public saveTransaction(tx: Transaction): Transaction {
    this.transactions.set(tx.id, tx);
    return tx;
  }

  public getTransactionsByWallet(walletId: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.walletId === walletId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  public saveLedgerEntries(entries: LedgerEntry[]) {
    // Audit trail integrity check (Double-entry arithmetic)
    let totalDebit = 0;
    let totalCredit = 0;
    
    entries.forEach(e => {
      totalDebit += e.debit;
      totalCredit += e.credit;
      this.ledger.set(e.id, e);
    });
    
    // Check constraint using small epsilon for floating point logic
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
       throw new Error("Double-entry accounting constraint violation: Debits must equal Credits");
    }
  }
}

export const walletRepository = new WalletRepository();
