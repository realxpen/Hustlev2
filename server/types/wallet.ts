export interface Wallet {
  id: string;
  ownerId: string;
  balance: number;
  escrowBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalSpending: number;
  currency: string;
  payoutMethod?: {
    type: 'bank' | 'paypal' | 'crypto';
    details: any;
  };
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'deposit' | 'escrow payment' | 'payout' | 'refund' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'escrow';

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  sub: string;
  date: string;
  referenceId?: string; // bookingId, etc
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  account: string; // e.g. "USER_WALLET_123", "SYSTEM_BANK", "USER_ESCROW_123"
  debit: number;
  credit: number;
  createdAt: string;
}
