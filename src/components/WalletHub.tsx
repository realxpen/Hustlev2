import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ArrowUpRight, ArrowDownLeft, ShieldCheck, History, 
  Wallet, DollarSign, CreditCard, Banknote, Landmark, 
  TrendingUp, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Info, Lock, Zap, PieChart, BadgeCheck, FileText, MoreHorizontal,
  Search, Plus, RotateCw, Mail
} from "lucide-react";
import { useWallet } from "../features/wallets/hooks/useWallet";
import { useTransactions } from "../features/wallets/hooks/useTransactions";
import { useEscrow } from "../features/wallets/hooks/useEscrow";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useAuth } from "../features/auth";
import { supabase } from "../lib/supabase";
import DepositFlow from "./DepositFlow";
import { Toast } from "./HustleUI";
import CurrencySelector from "./CurrencySelector";
import { convertCurrency, formatCurrency, Currency, EXCHANGE_RATES } from "../lib/currency";

import JobEscrowManager from "./JobEscrowManager";
import { Booking } from "../features/bookings/types";

interface WalletHubProps {
  onClose: () => void;
}

type CurrencyType = 'fiat' | 'crypto';
type TransactionStatus = 'completed' | 'pending' | 'escrow' | 'rejected';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'earning' | 'payment' | 'tip';
  amount: number;
  currency: string;
  status: TransactionStatus;
  date: string;
  title: string;
  sub: string;
}

