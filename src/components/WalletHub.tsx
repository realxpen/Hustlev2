import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ArrowUpRight, ArrowDownLeft, ShieldCheck, History, 
  Wallet, DollarSign, CreditCard, Banknote, Landmark, 
  TrendingUp, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Info, Lock, Zap, PieChart, BadgeCheck, FileText, MoreHorizontal,
  Search, Plus, RotateCw
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
  const [activeTab, setActiveTab] = useState<'overview' | 'escrow' | 'history'>('overview');
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

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchEscrowAccounts();
    fetchBookings();
  }, [fetchWallet, fetchTransactions, fetchEscrowAccounts, fetchBookings]);

  // Derived Values
  const availableVal = wallet ? Number(wallet.available_balance || 0) : 0;
  
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

  const escrowVal = ledgerEscrowVal + virtualEscrowVal;

  // Real or mock multi-currency breakdown
  const fiatAssets = [
    { id: 'USD', name: 'US Dollar', amount: wallet ? Number(wallet.balance) : 0, symbol: '$', code: 'USD' as Currency },
    { id: 'NGN', name: 'Naira (Local)', amount: 0.00, symbol: '₦', code: 'NGN' as Currency },
    { id: 'EUR', name: 'Euro', amount: 0.00, symbol: '€', code: 'EUR' as Currency }
  ].map(a => ({
    ...a,
    estValue: convertCurrency(a.amount, a.code, displayCurrency)
  }));

  const cryptoAssets = [
    { id: 'USDT', name: 'Tether', amount: 0.00, symbol: '₮', code: 'USD' as Currency },
    { id: 'BTC', name: 'Bitcoin', amount: 0.00, symbol: '₿', code: 'BTC' as Currency },
    { id: 'ETH', name: 'Ethereum', amount: 0.00, symbol: 'Ξ', code: 'ETH' as Currency }
  ].map(a => ({
    ...a,
    estValue: convertCurrency(a.amount, a.code, displayCurrency)
  }));

  const fiatTotalUserCurr = fiatAssets.reduce((sum, a) => sum + a.estValue, 0);
  const cryptoTotalUserCurr = cryptoAssets.reduce((sum, a) => sum + a.estValue, 0);
  const escrowTotalUserCurr = convertCurrency(escrowVal, 'USD', displayCurrency);

  const balances = {
    total: fiatTotalUserCurr + cryptoTotalUserCurr + escrowTotalUserCurr,
    fiat: fiatTotalUserCurr,
    crypto: cryptoTotalUserCurr,
    escrow: escrowTotalUserCurr,
    pending: 0.0
  };

  const transactions: Transaction[] = dbTransactions.map(tx => {
    let typeMapped: 'deposit' | 'withdrawal' | 'earning' | 'payment' | 'tip' = 'payment';
    if (tx.type === 'deposit') typeMapped = 'deposit';
    else if (tx.type === 'withdrawal') typeMapped = 'withdrawal';
    else if (tx.type === 'escrow_release') typeMapped = 'earning';
    else if (tx.type === 'escrow_hold') typeMapped = 'payment';

    // Format fields beautifully
    const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'recent';
    let title = 'Transaction';
    let sub = tx.reference_id ? `Ref: ${tx.reference_id.slice(0, 8)}` : 'System Ledger';

    if (tx.type === 'deposit') {
      title = 'Deposit Confirmed';
      sub = 'Hustle Secure Gateway';
    } else if (tx.type === 'withdrawal') {
      title = 'Bank Withdrawal';
      sub = tx.status === 'completed' ? 'Transfer Settled' : 'Pending Verification';
    } else if (tx.type === 'escrow_hold') {
      title = 'Funds Protected in Escrow';
      sub = `Booking: #${tx.reference_id?.slice(0, 8) || ''}`;
    } else if (tx.type === 'escrow_release') {
      title = 'Escrow Funds Credited';
      sub = `Booking: #${tx.reference_id?.slice(0, 8) || ''}`;
    } else if (tx.type === 'refund') {
      title = 'Security Refund Received';
      sub = 'Returned to Fiat Account';
    }

    return {
      id: tx.id,
      type: typeMapped,
      amount: tx.type === 'withdrawal' || tx.type === 'escrow_hold' ? -Math.abs(tx.amount) : Math.abs(tx.amount), // show sign properly
      currency: displayCurrency,
      status: tx.status as any,
      date: dateStr,
      title: title,
      sub: sub
    };
  });

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
      <nav className="relative z-10 flex px-6 py-4 gap-8 border-b border-white/5 bg-black/20">
        {[
          { id: 'overview', label: 'Overview', icon: <PieChart size={14} /> },
          { id: 'escrow', label: 'Escrow Control', icon: <Lock size={14} /> },
          { id: 'history', label: 'Transaction Feed', icon: <History size={14} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-2 relative group transition-colors ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              {/* Unified Balance Card */}
              <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <TrendingUp size={120} className="text-emerald-500" strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Consolidated Assets</p>
                    <div className="flex items-center gap-3">
                      <CurrencySelector />
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                         <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Rates Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                     <span className="text-2xl font-black text-white/40">{EXCHANGE_RATES[displayCurrency].symbol}</span>
                     <h2 className="text-6xl font-display font-black tracking-tighter italic">
                       {balances.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </h2>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <button 
                      onClick={() => setAssetTab('fiat')}
                      className={`flex flex-col text-left transition-all hover:scale-105 active:scale-95 ${assetTab === 'fiat' ? 'opacity-100' : 'opacity-40'}`}
                    >
                       <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Fiat Account</span>
                       <span className="text-sm font-black text-white">{EXCHANGE_RATES[displayCurrency].symbol}{balances.fiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button 
                      onClick={() => setAssetTab('crypto')}
                      className={`flex flex-col text-left transition-all hover:scale-105 active:scale-95 ${assetTab === 'crypto' ? 'opacity-100' : 'opacity-40'}`}
                    >
                       <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Crypto Portfolio</span>
                       <span className="text-sm font-black text-white">{EXCHANGE_RATES[displayCurrency].symbol}{balances.crypto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button 
                      onClick={() => setActiveTab('escrow')}
                      className="flex flex-col text-left transition-all hover:scale-105 active:scale-95 opacity-100"
                    >
                       <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">In Escrow</span>
                       <span className="text-sm font-black text-emerald-500">${balances.escrow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Asset Tabs Switcher */}
                    <div className="flex items-center gap-6 border-b border-white/5">
                      <button 
                        onClick={() => setAssetTab('fiat')}
                        className={`pb-3 text-[10px] font-black uppercase tracking-widest relative transition-colors ${assetTab === 'fiat' ? 'text-white' : 'text-white/20 hover:text-white/40'}`}
                      >
                        Fiat Accounts
                        {assetTab === 'fiat' && (
                          <motion.div layoutId="activeAssetTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-emerald-500" />
                        )}
                      </button>
                      <button 
                        onClick={() => setAssetTab('crypto')}
                        className={`pb-3 text-[10px] font-black uppercase tracking-widest relative transition-colors ${assetTab === 'crypto' ? 'text-white' : 'text-white/20 hover:text-white/40'}`}
                      >
                        Crypto Assets
                        {assetTab === 'crypto' && (
                          <motion.div layoutId="activeAssetTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-emerald-500" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {assetTab === 'fiat' ? (
                        <motion.div 
                          key="fiat-list"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between px-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Total Fiat Value</span>
                            <span className="text-sm font-black tracking-tighter text-emerald-500">{EXCHANGE_RATES[displayCurrency].symbol}{balances.fiat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                             {fiatAssets.map(asset => (
                               <div key={asset.id} className="bg-white/5 border border-white/5 rounded-3xl p-4 hover:bg-white/10 transition-colors flex items-center justify-between group/asset">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover/asset:bg-emerald-500 group-hover/asset:text-white transition-colors">
                                       {asset.id === 'NGN' ? <Banknote size={16} /> : asset.id === 'EUR' ? <Landmark size={16} /> : <DollarSign size={16} />}
                                    </div>
                                    <div>
                                       <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{asset.name}</p>
                                       <span className="text-sm font-black tracking-tighter">{asset.symbol}{asset.amount.toLocaleString(undefined, { minimumFractionDigits: asset.id === 'USD' ? 2 : 0 })}</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Est. {displayCurrency}</p>
                                    <span className="text-[10px] font-black text-white/40">{EXCHANGE_RATES[displayCurrency].symbol}{asset.estValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="crypto-list"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between px-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Total Crypto Value</span>
                            <span className="text-sm font-black tracking-tighter text-emerald-500">{EXCHANGE_RATES[displayCurrency].symbol}{balances.crypto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                             {cryptoAssets.map(asset => (
                               <div key={asset.id} className="bg-white/5 border border-white/5 rounded-3xl p-4 hover:bg-white/10 transition-colors flex items-center justify-between group/asset">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500/40 group-hover/asset:bg-emerald-500 group-hover/asset:text-white transition-colors">
                                       {asset.id === 'BTC' ? <Zap size={16} /> : asset.id === 'ETH' ? <PieChart size={16} /> : <DollarSign size={16} />}
                                    </div>
                                    <div>
                                       <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{asset.name}</p>
                                       <span className="text-sm font-black tracking-tighter">{asset.amount.toFixed(asset.id === 'BTC' || asset.id === 'ETH' ? 8 : 2)} {asset.id}</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Est. {displayCurrency}</p>
                                    <span className="text-[10px] font-black text-white/40">{EXCHANGE_RATES[displayCurrency].symbol}{asset.estValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Quick Actions Flow */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setIsDepositOpen(true)}
                  className="bg-emerald-500 py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active-scale group overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <ArrowDownLeft size={20} className="text-white" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Deposit</span>
                </button>
                <button 
                  onClick={() => setIsSwapOpen(true)}
                  className="bg-white/5 border border-white/10 py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all active-scale group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Zap size={20} className="text-yellow-500" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Swap</span>
                </button>
                <button 
                  onClick={() => setIsWithdrawOpen(true)}
                  className="bg-white/5 border border-white/10 py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all active-scale group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <ArrowUpRight size={20} className="text-white/60" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest">Withdraw</span>
                </button>
              </div>

              {/* Escrow Spotlight */}
              <section className="mt-4">
                 <div className="flex justify-between items-center mb-5 px-2">
                    <div className="flex items-center gap-2">
                       <Lock size={14} className="text-blue-400" />
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Held in Protection</h3>
                    </div>
                    <button onClick={() => setActiveTab('escrow')} className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Full Control</button>
                 </div>
                 <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-[2.5rem] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <DollarSign size={24} />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Escrow Balance</p>
                          <h4 className="text-2xl font-black tracking-tighter">{EXCHANGE_RATES[displayCurrency].symbol}{balances.escrow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                       </div>
                    </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-white/40 uppercase mb-1">{escrows.length} Active Jobs</p>
                        <div className="flex -space-x-2 justify-end">
                           {escrows.slice(0, 3).map((e, idx) => (
                             <div key={idx} className="w-6 h-6 rounded-full border-2 border-black bg-white/10 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${e.hustler}`} alt="User" />
                             </div>
                           ))}
                        </div>
                     </div>
                 </div>
              </section>

              {/* Security Hint */}
              <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex items-start gap-4">
                 <BadgeCheck size={24} className="text-emerald-400 shrink-0" />
                 <div>
                    <h4 className="text-xs font-black uppercase mb-1">Hustle Shield Active</h4>
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">All creator payments are held by our automated escrow system and only released when the job is completed and approved.</p>
                 </div>
              </div>
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
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               className="flex flex-col gap-6"
            >
               <div className="sticky top-0 bg-black/40 backdrop-blur-xl py-4 z-20 flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Audit Timeline</h3>
                  <button className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={14} /> Export CSV
                  </button>
               </div>

               <div className="flex flex-col gap-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="relative pl-8 pb-8 last:pb-0 group">
                       {/* Timeline Line */}
                       <div className="absolute left-[11px] top-4 bottom-0 w-[2px] bg-white/5 group-last:hidden" />
                       
                       {/* Timeline Dot */}
                       <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center z-10 ${
                         tx.status === 'completed' ? 'bg-emerald-500/20' : 
                         tx.status === 'escrow' ? 'bg-blue-500/20' : 
                         'bg-white/10'
                       }`}>
                          {tx.status === 'completed' ? <CheckCircle2 size={12} className="text-emerald-500" /> : 
                           tx.status === 'escrow' ? <Lock size={12} className="text-blue-500" /> :
                           <Clock size={12} className="text-white/40" />}
                       </div>

                       <div 
                          onClick={() => setIsReceiptOpen(tx)}
                          className="bg-white/5 border border-white/5 rounded-3xl p-5 group-hover:bg-white/10 transition-all flex items-center justify-between active-scale cursor-pointer"
                       >
                          <div>
                             <h4 className="text-xs font-black uppercase tracking-tight mb-1">{tx.title}</h4>
                             <div className="flex items-center gap-3 text-[9px] font-bold text-white/30 uppercase">
                                <span>{tx.date}</span>
                                <div className="w-1 h-1 bg-white/10 rounded-full" />
                                <span>{tx.sub}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-md font-black tracking-tighter ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                {tx.amount > 0 ? '+' : ''}{EXCHANGE_RATES[displayCurrency].symbol}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </div>
                             <div className={`text-[8px] font-black uppercase tracking-widest ${
                               tx.status === 'completed' ? 'text-emerald-500/60' : 
                               tx.status === 'escrow' ? 'text-blue-500/60' : 
                               'text-white/20'
                             }`}>
                                {tx.status}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
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
                                   <span className="text-3xl font-black text-white/40">₦</span>
                                   <input 
                                     type="number" 
                                     placeholder="0.00"
                                     value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="bg-transparent border-none focus:outline-none text-5xl font-black italic tracking-tighter w-48 text-center text-white focus:ring-0 placeholder:text-white/20"
                                   />
                                </div>
                                <div className="mt-4 px-4 py-1.5 bg-black/40 rounded-full border border-white/5">
                                   <span className="text-[9px] font-bold text-white/40 tracking-widest uppercase">Available: ₦{(availableVal).toLocaleString()}</span>
                                </div>
                             </div>

                             <button 
                                onClick={handleTransferSubmit} disabled={isTransferring || !transferAmount || !transferRecipient}
                                className="w-full h-18 bg-brand-primary text-white rounded-[1.75rem] flex flex-col items-center justify-center gap-1 shadow-2xl shadow-brand-primary/40 active-scale transition-all hover:brightness-110"
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
