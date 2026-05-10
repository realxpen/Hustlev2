import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Transaction, TransactionType, TransactionStatus } from "../types";
import TransactionCard from "./TransactionCard";
import TransactionDetailView from "./TransactionDetailView";
import { motion, AnimatePresence } from "motion/react";

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "TX-901", userId: "u1", amount: 40000, type: TransactionType.ESCROW_RELEASE, status: TransactionStatus.COMPLETED, title: "Milestone 2 Released", timestamp: "2026-05-09T14:00:00Z" },
  { id: "TX-902", userId: "u1", amount: 120000, type: TransactionType.ESCROW_FUNDED, status: TransactionStatus.COMPLETED, title: "Project Escrow Funded", timestamp: "2026-05-07T09:00:00Z" },
  { id: "TX-903", userId: "u1", amount: 0, type: TransactionType.AWAITING_APPROVAL, status: TransactionStatus.PENDING, title: "Milestone 3 Awaiting Approval", timestamp: "2026-05-09T16:00:00Z" },
  { id: "TX-904", userId: "u1", amount: 15000, type: TransactionType.BOOKING_PAYMENT, status: TransactionStatus.COMPLETED, title: "Initial Booking Deposit", timestamp: "2026-05-08T09:00:00Z" },
  { id: "TX-905", userId: "u1", amount: 2000, type: TransactionType.WITHDRAWAL, status: TransactionStatus.PROCESSING, title: "Withdrawal to Chase", timestamp: "2026-05-09T18:00:00Z" }
];

export default function ActivityFeed() {
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = MOCK_TRANSACTIONS.filter(tx => 
      (filter === "all" || tx.type === filter) &&
      (tx.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex gap-3">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs outline-none focus:border-blue-500/50"
              />
           </div>
           <button className="w-12 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40">
             <Filter size={16} />
           </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
              {filtered.map(tx => (
                 <TransactionCard key={tx.id} tx={tx} onClick={setSelectedTx} />
              ))}
          </AnimatePresence>
        </div>
      </div>
      
      <AnimatePresence>
        {selectedTx && (
          <TransactionDetailView tx={selectedTx} onClose={() => setSelectedTx(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