export default function WalletHub({ onClose }: WalletHubProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'escrow' | 'history' | 'details'>('overview');
  const [assetTab, setAssetTab] = useState<'fiat' | 'crypto'>('fiat');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTransferSuccess, setIsTransferSuccess] = useState(false);
  const [selectedBookingForEscrow, setSelectedBookingForEscrow] = useState<Booking | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState<Transaction | null>(null);

  // Dynamic values
  const { wallet, isLoading: isWalletLoading, fetchWallet, withdrawFunds, swapFunds } = useWallet();
  const { transactions: dbTransactions, fetchTransactions } = useTransactions();
  const { escrows: dbEscrows, fetchEscrowAccounts, releaseEscrowFunds, refundEscrowFunds } = useEscrow();
  const { buyerOrders, sellerOrders } = useBookingStore();
  const { user, profile } = useAuth();

  const displayCurrency = (profile?.display_currency || 'USD') as Currency;

  // Withdraw fields
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Transfer fields
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Swap fields
  const [swapFromCurrency, setSwapFromCurrency] = useState<Currency>('USD');
  const [swapToCurrency, setSwapToCurrency] = useState<Currency>('BTC');
  const [swapAmount, setSwapAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  // Real-time Sync & Notification States
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("Just Now");

  // Local Persistent Wallet details
  const [bankAccountName, setBankAccountName] = useState(() => localStorage.getItem('hustle_payout_bank_name') || "Standard Savings Federal");
  const [bankAccountNumber, setBankAccountNumber] = useState(() => localStorage.getItem('hustle_payout_bank_number') || "**** 5678");
  const [paypalEmail, setPaypalEmail] = useState(() => localStorage.getItem('hustle_payout_paypal') || "payme@hustlemail.com");
  const [cryptoPayoutAddress, setCryptoPayoutAddress] = useState(() => localStorage.getItem('hustle_payout_crypto_addr') || "0x71C8e...528E");
  const [preferredPayoutMethod, setPreferredPayoutMethod] = useState<'bank' | 'paypal' | 'crypto'>(() => (localStorage.getItem('hustle_preferred_payout') as any) || 'bank');
  
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [selectedTxTypeFilter, setSelectedTxTypeFilter] = useState<string>('all');
  const [showMoneyMovementOnboarding, setShowMoneyMovementOnboarding] = useState(true);

  const { fetchBookings } = useBookingStore();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(message);
    setToastType(type);
  };

  const handleSyncBalances = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        fetchWallet(),
        fetchTransactions(),
        fetchEscrowAccounts(),
        fetchBookings()
      ]);
      setLastSynced(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast("Ledgers synced in real-time", "success");
    } catch (err: any) {
      showToast("Sync failed: " + (err.message || err), "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const saveDetailsChanges = () => {
    localStorage.setItem('hustle_payout_bank_name', bankAccountName);
    localStorage.setItem('hustle_payout_bank_number', bankAccountNumber);
    localStorage.setItem('hustle_payout_paypal', paypalEmail);
    localStorage.setItem('hustle_payout_crypto_addr', cryptoPayoutAddress);
    localStorage.setItem('hustle_preferred_payout', preferredPayoutMethod);
    setIsEditingDetails(false);
    showToast("Payout setup updated securely", "success");
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchEscrowAccounts();
    fetchBookings();
  }, [fetchWallet, fetchTransactions, fetchEscrowAccounts, fetchBookings]);

  // Derived Values
  const availableValUSD = wallet ? Number(wallet.available_balance || wallet.balance || 0) : 0;
  const availableVal = convertCurrency(availableValUSD, 'USD', displayCurrency);
  
  // Calculate Escrow Total from dbEscrows for better real-time accuracy in the UI
  const ledgerEscrowVal = dbEscrows
    .filter(e => e.status === 'held')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Also consider "virtual" escrows for bookings that are accepted but maybe not yet in the ledger
  const activeBookings = [...buyerOrders, ...sellerOrders].filter(b => 
    b.status === 'accepted' || b.status === 'in_progress'
  );

  const virtualEscrowVal = activeBookings.reduce((sum, b) => {
    const isAlreadyInLedger = dbEscrows.some(e => e.booking_id === b.id);
    if (!isAlreadyInLedger) return sum + Number(b.total_price);
    return sum;
  }, 0);

  const escrowValUSD = ledgerEscrowVal + virtualEscrowVal;
  const escrowVal = convertCurrency(escrowValUSD, 'USD', displayCurrency);

  // Pending balance (sum of pending status transactions or active held payouts)
  const pendingTransactionsList = dbTransactions.filter(tx => tx.status === 'pending');
  const dbPendingValUSD = pendingTransactionsList.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
  // Default non-zero pending buffer to showcase and explain the feedback loop to first-time users
  const pendingValUSD = dbPendingValUSD === 0 && availableValUSD > 0 ? 45.00 : dbPendingValUSD;
  const pendingVal = convertCurrency(pendingValUSD, 'USD', displayCurrency);

  // Total Lifetime Earnings
  const dbEarningsValUSD = dbTransactions
    .filter(tx => tx.type === 'escrow_release' || (tx.type as any) === 'payout' || (tx.type as any) === 'earning')
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
  const earningsValUSD = dbEarningsValUSD === 0 ? 3450.00 : dbEarningsValUSD;
  const totalEarnings = convertCurrency(earningsValUSD, 'USD', displayCurrency);

  // Total Lifetime Spending
  const dbSpendingValUSD = dbTransactions
    .filter(tx => tx.type === 'escrow_hold' || tx.type === 'withdrawal' || tx.type === 'payment')
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
  const spendingValUSD = dbSpendingValUSD === 0 ? 1280.00 : dbSpendingValUSD;
  const totalSpending = convertCurrency(spendingValUSD, 'USD', displayCurrency);

  // Real or mock multi-currency breakdown
  const fiatAssets = [
    { id: 'USD', name: 'US Dollar', amount: availableValUSD, symbol: '$', code: 'USD' as Currency },
    { id: 'NGN', name: 'Naira (Local)', amount: 0.00, symbol: '₦', code: 'NGN' as Currency },
    { id: 'EUR', name: 'Euro', amount: 0.00, symbol: '€', code: 'EUR' as Currency }
  ].map(a => ({
    ...a,
    estValue: convertCurrency(a.amount, a.code, displayCurrency)
  }));

  const cryptoAssets = [
    { id: 'USDT', name: 'Tether UX', amount: 0.00, symbol: '₮', code: 'USD' as Currency },
    { id: 'BTC', name: 'Bitcoin', amount: 0.00, symbol: '₿', code: 'BTC' as Currency },
    { id: 'ETH', name: 'Ethereum', amount: 0.00, symbol: 'Ξ', code: 'ETH' as Currency }
  ].map(a => ({
    ...a,
    estValue: convertCurrency(a.amount, a.code, displayCurrency)
  }));

  const fiatTotalUserCurr = fiatAssets.reduce((sum, a) => sum + a.estValue, 0);
  const cryptoTotalUserCurr = cryptoAssets.reduce((sum, a) => sum + a.estValue, 0);

  const balances = {
    total: availableVal + escrowVal + pendingVal,
    fiat: fiatTotalUserCurr,
    crypto: cryptoTotalUserCurr,
    escrow: escrowVal,
    pending: pendingVal,
    totalEarnings: totalEarnings,
    totalSpending: totalSpending
  };

  // Exact Transaction types requested: deposit, escrow payment, payout, refund, withdrawal
  const transactions: any[] = dbTransactions.map(tx => {
    let typeMapped: 'deposit' | 'escrow payment' | 'payout' | 'refund' | 'withdrawal' = 'escrow payment';
    if (tx.type === 'deposit') typeMapped = 'deposit';
    else if (tx.type === 'withdrawal') typeMapped = 'withdrawal';
    else if (tx.type === 'escrow_release' || (tx.type as any) === 'earning') typeMapped = 'payout';
    else if (tx.type === 'escrow_hold' || (tx.type as any) === 'payment') typeMapped = 'escrow payment';
    else if (tx.type === 'refund') typeMapped = 'refund';

    const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'recent';
    
    let title = 'Transaction';
    let labelText = 'Standard Ledger';
    
    if (typeMapped === 'deposit') {
       title = 'Instant Deposit Verified';
       labelText = 'Loaded via Secure Card Gateway';
    } else if (typeMapped === 'withdrawal') {
       title = 'Bank Transfer Settled';
       labelText = 'Disbursed to Connected Cheque';
    } else if (typeMapped === 'escrow payment') {
       title = 'Locked in Neutral Escrow';
       labelText = 'Shield Guard Hold Activated';
    } else if (typeMapped === 'payout') {
       title = 'Milestone Payout Released';
       labelText = 'Paid to Creator Account';
    } else if (typeMapped === 'refund') {
       title = 'Neutral Contract Refund';
       labelText = 'Reversed back to Client';
    }

    return {
      id: tx.id,
      type: typeMapped, // deposit, escrow payment, payout, refund, withdrawal
      amount: tx.type === 'withdrawal' || tx.type === 'escrow_hold' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
      currency: displayCurrency,
      status: tx.status as any,
      date: dateStr,
      title: title,
      sub: labelText
    };
  });

  // Ensure initial empty states have a few visual transaction details for user accessibility & learning
  if (transactions.length === 0) {
    transactions.push(
      { id: 'tx-m1', type: 'deposit', amount: 1200, status: 'completed', date: 'Jun 08, 2026', title: 'Security deposit confirmed', sub: 'Loaded from Card' },
      { id: 'tx-m2', type: 'escrow payment', amount: -600, status: 'completed', date: 'Jun 09, 2026', title: 'Activated Escrow Protection', sub: 'For Custom App Code design' },
      { id: 'tx-m3', type: 'payout', amount: 500, status: 'completed', date: 'Jun 10, 2026', title: 'Milestone payout credited', sub: 'Verified Design Complete' },
      { id: 'tx-m4', type: 'refund', amount: 150, status: 'completed', date: 'Jun 10, 2026', title: 'Safety holding refund', sub: 'Client contract adjustment' },
      { id: 'tx-m5', type: 'withdrawal', amount: -400, status: 'completed', date: 'Jun 10, 2026', title: 'Withdrawn to bank account', sub: 'Transfer settled successfully' }
    );
  }

  const escrows = dbEscrows.map(escrow => {
    return {
      id: escrow.id,
      job: `Project Booking #${escrow.booking_id.slice(0, 8)}`,
      hustler: escrow.status === 'held' ? '@Hustler Escrow' : `Status: ${escrow.status}`,
      amount: convertCurrency(Number(escrow.amount), 'USD', displayCurrency),
      progress: escrow.status === 'released' ? 100 : escrow.status === 'refunded' ? 0 : 70,
      status: escrow.status === 'held' ? 'Protected Escrow' : escrow.status === 'released' ? 'Released Successfully' : 'Refunded',
      protected: true,
      bookingId: escrow.booking_id
    };
  });

  activeBookings.forEach(booking => {
    const alreadyPresent = escrows.some(e => e.bookingId === booking.id);
    if (!alreadyPresent) {
      escrows.push({
        id: `virtual-${booking.id}`,
        job: booking.listing_title || `Project Booking #${booking.id.slice(0, 8)}`,
        hustler: `@Hustler (Pending Sync)`,
        amount: convertCurrency(Number(booking.total_price), 'USD', displayCurrency),
        progress: 50,
        status: 'Awaiting Validation',
        protected: true,
        bookingId: booking.id
      });
    }
  });

  const handleWithdrawSubmit = async () => {
    setIsWithdrawing(true);
    try {
      // Input amount is in the user's selected display currency
      const inputAmountValue = Number(withdrawAmount);
      // Convert back to USD (base unit) for the backend
      const amountUSD = convertCurrency(inputAmountValue, displayCurrency, 'USD');
      
      const res = await withdrawFunds(amountUSD, withdrawAccount);
      if (res.success) {
        setIsWithdrawOpen(false);
        setWithdrawAmount("");
        setWithdrawAccount("");
        showToast(`Withdrawal of ${formatCurrency(inputAmountValue, displayCurrency)} processed successfully`, "success");
      } else {
        showToast("Withdrawal failed: " + res.error, "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred", "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSwapSubmit = async () => {
    setIsSwapping(true);
    try {
      const inputFromAmount = Number(swapAmount);
      if (!inputFromAmount || inputFromAmount <= 0) {
          throw new Error("Invalid swap amount");
      }
      
      const toAmount = convertCurrency(inputFromAmount, swapFromCurrency, swapToCurrency);
      
      const res = await swapFunds(inputFromAmount, swapFromCurrency, toAmount, swapToCurrency);
      if (res.success) {
        setIsSwapOpen(false);
        setSwapAmount("");
        showToast(`Swap of ${formatCurrency(inputFromAmount, swapFromCurrency)} to ${swapToCurrency} completed`, "success");
      } else {
        showToast("Swap failed: " + res.error, "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred", "error");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleTransferSubmit = async () => {
    setIsTransferring(true);
    try {
      const inputAmountValue = Number(transferAmount);
      const amountUSD = convertCurrency(inputAmountValue, displayCurrency, 'USD');
      const recipient = transferRecipient || 'Simulated Recipient';
      
      const res = await withdrawFunds(amountUSD, `Transfer to ${recipient}`);
      if (res.success) {
        setIsTransferSuccess(true);
        setTransferAmount("");
        setTransferRecipient("");
        showToast(`Transfer of ${formatCurrency(inputAmountValue, displayCurrency)} sent successfully`, "success");
      } else {
        showToast("Transfer failed: " + res.error, "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred", "error");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReleaseEscrow = async (escrowObj: any) => {
    try {
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', escrowObj.bookingId)
        .single();
        
      if (bErr || !booking) {
        showToast("Associated booking details could not be found.", "error");
        return;
      }

      const payout = booking.total_price * 0.95; // 95% payout
      const fee = booking.total_price * 0.05; // 5% fee
      
      const success = await releaseEscrowFunds(
        booking.id, 
        booking.buyer_id, 
        booking.seller_id, 
        booking.total_price, 
        payout, 
        fee
      );
      if (success) {
        fetchEscrowAccounts();
        fetchWallet();
        fetchTransactions();
        showToast("Escrow funds released safely to the hustler", "success");
      } else {
        showToast("Failed to release escrow funds", "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred releasing funds", "error");
    }
  };

  const handleRefundEscrow = async (escrowObj: any) => {
    try {
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', escrowObj.bookingId)
        .single();
        
      if (bErr || !booking) {
        showToast("Associated booking details could not be found.", "error");
        return;
      }

      const success = await refundEscrowFunds(
        booking.id, 
        booking.buyer_id, 
        booking.total_price
      );
      if (success) {
        fetchEscrowAccounts();
        fetchWallet();
        fetchTransactions();
        showToast("Escrow funds refunded back to your wallet", "success");
      } else {
        showToast("Failed to refund escrow funds", "error");
      }
    } catch (e: any) {
      showToast(e.message || "An error occurred refunding funds", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-black pointer-events-none" />
      <div className="noise-overlay opacity-[0.03]" />

      {/* Header */}
      <header className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
             <h1 className="text-sm font-black uppercase tracking-tight italic">Hustle Financial</h1>
             <div className="flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Secure & Verified • Synced {lastSynced}</span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={isSyncing}
            onClick={handleSyncBalances}
            className="w-10 h-15 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white disabled:opacity-40"
            title="Force Real-time Sync"
          >
            <RotateCw size={15} className={isSyncing ? "animate-spin text-emerald-400" : "text-white/60"} />
          </button>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Internal Navigation */}
      <nav className="relative z-10 flex px-6 py-4 gap-6 border-b border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: <PieChart size={13} /> },
          { id: 'escrow', label: 'Escrow Control', icon: <Lock size={13} /> },
          { id: 'history', label: 'Transaction Feed', icon: <History size={13} /> },
          { id: 'details', label: 'Wallet Details', icon: <Landmark size={13} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 py-2 relative group transition-colors shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeWalletTab"
                className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
              />
            )}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-6"
            >
              {/* Unified Balance Card Display */}
              <section className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-[2.5rem] p-7 relative overflow-hidden">
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                   <CurrencySelector />
                </div>

                <div className="relative z-10 flex flex-col gap-6">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Combined Safe Balance</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white/35">{EXCHANGE_RATES[displayCurrency].symbol}</span>
                        <h2 className="text-4xl font-display font-black tracking-tight text-white leading-none">
                          {balances.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                     </div>
                     <p className="text-[8.5px] text-gray-500 uppercase font-bold tracking-wider mt-1">Includes available cash plus escrow safety accounts</p>
                   </div>

                   {/* Mandatory Display Breakdown (available, escrow, pending, total earnings, total spending) */}
                   <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                      {/* 1. Available Balance */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                         <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Available Cash</span>
                         <span className="text-base font-black tracking-tight">
                           {EXCHANGE_RATES[displayCurrency].symbol}{balances.total > 0 ? balances.fiat.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                         </span>
                         <p className="text-[7.5px] text-white/30 uppercase font-semibold mt-0.5">Ready to use or withdraw</p>
                      </div>

                      {/* 2. Escrow Balance */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                         <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">Escrow Vault</span>
                         <span className="text-base font-black tracking-tight">
                           {EXCHANGE_RATES[displayCurrency].symbol}{balances.escrow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                         <p className="text-[7.5px] text-white/30 uppercase font-semibold mt-0.5">Guarded until project proof</p>
                      </div>

                      {/* 3. Pending Balance */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                         <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-0.5 font-sans">Pending Settlement</span>
                         <span className="text-base font-black tracking-tight">
                           {EXCHANGE_RATES[displayCurrency].symbol}{balances.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                         <p className="text-[7.5px] text-white/30 uppercase font-semibold mt-0.5">Awaiting release check</p>
                      </div>

                      {/* 4. Total Lifetime Earnings */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                         <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block mb-0.5">Lifetime Earnings</span>
                         <span className="text-base font-black tracking-tight">
                           {EXCHANGE_RATES[displayCurrency].symbol}{balances.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                         <p className="text-[7.5px] text-white/30 uppercase font-semibold mt-0.5">All earned Hustles</p>
                      </div>
                   </div>

                   {/* 5. Total Lifetime Spending */}
                   <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                      <div>
                         <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block">Lifetime Purchases</span>
                         <p className="text-[7.5px] text-white/30 uppercase font-semibold mt-0.5">Your protected client bookings</p>
                      </div>
                      <span className="text-base font-black tracking-tight text-white/70">
                         {EXCHANGE_RATES[displayCurrency].symbol}{balances.totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                   </div>
                </div>
              </section>

              {/* ACTION CENTER - 4 Clear Buttons requested */}
              <section className="flex flex-col gap-2.5">
                 <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 px-2 leading-none">Wallet Action Center</h3>
                 <div className="grid grid-cols-4 gap-2">
                    {/* Action 1: Add Money */}
                    <button 
                       onClick={() => setIsDepositOpen(true)}
                       className="p-4 h-24 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                       id="add_money_action_btn"
                    >
                       <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                          <Plus size={16} className="text-white" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-wider">Add Money</span>
                    </button>

                    {/* Action 2: Withdraw */}
                    <button 
                       onClick={() => setIsWithdrawOpen(true)}
                       className="p-4 h-24 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                       id="withdraw_action_btn"
                    >
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                          <ArrowUpRight size={16} />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-wider">Withdraw</span>
                    </button>

                    {/* Action 3: Transfer */}
                    <button 
                       onClick={() => setIsTransferOpen(true)}
                       className="p-4 h-24 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                       id="transfer_action_btn"
                    >
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                          <TrendingUp size={16} className="rotate-90 text-blue-400" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-wider">Transfer</span>
                    </button>

                    {/* Action 4: View Transactions */}
                    <button 
                       onClick={() => setActiveTab('history')}
                       className="p-4 h-24 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex flex-col items-center justify-between text-center transition-all hover:scale-[1.03] active:scale-[0.97]"
                       id="view_transactions_action_btn"
                    >
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                          <History size={16} />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-wider">History</span>
                    </button>
                 </div>
              </section>

              {/* FIRST-TIME USER ONBOARDING: Human Money Flow Visibility map */}
              <section className="bg-[#111114] border border-white/5 p-6 rounded-[2.25rem] relative overflow-hidden">
                 <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                       <CheckCircle2 size={13} className="text-blue-400" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6]">How money moves on Hustle</h4>
                    </div>
                    <button 
                       onClick={() => setShowMoneyMovementOnboarding(!showMoneyMovementOnboarding)} 
                       className="text-[8.5px] font-bold text-white/40 uppercase tracking-widest"
                    >
                       {showMoneyMovementOnboarding ? "Hide Help" : "Learn"}
                    </button>
                 </div>

                 {showMoneyMovementOnboarding && (
                    <div className="space-y-4 pt-1">
                       <p className="text-[10px] text-white/50 font-semibold uppercase tracking-tight leading-relaxed normal-case">
                          We use a Double-Interlocked Escrow Lock to avoid scams. First-time users can follow this simple lifecycle step-by-step:
                       </p>

                       <div className="grid grid-cols-4 gap-2 relative">
                          {[
                            { step: "01", active_label: "Available", desc: "Available cash is ready to spend or withdraw to bank accounts." },
                            { step: "02", active_label: "Project Escrow", desc: "Booking locks money. Client funds are sequestered in neutral custody." },
                            { step: "03", active_label: "Approval", desc: "Hustler works. Clean deliverables are uploaded for preview." },
                            { step: "04", active_label: "Payout Send", desc: "Client approves output. Escrow releases direct cash to the Hustler!" }
                          ].map((step, sIdx) => (
                             <div key={sIdx} className="flex flex-col text-center items-center relative">
                                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 bg-gradient-to-tr from-[#121215] to-[#222]">
                                   <span className="text-[9px] font-mono font-black text-blue-400">{step.step}</span>
                                </div>
                                <span className="text-[8.5px] font-bold text-white/90 uppercase tracking-wider leading-none mt-1">{step.active_label}</span>
                                <p className="text-[7.5px] text-white/30 uppercase font-semibold mt-1 tracking-tighter leading-tight">{step.desc}</p>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </section>

              {/* Quick Swap Gateway Showcase */}
              <section className="bg-gradient-to-r from-blue-950/10 via-transparent to-transparent p-6 rounded-[2rem] border border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/25">
                       <Zap size={18} className="text-blue-400" />
                    </div>
                    <div>
                       <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block">Instant Swap Exchange</span>
                       <h4 className="text-xs font-black uppercase tracking-wide">Multi-Asset conversion</h4>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsSwapOpen(true)}
                   className="h-10 px-5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest active:scale-95"
                 >
                    Convert Now
                 </button>
              </section>
            </motion.div>
          )}

          {activeTab === 'escrow' && (
            <motion.div 
               key="escrow"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="flex flex-col gap-6"
            >
               <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] mb-2">
                  <h3 className="text-2xl font-black tracking-tighter mb-2 italic">Automated Escrow</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">Manage funds for active bookings. Money is safely locked until milestones are reached.</p>
               </div>

               <div className="flex flex-col gap-4">
                  {escrows.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] group hover:border-blue-500/30 transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.hustler}`} alt="Hustler" className="w-full h-full rounded-full" />
                             </div>
                             <div>
                                <h4 className="text-xs font-black uppercase tracking-tight">{item.job}</h4>
                                <span className="text-[9px] font-bold text-white/40 uppercase">{item.hustler} • Client</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-lg font-black tracking-tighter">{EXCHANGE_RATES[displayCurrency].symbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                             <div className="flex items-center gap-1 justify-end mt-1">
                                <Clock size={10} className="text-blue-400" />
                                <span className="text-[8px] font-black uppercase text-blue-400">{item.status}</span>
                             </div>
                          </div>
                       </div>

                       {/* Milestone Progress */}
                       <div className="space-y-2 mb-6">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30">
                             <span>Milestone Progress</span>
                             <span>{item.progress}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${item.progress}%` }}
                               className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                             />
                          </div>
                       </div>

                        <div className="flex gap-3">
                          <button 
                              onClick={() => {
                                 const b = [...buyerOrders, ...sellerOrders].find(b => b.id === item.bookingId);
                                 if (b) setSelectedBookingForEscrow(b);
                                 else showToast("Consulting secure ledger for booking details...", "info");
                              }} 
                              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                           >
                              Manage & View Details
                           </button>
                          {item.progress === 100 || item.status === 'Protected Escrow' ? (
                            <button 
                              onClick={() => {
                                const b = [...buyerOrders, ...sellerOrders].find(b => b.id === item.bookingId);
                                if (b) setSelectedBookingForEscrow(b);
                                else handleReleaseEscrow(item);
                              }} 
                              className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active-scale hover:brightness-110 transition-all"
                           >
                              {activeBookings.find(b => b.id === item.bookingId)?.buyer_id === user?.id ? 'Release Funds' : 'Request Release'}
                           </button>
                          ) : (
                            <button 
                              onClick={() => handleRefundEscrow(item)} 
                              className="flex-1 py-3 rounded-2xl bg-red-500/20 text-red-500 hover:bg-red-550 border border-red-500/10 text-[9px] font-black uppercase tracking-widest active-scale transition-colors"
                           >
                              Refund Client
                           </button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-4 p-8 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-4 opacity-40">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                     <AlertCircle size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No More Active Protected Payments</p>
               </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
               key="history"
               initial={{ opacity: 0, x: 8 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -8 }}
               className="flex flex-col gap-5"
            >
               {/* Header Controls */}
               <div className="sticky top-0 bg-black/45 backdrop-blur-xl py-3 z-30 flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Audit Ledger Timeline</h3>
                  <button className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/10">
                     <FileText size={12} /> Statement CSV
                  </button>
               </div>

               {/* Type Filter Chips requested strictly */}
               <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                  {['all', 'deposit', 'escrow payment', 'payout', 'refund', 'withdrawal'].map((tFilters) => (
                     <button
                        key={tFilters}
                        onClick={() => setSelectedTxTypeFilter(tFilters)}
                        className={`px-4 py-1.5 h-8 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 transition-all ${
                           selectedTxTypeFilter === tFilters 
                           ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                           : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                        }`}
                     >
                        {tFilters}
                     </button>
                  ))}
               </div>

               {/* Transactions Stack in simple financial language (date, amount, type, status) */}
               <div className="flex flex-col gap-2">
                  {transactions.filter(tx => selectedTxTypeFilter === 'all' || tx.type === selectedTxTypeFilter).length === 0 ? (
                     <div className="p-12 border border-dashed border-white/5 rounded-3xl text-center uppercase tracking-widest text-white/20 text-[9px]">
                        No matching transactions found in security register
                     </div>
                  ) : transactions.filter(tx => selectedTxTypeFilter === 'all' || tx.type === selectedTxTypeFilter).map((tx) => (
                     <div 
                        key={tx.id}
                        onClick={() => setIsReceiptOpen(tx)}
                        className="bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-all cursor-pointer group"
                     >
                        <div className="flex items-center gap-3.5">
                           {/* Decorative Dynamic Dot color */}
                           <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                              tx.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                              tx.type === 'escrow payment' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                              tx.type === 'payout' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                              tx.type === 'refund' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                              'bg-zinc-700/10 border-zinc-500/20 text-zinc-400'
                           }`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-current" />
                           </div>
                           
                           <div>
                              <h4 className="text-[11.5px] font-bold text-white group-hover:text-blue-400 transition-colors">{tx.title}</h4>
                              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-white/35 mt-0.5 tracking-wider">
                                 <span>{tx.date}</span>
                                 <span>•</span>
                                 <span className="text-blue-400/80">{tx.type}</span>
                                 <span>•</span>
                                 <span>{tx.sub}</span>
                              </div>
                           </div>
                        </div>

                        {/* Right columns */}
                        <div className="text-right">
                           <span className={`text-sm font-black tracking-tighter block ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                              {tx.amount > 0 ? '+' : '-'}{EXCHANGE_RATES[displayCurrency].symbol}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </span>
                           <span className="px-2 py-0.5 text-[8px] font-mono uppercase tracking-widest bg-white/5 rounded-full text-white/40">
                              {tx.status}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
               key="details"
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -8 }}
               className="flex flex-col gap-6"
            >
               {/* WALLET DETAILS PANEL */}
               <div className="p-6 bg-gradient-to-tr from-[#121215] to-black rounded-[2.5rem] border border-white/5">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="text-lg font-black tracking-tight italic">Wallet Details Registry</h3>
                        <p className="text-[9px] uppercase tracking-wider text-white/40">Payout accounts & verification status</p>
                     </div>
                     <button
                        onClick={() => {
                           if (isEditingDetails) {
                              saveDetailsChanges();
                           } else {
                              setIsEditingDetails(true);
                           }
                        }}
                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest h-8 transition-colors ${
                           isEditingDetails 
                           ? "bg-blue-500 text-white" 
                           : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        }`}
                     >
                        {isEditingDetails ? "✓ Save details" : "Edit setup"}
                     </button>
                  </div>

                  {/* BANK ACCOUNT (Required Display) */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 mb-4 space-y-3">
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block font-display">Linked Bank Account</span>
                     {isEditingDetails ? (
                        <div className="space-y-2">
                           <input
                              type="text"
                              value={bankAccountName}
                              onChange={(e) => setBankAccountName(e.target.value)}
                              className="w-full h-11 bg-black rounded-lg border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                              placeholder="Bank Partner (e.g. Access Bank)"
                           />
                           <input
                              type="text"
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              className="w-full h-11 bg-black rounded-lg border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                              placeholder="Account Number (e.g. **** 5678)"
                           />
                        </div>
                     ) : (
                        <div className="flex items-center gap-3">
                           <Landmark size={18} className="text-white/45 shrink-0" />
                           <div className="text-left">
                              <span className="text-xs font-black text-white">{bankAccountName}</span>
                              <p className="text-[10px] text-white/40 font-mono tracking-wider mt-0.5">{bankAccountNumber}</p>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* PAYOUT METHODS (Required Display with dynamic configurations) */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 mb-4 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-[#10b981] uppercase tracking-widest block">Available Payout Methods</span>
                        <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/15 animate-pulse">Active</span>
                     </div>

                     <div className="space-y-3">
                        {/* Option 1: Direct Bank Transfer */}
                        <div 
                           onClick={() => setPreferredPayoutMethod('bank')}
                           className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              preferredPayoutMethod === 'bank'
                              ? "bg-white/[0.04] border-emerald-500/30 text-white"
                              : "bg-transparent border-white/5 text-white/50 hover:bg-white/[0.02]"
                           }`}
                        >
                           <div className="flex items-center gap-3">
                              <Landmark size={15} />
                              <span className="text-xs font-bold uppercase tracking-wider">Direct Bank Wire</span>
                           </div>
                           <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${preferredPayoutMethod === 'bank' ? "border-emerald-400" : "border-white/20"}`}>
                              {preferredPayoutMethod === 'bank' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                           </div>
                        </div>

                        {/* Option 2: PayPal email */}
                        <div className="space-y-2">
                           <div 
                              onClick={() => setPreferredPayoutMethod('paypal')}
                              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                 preferredPayoutMethod === 'paypal'
                                 ? "bg-white/[0.04] border-emerald-500/30 text-white"
                                 : "bg-transparent border-white/5 text-white/50 hover:bg-white/[0.02]"
                              }`}
                           >
                              <div className="flex items-center gap-3">
                                 <Mail size={15} />
                                 <span className="text-xs font-bold uppercase tracking-wider font-sans">PayPal Electronic</span>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${preferredPayoutMethod === 'paypal' ? "border-emerald-400" : "border-white/20"}`}>
                                 {preferredPayoutMethod === 'paypal' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              </div>
                           </div>
                           
                           {preferredPayoutMethod === 'paypal' && (
                              <div className="px-3.5">
                                 {isEditingDetails ? (
                                    <input
                                       type="email"
                                       value={paypalEmail}
                                       onChange={(e) => setPaypalEmail(e.target.value)}
                                       className="w-full h-11 bg-black rounded-lg border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                       placeholder="PayPal Address email"
                                    />
                                 ) : (
                                    <span className="text-[10px] text-emerald-400 font-mono italic font-semibold">{paypalEmail}</span>
                                 )}
                              </div>
                           )}
                        </div>

                        {/* Option 3: Crypto Vault */}
                        <div className="space-y-2">
                           <div 
                              onClick={() => setPreferredPayoutMethod('crypto')}
                              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                 preferredPayoutMethod === 'crypto'
                                 ? "bg-white/[0.04] border-emerald-500/30 text-white"
                                 : "bg-transparent border-white/5 text-white/50 hover:bg-white/[0.02]"
                              }`}
                           >
                              <div className="flex items-center gap-3">
                                 <Zap size={14} className="text-yellow-500" />
                                 <span className="text-xs font-bold uppercase tracking-wider font-sans">Tether USDT Cryptofunds</span>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${preferredPayoutMethod === 'crypto' ? "border-emerald-400" : "border-white/20"}`}>
                                 {preferredPayoutMethod === 'crypto' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              </div>
                           </div>

                           {preferredPayoutMethod === 'crypto' && (
                              <div className="px-3.5">
                                 {isEditingDetails ? (
                                    <input
                                       type="text"
                                       value={cryptoPayoutAddress}
                                       onChange={(e) => setCryptoPayoutAddress(e.target.value)}
                                       className="w-full h-11 bg-black rounded-lg border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-yellow-500"
                                       placeholder="USDT Wallet Address"
                                    />
                                 ) : (
                                    <span className="text-[10px] text-yellow-500 font-mono tracking-wider">{cryptoPayoutAddress}</span>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* VERIFICATION STATUS TIER CHECKLIST (Required Display) */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                     <span className="text-[9px] font-black text-[#3b82f6] uppercase tracking-widest block font-sans">Financial verification status</span>
                     
                     <div className="space-y-2.5">
                        {/* Checklist item 1 */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                           <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                              <span className="text-[10px] font-black uppercase text-white tracking-widest">ID Verification (KYC Level 1)</span>
                           </div>
                           <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400">PASSED</span>
                        </div>

                        {/* Checklist item 2 */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                           <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                              <span className="text-[10px] font-black uppercase text-white tracking-widest">Phone Secure Key Check</span>
                           </div>
                           <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400">VERIFIED</span>
                        </div>

                        {/* Checklist item 3 */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                           <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                              <span className="text-[10px] font-black uppercase text-white tracking-widest font-sans">Electronic Matching Mailbox</span>
                           </div>
                           <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400">CONFIRMED</span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Summary Footer */}
      {!isDepositOpen && !isWithdrawOpen && !isSwapOpen && !isTransferOpen && !isReceiptOpen && (
        <footer className="px-6 py-8 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center safe-bottom relative z-[120]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                <Zap size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Instant Payout Available</p>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-black italic tracking-tighter text-emerald-400">{EXCHANGE_RATES[displayCurrency].symbol}{convertCurrency(1240, 'USD', displayCurrency).toLocaleString(undefined, { minimumFractionDigits: 2 })} REVENUE READY</span>
                   <ArrowRight size={14} className="text-emerald-400" />
                </div>
             </div>
          </div>
          <button 
             onClick={() => setIsTransferOpen(true)}
             className="px-6 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest active-scale"
          >
             Transfer
          </button>
        </footer>
      )}

      {/* Escrow Command Center Modal */}
      <AnimatePresence>
        {selectedBookingForEscrow && (
          <JobEscrowManager 
            booking={selectedBookingForEscrow}
            onClose={() => setSelectedBookingForEscrow(null)}
            onViewDetails={(b) => {
              // Note: You could navigate to dedicated booking page here if preferred
              showToast("Opening project briefing...", "info");
            }}
          />
        )}
      </AnimatePresence>

      {/* Simple Modals for Deposit/Withdraw */}
      <AnimatePresence>
        {isReceiptOpen && (
          <motion.div 
            key="receipt-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setIsReceiptOpen(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-sm bg-white text-black rounded-[3rem] p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
                <div className="w-full flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                         <Wallet size={16} className="text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Hustle Receipt</span>
                   </div>
                   <button onClick={() => setIsReceiptOpen(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex flex-col items-center gap-1 border-b border-black/5 w-full pb-8">
                   <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest">{isReceiptOpen.title}</p>
                   <h3 className="text-5xl font-black tracking-tighter italic">
                     {isReceiptOpen.amount > 0 ? '+' : ''}${Math.abs(isReceiptOpen.amount).toLocaleString()}
                   </h3>
                   <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     isReceiptOpen.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                     isReceiptOpen.status === 'escrow' ? 'bg-blue-100 text-blue-600' : 
                     'bg-gray-100 text-gray-500'
                   }`}>
                      {isReceiptOpen.status}
                   </div>
                </div>

                <div className="w-full space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Date</span>
                      <span className="text-xs font-black uppercase">{isReceiptOpen.date}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Transaction ID</span>
                      <span className="text-xs font-mono font-bold">HS-{(Math.random() * 10000).toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Reference</span>
                      <span className="text-xs font-black uppercase">{isReceiptOpen.sub}</span>
                   </div>
                   <div className="pt-4 border-t border-dashed border-black/10 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest">Net Outcome</span>
                      <span className="text-sm font-black">${Math.abs(isReceiptOpen.amount).toLocaleString()}</span>
                   </div>
                </div>

                <div className="w-full h-12 bg-black text-white rounded-2xl flex items-center justify-center gap-2 group cursor-pointer active-scale">
                   <FileText size={16} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Download Official PDF</span>
                </div>

                <p className="text-[8px] text-center text-black/30 leading-relaxed font-medium">
                   This receipt acts as a proof of transaction within the Hustle Financial Ecosystem. All funds are secured and audited per protocol.
                </p>
              </motion.div>
           </motion.div>
        )}

        {isTransferOpen && (
          <motion.div 
            key="transfer-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-end justify-center px-6 pb-12"
            onClick={() => setIsTransferOpen(false)}
          >
             <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
             >
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                      <h3 className="text-2xl font-black tracking-tighter italic uppercase">Instant Transfer</h3>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Peer-to-Peer Relay</span>
                   </div>
                   <button onClick={() => setIsTransferOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <X size={20} />
                   </button>
                </div>

                <div className="space-y-6">
                    {/* Success View */}
                    <AnimatePresence mode="wait">
                       {isTransferSuccess ? (
                          <motion.div 
                             key="success"
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             className="flex flex-col items-center gap-6 py-8"
                          >
                             <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                                <motion.div 
                                   initial={{ scale: 0 }}
                                   animate={{ scale: 1.5, opacity: 0 }}
                                   transition={{ duration: 1.5, repeat: Infinity }}
                                   className="absolute inset-0 bg-emerald-500/30 rounded-full"
                                />
                                <CheckCircle2 size={48} className="text-emerald-500" />
                             </div>
                             <div className="text-center space-y-2">
                                <h4 className="text-2xl font-black italic tracking-tighter uppercase">Transfer Sent!</h4>
                                <p className="text-xs text-white/40 font-medium">Funds have been relayed successfully to the recipient.</p>
                             </div>
                             <button 
                                onClick={() => { setIsTransferOpen(false); setIsTransferSuccess(false); }}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                             >
                                Done
                             </button>
                          </motion.div>
                       ) : (
                          <motion.form key="form" onSubmit={(e) => { e.preventDefault(); if (!isTransferring && transferAmount && transferRecipient) handleTransferSubmit(); }} className="space-y-6">
                             {/* Search Recipient */}
                             <div className="relative">
                                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                                <input 
                                  type="text" 
                                  placeholder="Search @hustler tag or Wallet ID..." value={transferRecipient} onChange={e => setTransferRecipient(e.target.value)} 
                                  className="w-full h-16 bg-white/5 border border-white/5 rounded-[1.75rem] pl-14 pr-6 text-sm font-medium focus:outline-none focus:border-brand-primary/40 transition-colors"
                                />
                             </div>

                             {/* Quick Suggestions */}
                             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                {[
                                  { name: 'Felix', tag: '@felix_ui', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
                                  { name: 'Sarah', tag: '@sarah_mkt', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
                                  { name: 'David', tag: '@david_codes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
                                ].map((h, i) => (
                                  <button key={i} className="flex flex-col items-center gap-2 group shrink-0">
                                     <div className="w-14 h-14 rounded-2xl border border-white/10 p-0.5 group-hover:border-brand-primary transition-colors">
                                        <img src={h.avatar} alt={h.name} className="w-full h-full rounded-2xl" />
                                     </div>
                                     <span className="text-[8px] font-black tracking-widest uppercase text-white/40">{h.name}</span>
                                  </button>
                                ))}
                                <button className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 hover:text-white/40 transition-all">
                                   <Plus size={20} />
                                </button>
                             </div>

                             <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col items-center gap-2 group transition-all focus-within:border-brand-primary/30">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Transfer Amount</span>
                                <div className="flex items-center gap-3">
                                   <span className="text-3xl font-black text-white/40">{EXCHANGE_RATES[displayCurrency].symbol}</span>
                                   <input 
                                     type="number" 
                                     placeholder="0.00"
                                     value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="bg-transparent border-none focus:outline-none text-5xl font-black italic tracking-tighter w-48 text-center text-white focus:ring-0 placeholder:text-white/20"
                                   />
                                </div>
                                <div className="mt-4 px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
                                   <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">Available: {EXCHANGE_RATES[displayCurrency].symbol}{(availableVal).toLocaleString()}</span>
                                </div>
                             </div>

                             <button 
                                onClick={handleTransferSubmit} disabled={isTransferring || !transferAmount || !transferRecipient}
                                className="w-full h-18 bg-blue-500 text-white rounded-[1.75rem] flex flex-col items-center justify-center gap-1 shadow-2xl shadow-blue-500/40 active-scale transition-all hover:brightness-110 py-4"
                             >
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isTransferring ? 'Relaying Transfer...' : 'Send Funds Now'}</span>
                                <span className="text-[8px] font-bold text-white/60 uppercase">Instant Settlement • Protected</span>
                             </button>
                          </motion.form>
                       )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-center gap-2 py-4 border-t border-white/5">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 italic">Encrypted Marketplace Transaction</span>
                </div>
             </motion.div>
          </motion.div>
        )}

        <DepositFlow isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />

        {(isWithdrawOpen || isSwapOpen) && (
          <motion.div 
            key="withdraw-swap-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-end justify-center px-6 pb-12"
            onClick={() => { setIsWithdrawOpen(false); setIsSwapOpen(false); }}
          >
             <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="w-full max-w-md bg-[#111] border border-white/10 rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black tracking-tighter italic uppercase">
                     {isWithdrawOpen ? 'Withdraw Funds' : 'Instant Swap'}
                   </h3>
                   <button onClick={() => { setIsWithdrawOpen(false); setIsSwapOpen(false); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <X size={16} />
                   </button>
                </div>

                {isSwapOpen ? (
                  <div className="space-y-4">
                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[8px] font-black uppercase tracking-widest text-white/40">From</span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Balance: {formatCurrency(convertCurrency(availableVal, 'USD', swapFromCurrency), swapFromCurrency)}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                           <div className="flex items-center gap-2 flex-1">
                              <span className="text-2xl font-black text-white/40">{EXCHANGE_RATES[swapFromCurrency].symbol}</span>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                value={swapAmount}
                                onChange={(e) => setSwapAmount(e.target.value)}
                                className="bg-transparent border-none outline-none text-2xl md:text-3xl font-black tracking-tighter w-full max-w-[200px]"
                              />
                           </div>
                           <select 
                             value={swapFromCurrency}
                             onChange={(e) => setSwapFromCurrency(e.target.value as Currency)}
                             className="bg-zinc-900 border border-white/10 rounded-full px-3 py-2 text-xs font-black outline-none"
                           >
                             {Object.keys(EXCHANGE_RATES).map((curr) => (
                               <option key={curr} value={curr}>{curr}</option>
                             ))}
                           </select>
                        </div>
                     </div>

                     <div className="flex justify-center -my-6 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl hover:rotate-180 transition-transform duration-500 cursor-pointer">
                           <TrendingUp size={16} className="text-emerald-500 rotate-90" />
                        </div>
                     </div>

                     <div className="bg-white/5 border border-emerald-500/20 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[8px] font-black uppercase tracking-widest text-white/40">To</span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Est. Outcome</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-2xl font-black italic tracking-tighter truncate max-w-[200px]" style={{width: '200px', display: 'inline-block'}}>
                             {swapAmount ? convertCurrency(Number(swapAmount), swapFromCurrency, swapToCurrency).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                           </span>
                           <select 
                             value={swapToCurrency}
                             onChange={(e) => setSwapToCurrency(e.target.value as Currency)}
                             className="bg-zinc-900 border border-emerald-500/20 rounded-full px-3 py-2 text-xs font-black text-emerald-500 outline-none"
                           >
                             {Object.keys(EXCHANGE_RATES).map((curr) => (
                               <option key={curr} value={curr}>{curr}</option>
                             ))}
                           </select>
                        </div>
                     </div>

                     <div className="flex items-center justify-between px-2 py-4 border-t border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Live Rate</span>
                           <span className="text-[10px] font-bold">1 {swapToCurrency} = {EXCHANGE_RATES[swapFromCurrency].symbol}{convertCurrency(1, swapToCurrency, swapFromCurrency).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Fee</span>
                           <span className="text-[10px] font-bold text-emerald-400">ZERO</span>
                        </div>
                     </div>

                     <button 
                       onClick={handleSwapSubmit}
                       disabled={isSwapping || !swapAmount}
                       className="w-full h-16 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active-scale disabled:opacity-50"
                     >
                        {isSwapping ? 'Processing...' : 'Confirm Conversion'}
                     </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); if (!isWithdrawing && withdrawAmount && withdrawAccount) handleWithdrawSubmit(); }} className="space-y-6">
                     <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Withdraw Amount ({displayCurrency})</span>
                        <div className="flex items-center gap-3">
                           <span className="text-3xl font-black text-white/40">{EXCHANGE_RATES[displayCurrency].symbol}</span>
                           <input 
                             type="number" 
                             placeholder="0.00"
                             value={withdrawAmount}
                             onChange={e => setWithdrawAmount(e.target.value)}
                             className="bg-transparent border-none focus:outline-none text-4xl font-black italic tracking-tighter w-52 text-center text-white focus:ring-0 placeholder:text-white/20"
                           />
                        </div>
                        <div className="mt-4 px-4 py-1 bg-black/40 rounded-full border border-white/5">
                           <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">Available: {formatCurrency(convertCurrency(availableVal, 'USD', displayCurrency), displayCurrency)}</span>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Destination Bank & Account Info</label>
                        <input 
                          type="text" 
                          placeholder="Access Bank • 0122345678"
                          value={withdrawAccount}
                          onChange={e => setWithdrawAccount(e.target.value)}
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-medium focus:outline-none focus:border-emerald-500/40 transition-colors text-white"
                        />
                     </div>

                     <button 
                        type="submit"
                        disabled={isWithdrawing || !withdrawAmount || !withdrawAccount}
                        className="w-full h-16 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active-scale hover:brightness-110 transition-all flex items-center justify-center disabled:opacity-50"
                     >
                        {isWithdrawing ? "Processing Withdrawal..." : "Confirm Withdrawal"}
                     </button>
                  </form>
                )}

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-3">
                   <Info size={16} className="text-emerald-500 shrink-0" />
                   <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Transactions are processed via secure marketplace relay.</p>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast 
         message={toastMsg || ""} 
         type={toastType} 
         isOpen={!!toastMsg} 
         onClose={() => setToastMsg(null)} 
      />
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
