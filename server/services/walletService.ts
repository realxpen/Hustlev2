import { walletRepository } from "../repositories/walletRepository";
import { Wallet, Transaction, LedgerEntry, TransactionType, TransactionStatus } from "../types/wallet";
import crypto from "crypto";

export class WalletService {
  
  public getOrCreateWallet(ownerId: string): Wallet {
    let wallet = walletRepository.getWalletByOwnerId(ownerId);
    if (!wallet) {
      wallet = walletRepository.createWallet(ownerId);
    }
    return wallet;
  }

  public getTransactions(ownerId: string): Transaction[] {
    const wallet = this.getOrCreateWallet(ownerId);
    return walletRepository.getTransactionsByWallet(wallet.id);
  }

  private performDoubleEntry(
    txId: string, 
    debitAccount: string, 
    creditAccount: string, 
    amount: number
  ) {
    const entry1: LedgerEntry = {
      id: crypto.randomUUID(),
      transactionId: txId,
      account: debitAccount,
      debit: amount,
      credit: 0,
      createdAt: new Date().toISOString()
    };
    const entry2: LedgerEntry = {
      id: crypto.randomUUID(),
      transactionId: txId,
      account: creditAccount,
      debit: 0,
      credit: amount,
      createdAt: new Date().toISOString()
    };
    walletRepository.saveLedgerEntries([entry1, entry2]);
  }

  public deposit(ownerId: string, amount: number, sourceName: string): Transaction {
    if (amount <= 0) throw new Error("Deposit amount must be positive");
    
    const wallet = this.getOrCreateWallet(ownerId);
    const txId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // 1. Create Transaction
    const tx: Transaction = {
      id: txId,
      walletId: wallet.id,
      amount,
      type: 'deposit',
      status: 'completed',
      title: 'Funds Added',
      sub: `From ${sourceName}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: now
    };
    
    walletRepository.saveTransaction(tx);
    
    // 2. Ledger Recording
    // Debit System Bank, Credit User Wallet
    this.performDoubleEntry(txId, 'SYSTEM_BANK', `USER_WALLET_${wallet.id}`, amount);
    
    // 3. Update Balances
    walletRepository.updateWallet(wallet.id, {
      balance: wallet.balance + amount
    });
    
    return tx;
  }

  public withdraw(ownerId: string, amount: number, destinationName: string): Transaction {
    if (amount <= 0) throw new Error("Withdraw amount must be positive");
    
    const wallet = this.getOrCreateWallet(ownerId);
    if (wallet.balance < amount) {
      throw new Error("Insufficient funds for withdrawal");
    }
    
    const txId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const tx: Transaction = {
      id: txId,
      walletId: wallet.id,
      amount: -amount,
      type: 'withdrawal',
      status: 'pending',
      title: 'Withdrawal Request',
      sub: `To ${destinationName}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: now
    };
    
    walletRepository.saveTransaction(tx);
    
    // Debit User Wallet, Credit System Bank
    this.performDoubleEntry(txId, `USER_WALLET_${wallet.id}`, 'SYSTEM_BANK', amount);
    
    walletRepository.updateWallet(wallet.id, {
      balance: wallet.balance - amount,
      pendingBalance: wallet.pendingBalance + amount 
    });
    
    // Note: Simulating pending -> completed offline (for demo logic it stays pending initially)
    return tx;
  }

  public transfer(senderId: string, recipientHustleName: string, amount: number): Transaction {
    if (amount <= 0) throw new Error("Transfer amount must be positive");
    
    const senderWallet = this.getOrCreateWallet(senderId);
    
    // Usually we would find recipient wallet. Since this is an MVP without exact target id, we mock it.
    if (senderWallet.balance < amount) {
      throw new Error("Insufficient funds for transfer");
    }
    
    const txIdSender = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const txSender: Transaction = {
      id: txIdSender,
      walletId: senderWallet.id,
      amount: -amount,
      type: 'payout', // representing transfer out
      status: 'completed',
      title: 'Transfer Sent',
      sub: `To ${recipientHustleName}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: now
    };
    
    walletRepository.saveTransaction(txSender);
    
    this.performDoubleEntry(txIdSender, `USER_WALLET_${senderWallet.id}`, 'SYSTEM_DUMMY_RECIPIENT', amount);
    
    walletRepository.updateWallet(senderWallet.id, {
      balance: senderWallet.balance - amount,
      totalSpending: senderWallet.totalSpending + amount
    });
    
    return txSender;
  }

  // Used by booking service when funds are escrowed
  public lockEscrow(ownerId: string, amount: number, referenceId: string): Transaction {
    const wallet = this.getOrCreateWallet(ownerId);
    if (wallet.balance < amount) {
      throw new Error("Insufficient funds for escrow booking");
    }

    const txId = crypto.randomUUID();
    const tx: Transaction = {
      id: txId,
      walletId: wallet.id,
      amount: -amount,
      type: 'escrow payment',
      status: 'escrow',
      title: 'Funds Escrowed',
      sub: `Booking Lock #${referenceId.substring(0, 8)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      referenceId
    };

    walletRepository.saveTransaction(tx);
    this.performDoubleEntry(txId, `USER_WALLET_${wallet.id}`, `USER_ESCROW_${wallet.id}`, amount);
    
    walletRepository.updateWallet(wallet.id, {
      balance: wallet.balance - amount,
      escrowBalance: wallet.escrowBalance + amount,
      totalSpending: wallet.totalSpending + amount
    });

    return tx;
  }

  // Used when releasing escrow
  public releaseEscrow(ownerId: string, sellerId: string, amount: number, referenceId: string): void {
     // Implementation omitted for brevity but available if needed, usually we move money from consumer escrow -> seller balance
  }
}

export const walletService = new WalletService();
