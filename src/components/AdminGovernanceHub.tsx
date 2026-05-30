import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Grid,
  Shield,
  AlertTriangle,
  Settings,
  ChevronLeft,
  Search,
  TrendingUp,
  DollarSign,
  Activity,
  FileText,
  UserCheck,
  UserX,
  Info,
  ArrowRight,
  Zap,
  Flag,
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  SearchCheck,
  MessageSquare,
  Lock,
  Settings2,
  ShieldCheck,
  Eye,
  PauseCircle,
  RefreshCw,
  BarChart3,
  Radio,
  History,
} from "lucide-react";
import { useModerationStore } from "../stores/useModerationStore";
import { useAuthStore } from "../features/auth/stores/useAuthStore";
import { supabase } from "../lib/supabase";
import type {
  ModerationQueueItem,
  CreatorVerification,
  ModerationStatus,
} from "../types/moderation";

interface AdminGovernanceHubProps {
  onClose: () => void;
}

type AdminTab =
  | "overview"
  | "users"
  | "verification"
  | "disputes"
  | "fraud"
  | "logs"
  | "settings";

export default function AdminGovernanceHub({
  onClose,
}: AdminGovernanceHubProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [expandedVerificationId, setExpandedVerificationId] = useState<string | null>(null);

  const {
    moderationQueue,
    verificationRequests,
    moderationLogs,
    moderators,
    allUsers,
    disputes,
    escrows,
    stats,
    fetchQueue,
    fetchVerifications,
    fetchLogs,
    fetchStats,
    fetchModerators,
    fetchAllUsers,
    fetchDisputes,
    fetchEscrows,
    subscribeToAdminEvents,
    verifyCreator,
    moderateContent,
    isLoading,
    error,
  } = useModerationStore();

  const profile = useAuthStore((state) => state.profile);
  const isAuthorized = ["moderator", "admin", "super_admin"].includes(
    profile?.role || ""
  );

  useEffect(() => {
    if (!isAuthorized) return;

    fetchQueue();
    fetchVerifications();
    fetchLogs();
    fetchStats();
    fetchModerators();
    fetchAllUsers();
    fetchDisputes();
    fetchEscrows();

    // Subscribe to real-time events
    const unsubscribe = subscribeToAdminEvents();
    return () => unsubscribe();
  }, [
    isAuthorized,
    fetchQueue,
    fetchVerifications,
    fetchLogs,
    fetchStats,
    fetchModerators,
    fetchAllUsers,
    fetchDisputes,
    fetchEscrows,
    subscribeToAdminEvents,
  ]);

  // Handle verify creator
  const handleVerify = async (id: string, status: "approved" | "rejected") => {
    await verifyCreator(id, status);
  };

  const handleModerate = async (
    item: ModerationQueueItem,
    action: ModerationStatus,
  ) => {
    await moderateContent({
      target_id: item.target_id,
      target_type: item.target_type,
      action,
      reason: "Moderator action via Admin Governance Hub",
      queueItemId: item.id,
      reportId: (item as any).report?.id,
    });
    // Refresh stats and queue
    fetchQueue();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdatingId(userId);
    try {
      const { error: roleErr } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (roleErr) {
        console.error("Failed to change role:", roleErr);
      } else {
        await fetchAllUsers();
        await fetchModerators();
      }
    } catch (err) {
      console.error("Err changing role:", err);
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const [suspensionUpdatingId, setSuspensionUpdatingId] = useState<string | null>(null);

  const handleToggleSuspension = async (userId: string, shouldSuspend: boolean) => {
    setSuspensionUpdatingId(userId);
    try {
      await moderateContent({
        target_id: userId,
        target_type: "profile",
        action: shouldSuspend ? "removed" : "approved",
        reason: shouldSuspend ? "Admin suspension action" : "Admin suspension lifted",
      });
      await fetchAllUsers();
    } catch (err) {
      console.error("Failed to toggle user suspension:", err);
    } finally {
      setSuspensionUpdatingId(null);
    }
  };

  if (!isAuthorized || (error && (error.includes("Row level security") || error.includes("Access Denied") || error.includes("unauthorized")))) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center text-white p-6">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
          Unauthorized
        </h1>
        <p className="text-sm text-white/50 text-center max-w-sm mb-8">
          Your account does not hold the 'moderator' or 'super_admin' role
          required to access the Governance System.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-white/10 rounded-xl uppercase tracking-widest text-xs font-black"
        >
          Return
        </button>
      </div>
    );
  }

  // Mock Data
  const kpis = {
    users: 14250,
    activeBookings: 842,
    escrowHeld: 125400,
    transactions: 24500,
    openDisputes: 12,
    flaggedContent: 34,
    mrr: 45200,
  };

  const recentDisputes = [
    {
      id: "DSP-092",
      client: "Sarah L.",
      hustler: "Marcus V.",
      reason: "Non-delivery of final files",
      amount: 450,
      status: "Investigation",
      risk: "high",
      date: "2h ago",
    },
    {
      id: "DSP-091",
      client: "John D.",
      hustler: "Ayo B.",
      reason: "Quality not as described",
      amount: 120,
      status: "Awaiting Hustler",
      risk: "low",
      date: "5h ago",
    },
    {
      id: "DSP-089",
      client: "Elena R.",
      hustler: "Dave S.",
      reason: "No show for appointment",
      amount: 80,
      status: "Admin Review",
      risk: "medium",
      date: "1d ago",
    },
  ];

  const flaggedItems = [
    {
      id: "FLG-1",
      type: "Listing",
      user: "AlexK",
      reason: "Possible scam/fake product",
      confidence: 94,
    },
    {
      id: "FLG-2",
      type: "Account",
      user: "DevTeamX",
      reason: "Multiple failed payments",
      confidence: 88,
    },
    {
      id: "FLG-3",
      type: "Message",
      user: "User99",
      reason: "Requesting off-platform payment",
      confidence: 99,
    },
  ];

  const verificationQueue = [
    {
      id: "V-101",
      name: "Studio X",
      type: "Agency",
      applyingFor: "Premium Hustler",
      submitted: "1h ago",
    },
    {
      id: "V-102",
      name: "Sarah Jess",
      type: "Individual",
      applyingFor: "Pro Designer",
      submitted: "3h ago",
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col text-white pb-safe">
      <div className="grain-overlay pointer-events-none" />

      {/* Admin Header */}
      <header className="sticky top-0 z-[100] flex justify-between items-center px-4 py-3 bg-[#050505]/90 backdrop-blur-2xl border-b border-white/5 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500 flex items-center gap-1.5">
              <ShieldAlert size={10} /> Governance System
            </h2>
            <h1 className="text-sm font-display font-black tracking-widest uppercase text-white truncate max-w-[150px]">
              Command Center
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest">
            <Radio size={10} className="animate-pulse" /> System Nominal
          </div>
        </div>
      </header>

      {/* Modular Navigation */}
      <div className="sticky top-[73px] z-[90] bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 px-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          {[
            { id: "overview", icon: <Activity size={14} />, label: "Overview" },
            { id: "users", icon: <Users size={14} />, label: "Users" },
            {
              id: "verification",
              icon: <ShieldCheck size={14} />,
              label: "Queue",
            },
            { id: "disputes", icon: <Scale size={14} />, label: "Disputes" },
            {
              id: "fraud",
              icon: <AlertTriangle size={14} />,
              label: "Fraud Risk",
            },
            { id: "logs", icon: <FileText size={14} />, label: "Audit Log" },
            { id: "settings", icon: <Settings2 size={14} />, label: "Config" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-black shadow-lg"
                  : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.icon}
              {tab.label}
              {(tab.id === "disputes" ||
                tab.id === "fraud" ||
                tab.id === "verification") && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[7px]">
                  {tab.id === "disputes"
                    ? stats?.open_disputes || 0
                    : tab.id === "fraud"
                      ? moderationQueue.length
                      : verificationRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8"
          >
            {/* 1. OVERVIEW & HEALTH MONITORING */}
            {activeTab === "overview" && (
              <>
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 flex items-center gap-2">
                    <BarChart3 size={12} /> Platform Health Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Total Users",
                        value: (stats?.total_users ?? 0).toLocaleString(),
                        icon: <Users />,
                        tab: "users" as AdminTab,
                      },
                      {
                        label: "Active Escrow",
                        value:
                          (stats?.active_escrow ?? 0) >= 1000
                            ? `$${((stats?.active_escrow || 0) / 1000).toFixed(1)}k`
                            : `$${(stats?.active_escrow ?? 0).toLocaleString()}`,
                        icon: <Lock />,
                        tab: "disputes" as AdminTab,
                      },
                      {
                        label: "Monthly Rev (MRR)",
                        value:
                          (stats?.monthly_revenue ?? 0) >= 1000
                            ? `$${((stats?.monthly_revenue || 0) / 1000).toFixed(1)}k`
                            : `$${(stats?.monthly_revenue ?? 0).toLocaleString()}`,
                        icon: <TrendingUp />,
                        tab: "settings" as AdminTab,
                      },
                      {
                        label: "Open Disputes",
                        value: stats?.open_disputes || 0,
                        icon: <Scale className="text-red-400" />,
                        tab: "disputes" as AdminTab,
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        onClick={() => stat.tab && setActiveTab(stat.tab)}
                        className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden group cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all active:scale-95"
                      >
                        <div className="text-white/20 group-hover:text-white/40 transition-colors w-6 h-6">
                          {stat.icon}
                        </div>
                        <div>
                          <div className="text-2xl font-black tracking-tighter text-white">
                            {stat.value}
                          </div>
                          <div className="text-[9px] uppercase tracking-widest text-white/40 mt-1">
                            {stat.label}
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-500 pointer-events-none">
                          {stat.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent/Marketplace Summary */}
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-400 mb-6 flex items-center gap-2">
                    <Grid size={12} /> Ecosystem Growth
                  </h3>
                  <div className="space-y-4">
                    <div
                      className="cursor-pointer group"
                      onClick={() => setActiveTab("disputes")}
                    >
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <span className="text-white group-hover:text-blue-300 transition-colors">
                          Booking Success Rate
                        </span>
                        <span className="text-blue-400">
                          {(stats?.booking_success_rate ?? 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-1000"
                          style={{
                            width: `${stats?.booking_success_rate || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="cursor-pointer group"
                      onClick={() => setActiveTab("fraud")}
                    >
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <span className="text-white group-hover:text-red-300 transition-colors">
                          Fraud Risk Items
                        </span>
                        <span className="text-red-400">
                          {stats?.fraud_risk_count || 0}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-1000"
                          style={{
                            width: `${Math.min((stats?.fraud_risk_count || 0) * 10, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. DISPUTE RESOLUTION + ESCROW */}
            {activeTab === "disputes" && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">
                      Escrow Protection Active
                    </h3>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">
                      Funds frozen until resolution.
                    </p>
                  </div>
                  <Lock size={20} className="text-red-400/50" />
                </div>

                {/* Dynamic Escrow Aggregation Ledger */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1 flex items-center gap-2">
                    <Lock size={12} /> Live Escrow Ledger & Protection Values
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Active Escrow",
                        value: `$${(stats?.active_escrow ?? 0).toLocaleString()}`,
                        desc: "Held in active bookings",
                        color: "text-blue-400",
                      },
                      {
                        label: "Frozen Escrow",
                        value: `$${(stats?.frozen_escrow ?? 0).toLocaleString()}`,
                        desc: "Locked due to disputes",
                        color: "text-red-400",
                      },
                      {
                        label: "Released Escrow",
                        value: `$${(stats?.released_escrow ?? 0).toLocaleString()}`,
                        desc: "Paid out to Hustlers",
                        color: "text-green-400",
                      },
                      {
                        label: "Completed Escrow",
                        value: `$${(stats?.completed_escrow ?? 0).toLocaleString()}`,
                        desc: "Released & finished orders",
                        color: "text-yellow-400",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col justify-between h-24"
                      >
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em]">
                          {item.label}
                        </span>
                        <div>
                          <div className={`text-lg font-black tracking-tight ${item.color}`}>
                            {item.value}
                          </div>
                          <p className="text-[8px] text-white/40 uppercase mt-0.5 tracking-wider">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {disputes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1 flex items-center gap-2">
                      <Scale size={12} /> Live Disputes ({disputes.length})
                    </h4>
                    <div className="flex flex-col gap-4">
                      {disputes.map((dispute) => (
                        <div
                          key={dispute.id}
                          className="p-6 rounded-[2rem] bg-[#0c0c0c] border border-red-500/20 flex flex-col gap-5"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black bg-red-500/20 text-red-400 px-2 py-1 rounded-md uppercase tracking-widest border border-red-500/20">
                                {dispute.status === "pending"
                                  ? "Investigation"
                                  : dispute.status}
                              </span>
                              <h4 className="text-sm font-black text-white mt-3">
                                DSP-{dispute.id.slice(0, 5).toUpperCase()}
                              </h4>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                                {dispute.reason}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-black text-white">
                                ${dispute.booking?.total_price || 0}
                              </div>
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                                Escrow Frozen
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 border-dashed">
                            <div className="flex-1 flex flex-col items-center">
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">
                                Client
                              </span>
                              <span className="text-[10px] font-black text-white truncate max-w-[80px]">
                                {dispute.booking?.buyer?.full_name ||
                                  dispute.reporter?.full_name ||
                                  "Anonymous"}
                              </span>
                            </div>
                            <div className="text-white/20">
                              <Radio size={12} />
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">
                                Hustler
                              </span>
                              <span className="text-[10px] font-black text-white truncate max-w-[80px]">
                                {dispute.booking?.seller?.full_name ||
                                  "Pending"}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              className="flex-1 py-3 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              Review Case
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1 flex items-center gap-2">
                    <Lock size={12} /> Active Escrows ({escrows.length})
                  </h4>
                  <div className="flex flex-col gap-4">
                    {escrows.length === 0 ? (
                      <div className="p-10 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                        <Lock size={24} className="text-white/10" />
                        <p className="text-[10px] text-white/30 tracking-widest uppercase">
                          No active escrows found
                        </p>
                      </div>
                    ) : (
                      escrows.map((escrow) => (
                        <div
                          key={escrow.id}
                          className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col gap-4"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <DollarSign size={18} />
                              </div>
                              <div>
                                <div className="text-xs font-black text-white">
                                  ORDR-{escrow.id.slice(0, 6).toUpperCase()}
                                </div>
                                <div className="text-[8px] text-white/30 uppercase tracking-widest">
                                  Type: {escrow.listing_type}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black text-green-400">
                                ${escrow.total_price}
                              </div>
                              <div className="text-[8px] text-white/20 uppercase tracking-widest">
                                In Escrow
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">
                                <img
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${escrow.buyer_id}`}
                                  alt=""
                                />
                              </div>
                              <span className="text-[9px] text-white/50 uppercase tracking-tight">
                                {escrow.buyer?.username || "Client"}
                              </span>
                            </div>
                            <ArrowRight size={10} className="text-white/10" />
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-white/50 uppercase tracking-tight text-right">
                                {escrow.seller?.username || "Hustler"}
                              </span>
                              <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden">
                                <img
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${escrow.seller_id}`}
                                  alt=""
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. VERIFICATION & MODERATION */}
            {activeTab === "verification" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 flex items-center gap-2">
                    <SearchCheck size={12} /> Pending Verification (Hustlers)
                  </h3>
                  <div className="flex flex-col gap-3">
                    {verificationRequests.length === 0 ? (
                      <div className="text-[10px] text-white/40 uppercase tracking-widest p-4">
                        No pending verifications
                      </div>
                    ) : (
                      verificationRequests.map((item: any) => {
                        const isExpanded = expandedVerificationId === item.id;
                        const meta = item.submission_metadata || {};
                        return (
                          <div
                            key={item.id}
                            className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col gap-4 transition-all"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                                  {item.profiles?.full_name || "Unknown User"}
                                </h4>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                                  Applying: {item.verification_type}
                                </p>
                              </div>
                              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                {new Date(item.submitted_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Expanded Submission Details Block */}
                            {isExpanded && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="border-t border-white/5 pt-4 flex flex-col gap-3 text-xs text-white/70"
                              >
                                {meta.skill && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-black">Designated Skill / Craft</span>
                                    <span className="font-bold text-white text-[11px] uppercase tracking-wider">{meta.skill}</span>
                                  </div>
                                )}
                                
                                {meta.experience && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-black">Experience Level</span>
                                    <span className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">{meta.experience}</span>
                                  </div>
                                )}

                                {meta.serviceTitle && (
                                  <div className="flex flex-col gap-1 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-black mb-1">Proposed Service Listing</span>
                                    <span className="font-black text-white text-xs mb-1 uppercase tracking-tight">{meta.serviceTitle}</span>
                                    <p className="text-[11px] text-white/50 leading-relaxed font-light">{meta.serviceDetails}</p>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-1">
                                  {meta.identifierInput && (
                                    <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl flex flex-col">
                                      <span className="text-[8px] uppercase tracking-widest text-white/30 font-black">Contact ({meta.identityMethod || "SMS"})</span>
                                      <span className="font-mono text-[10px] text-white mt-1">{meta.identifierInput}</span>
                                    </div>
                                  )}
                                  <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl flex flex-col">
                                    <span className="text-[8px] uppercase tracking-widest text-white/30 font-black">Biometric Verification</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${meta.governmentIdAttached ? "text-green-400" : "text-yellow-500/60"}`}>
                                      {meta.governmentIdAttached ? "● ID PROVIDED" : "● SMS VERIFIED ONLY"}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerify(item.id, "approved")}
                                className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-500/20 transition-all"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleVerify(item.id, "rejected")}
                                className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                              <button 
                                onClick={() => setExpandedVerificationId(isExpanded ? null : item.id)}
                                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isExpanded ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Ads & Content Governance */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 flex items-center gap-2">
                    <Flag size={12} /> Content & Ads Moderation
                  </h3>
                  {moderationQueue.filter((item) =>
                    ["post", "comment"].includes(item.target_type),
                  ).length === 0 ? (
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center gap-3">
                      <ShieldCheck size={32} className="text-white/10" />
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
                        No pending content reviews
                      </h4>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest max-w-[200px]">
                        Auto-mod is currently handling standard posts and
                        listings.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {moderationQueue
                        .filter((item) =>
                          ["post", "comment"].includes(item.target_type),
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            className="p-6 rounded-[2rem] bg-[#0c0c0c] border border-white/5 flex flex-col gap-5"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black bg-red-400/15 text-red-400 border border-red-400/20 px-2 py-0.5 rounded uppercase tracking-widest">
                                  Reported {item.target_type}
                                </span>
                                <span className="text-[8px] font-black bg-white/5 text-white/40 px-2 py-0.5 rounded uppercase tracking-widest">
                                  Priority: {item.priority}
                                </span>
                              </div>
                              <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Reported content preview */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
                              <div>
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                                  Content Preview
                                </span>
                                <p className="text-xs text-white/80 font-medium mt-1">
                                  {(item as any).post?.caption ||
                                    "No caption text."}
                                </p>
                              </div>
                              {(item as any).post?.media_url && (
                                <div className="w-full max-h-40 rounded-lg overflow-hidden bg-white/5">
                                  <img
                                    src={(item as any).post?.media_url}
                                    className="w-full h-full object-cover"
                                    alt="Reported Media"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black tracking-widest border-t border-b border-white/5 py-3">
                              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5">
                                <span className="text-white/30 text-[8px]">
                                  Reporter
                                </span>
                                <span className="text-red-400 truncate">
                                  {(item as any).report?.reporter?.full_name ||
                                    (item as any).report?.reporter?.username ||
                                    "Anonymous"}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5">
                                <span className="text-white/30 text-[8px]">
                                  Reported Creator
                                </span>
                                <span className="text-white truncate">
                                  {(item as any).reported_user?.full_name ||
                                    (item as any).reported_user?.username ||
                                    "Unknown Hustler"}
                                </span>
                              </div>
                            </div>

                            <div className="px-1">
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                                Reason for Report
                              </span>
                              <p className="text-[10px] font-bold text-white/60 mt-1 leading-relaxed">
                                {(item as any).report?.reason ||
                                  "Violating platform guidelines."}
                                {(item as any).report?.details && (
                                  <span className="block font-medium text-white/40 mt-1">
                                    {(item as any).report.details}
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handleModerate(item, "removed")}
                                className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-100 border border-red-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/25 active:scale-95 transition-all"
                              >
                                Remove Post
                              </button>
                              <button
                                onClick={() => handleModerate(item, "approved")}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
                              >
                                Dismiss Report
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. FRAUD & RISK */}
            {activeTab === "fraud" && (
              <div className="flex flex-col gap-6">
                <div className="p-6 rounded-[2rem] bg-red-900/10 border border-red-500/20 flex flex-col gap-2">
                  <h3 className="text-[14px] uppercase tracking-tighter font-black text-red-400 flex items-center gap-2">
                    <ShieldAlert size={16} /> AI Fraud Defense Active
                  </h3>
                  <p className="text-[10px] text-white/60 font-medium leading-relaxed">
                    System is monitoring for off-platform payment requests,
                    network spoofing, and abnormal escrow rapid-releases.
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1">
                    Flagged Activity
                  </h4>
                  <div className="flex flex-col gap-4">
                    {moderationQueue.length === 0 ? (
                      <div className="text-[10px] text-white/40 p-4">
                        No items in moderation queue
                      </div>
                    ) : (
                      moderationQueue.map((flag) => (
                        <div
                          key={flag.id}
                          className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${flag.severity_score > 3 ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"}`}
                              >
                                <AlertTriangle size={14} />
                              </div>
                              <div>
                                <h5 className="text-[11px] font-black text-white uppercase tracking-wider">
                                  {flag.target_type} Review
                                </h5>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest">
                                  {flag.target_id}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${flag.severity_score > 3 ? "text-red-400" : "text-yellow-400"}`}
                              >
                                Priority: {flag.priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleModerate(flag, "removed")}
                              className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest"
                            >
                              Restrict
                            </button>
                            <button
                              onClick={() => handleModerate(flag, "approved")}
                              className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-widest"
                            >
                              Ignore/Approve
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. USER & AGENT MANAGMENT */}
            {activeTab === "users" &&
              (() => {
                const baseUsers = allUsers.length > 0 ? allUsers : moderators;

                const filtered = baseUsers.filter((u) => {
                  const query = userSearchQuery.toLowerCase();
                  return (
                    (u.full_name || "").toLowerCase().includes(query) ||
                    (u.username || "").toLowerCase().includes(query) ||
                    (u.email || "").toLowerCase().includes(query) ||
                    (u.id || "").toLowerCase().includes(query)
                  );
                });

                const getRoleVal = (role: string) => {
                  switch (role) {
                    case "super_admin":
                      return 4;
                    case "admin":
                      return 3;
                    case "moderator":
                      return 2;
                    default:
                      return 1;
                  }
                };

                const sorted = [...filtered].sort((a, b) => {
                  const diff =
                    getRoleVal(b.role || "user") - getRoleVal(a.role || "user");
                  if (diff !== 0) return diff;
                  return (
                    new Date(b.created_at || 0).getTime() -
                    new Date(a.created_at || 0).getTime()
                  );
                });

                return (
                  <div className="flex flex-col gap-6">
                    {/* Search & Filter */}
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search UID, Name, Username, Email..."
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-xs text-white outline-none focus:border-white/30 transition-all font-medium"
                      />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-white/40 hover:text-white"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="p-6 rounded-[2rem] bg-purple-900/10 border border-purple-500/20">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-purple-400 mb-2 flex items-center gap-2">
                        <UserCheck size={12} /> System Identity Directory
                      </h3>
                      <p className="text-[10px] text-white/50 mb-4">
                        Found {filtered.length} users in the directory.
                        Moderators and administrative profiles are prioritized
                        at the top.
                      </p>
                    </div>

                    {/* Users List */}
                    <div className="flex flex-col gap-4">
                      {sorted.length === 0 ? (
                        <div className="p-10 text-center rounded-2xl bg-[#0c0c0c] border border-white/5 text-xs text-white/30 uppercase tracking-widest">
                          No users matched the search criteria.
                        </div>
                      ) : (
                        sorted.map((user) => {
                          const isHustler = user.is_hustler;
                          const roleLabel = user.role || "user";

                          let badgeStyles =
                            "bg-white/5 text-white/40 border-white/5";
                          if (roleLabel === "super_admin")
                            badgeStyles =
                              "bg-red-500/20 text-red-400 border-red-500/20";
                          else if (roleLabel === "admin")
                            badgeStyles =
                              "bg-blue-500/20 text-blue-400 border-blue-500/20";
                          else if (roleLabel === "moderator")
                            badgeStyles =
                              "bg-purple-500/20 text-purple-400 border-purple-500/20";
                          else if (isHustler)
                            badgeStyles =
                              "bg-amber-500/20 text-amber-400 border-amber-500/20";

                          return (
                            <div
                              key={user.id}
                              className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-4 group hover:border-white/20 transition-all"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/15">
                                  <img
                                    src={
                                      user.avatar_url ||
                                      `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.id}`
                                    }
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[150px]">
                                      {user.full_name || "Anonymous User"}
                                    </h4>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${badgeStyles}`}
                                    >
                                      {isHustler && roleLabel === "user"
                                        ? "creator"
                                        : roleLabel}
                                    </span>
                                    {user.is_suspended && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                        suspended
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                                    @{user.username || "no_handle"}
                                  </p>
                                  <p className="text-[9px] text-white/30 tracking-wider truncate mt-1 lowercase select-all">
                                    {user.email}
                                  </p>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">
                                    Joined
                                  </span>
                                  <span className="text-[9px] text-white/40 font-mono">
                                    {new Date(
                                      user.created_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 items-center">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-black">
                                      Role:
                                    </span>
                                    <select
                                      value={roleLabel}
                                      disabled={roleUpdatingId === user.id}
                                      onChange={(e) =>
                                        handleRoleChange(user.id, e.target.value)
                                      }
                                      className="bg-[#121212] border border-white/10 rounded-xl px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white/80 outline-none focus:border-purple-500/50 cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="user">User</option>
                                      <option value="moderator">Moderator</option>
                                      <option value="admin">Admin</option>
                                      <option value="super_admin">
                                        Super Admin
                                      </option>
                                    </select>
                                    {roleUpdatingId === user.id && (
                                      <div className="w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleToggleSuspension(user.id, !user.is_suspended)}
                                    disabled={suspensionUpdatingId === user.id}
                                    className={`flex items-center gap-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                                      user.is_suspended
                                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
                                        : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                    }`}
                                  >
                                    {user.is_suspended ? (
                                      <>
                                        <CheckCircle2 size={10} /> Unsuspend
                                      </>
                                    ) : (
                                      <>
                                        <UserX size={10} /> Suspend
                                      </>
                                    )}
                                    {suspensionUpdatingId === user.id && (
                                      <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin shrink-0 ml-1" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex justify-end gap-4 text-right">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-white/30 uppercase tracking-widest font-black">
                                      Followers
                                    </span>
                                    <span className="text-xs font-black text-white">
                                      {user.follower_count || 0}
                                    </span>
                                  </div>
                                  <div className="flex flex-col border-l border-white/5 pl-4">
                                    <span className="text-[8px] text-white/30 uppercase tracking-widest font-black">
                                      Following
                                    </span>
                                    <span className="text-xs font-black text-white">
                                      {user.following_count || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* 5. AUDIT LOGS */}
            {activeTab === "logs" && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 flex items-center gap-2">
                    <History size={12} /> System Audit Trail
                  </h3>
                  <button
                    onClick={() => fetchLogs()}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoading ? "animate-spin" : ""}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {moderationLogs.length === 0 ? (
                    <div className="p-12 rounded-[2rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center gap-3">
                      <FileText size={32} className="text-white/10" />
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
                        No logs found
                      </h4>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest">
                        System activity will appear here once moderation actions
                        occur.
                      </p>
                    </div>
                  ) : (
                    moderationLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-[#0c0c0c] border border-white/5 flex flex-col gap-3 group hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                              <Shield size={14} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-tight">
                                  {(log as any).moderator?.full_name ||
                                    "System Auto-Mod"}
                                </span>
                                <span className="text-[8px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20 uppercase tracking-widest">
                                  {log.action_type.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                                Target: {log.target_type} (
                                {log.target_id.slice(0, 8)}...)
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                            {new Date(log.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {log.reason && (
                          <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[9px] text-white/60 italic font-medium leading-relaxed">
                              "{log.reason}"
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. SETTINGS & PLATFORM CONFIG */}
            {activeTab === "settings" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1">
                    Global Economic Variables
                  </h4>
                  <div className="flex flex-col gap-3">
                    {[
                      {
                        label: "Platform Commission",
                        value: "12%",
                        desc: "Base cut per transaction",
                      },
                      {
                        label: "Agent Revenue Share",
                        value: "3%",
                        desc: "Commission given to acquiring agent",
                      },
                      {
                        label: "Escrow Auto-Release",
                        value: "7 Days",
                        desc: "Post-delivery auto clear timeline",
                      },
                    ].map((setting, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5"
                      >
                        <div>
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest">
                            {setting.label}
                          </h5>
                          <p className="text-[9px] text-white/40 mt-1">
                            {setting.desc}
                          </p>
                        </div>
                        <div className="text-sm font-black text-white">
                          {setting.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] border border-white/10 border-dashed flex flex-col gap-3">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Radio size={14} className="text-yellow-500" /> Broadcast
                    System
                  </h4>
                  <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                    Send a push notification and in-app banner to all{" "}
                    {(stats?.total_users ?? 0).toLocaleString()} active
                    ecosystem users instantly.
                  </p>
                  <button className="w-full h-12 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] mt-2 active:scale-95 transition-all">
                    Compose Broadcast
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DISPUTE RESOLUTION MODAL OVERLAY */}
      <AnimatePresence>
        {selectedDispute && (
          <div className="fixed inset-0 z-[300] flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDispute(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative h-[85vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[2rem] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 shrink-0">
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase">
                        DSP-{selectedDispute.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest border border-red-500/20">
                        {selectedDispute.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1">
                      <Lock size={10} /> Escrow $
                      {selectedDispute.booking?.total_price || 0} Frozen
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDispute(null)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-8">
                {/* Parties Timeline */}
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30 mb-4">
                    The Parties
                  </h4>
                  <div className="flex items-stretch gap-2">
                    <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                        Client (Filing Party)
                      </span>
                      <div className="text-sm font-black text-white mt-1 uppercase">
                        {selectedDispute.booking?.buyer?.full_name ||
                          selectedDispute.reporter?.full_name}
                      </div>
                      <button className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-3 flex items-center gap-1">
                        <MessageSquare size={10} /> View Chat Hist
                      </button>
                    </div>
                    <div className="flex items-center justify-center w-8 text-white/20">
                      <RefreshCw size={14} />
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                        Hustler (Provider)
                      </span>
                      <div className="text-sm font-black text-white mt-1 uppercase">
                        {selectedDispute.booking?.seller?.full_name || "N/A"}
                      </div>
                      <button className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-3 flex items-center gap-1">
                        <FileText size={10} /> View Deliverables
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-[1.5rem] bg-red-900/10 border border-red-500/20">
                  <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500 mb-2">
                    Claim Details
                  </h4>
                  <p className="text-xs text-white/80 font-medium leading-relaxed italic">
                    "{selectedDispute.details || selectedDispute.reason}"
                  </p>
                </div>

                {/* Resolution Actions */}
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30 mb-4 flex gap-2 items-center">
                    <Scale size={12} /> Resolution Options
                  </h4>
                  <div className="flex flex-col gap-3">
                    <button className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                      <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-tight">
                          Refund Client Fully
                        </div>
                        <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">
                          Returns ${selectedDispute.booking?.total_price || 0}{" "}
                          to client wallet. Penalizes hustler.
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-white/40" />
                    </button>
                    <button className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                      <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-tight">
                          Release to Hustler
                        </div>
                        <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">
                          Clears ${selectedDispute.booking?.total_price || 0}{" "}
                          escrow to hustler. Dismisses claim.
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-white/40" />
                    </button>
                    <button className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                      <div>
                        <div className="text-[11px] font-black text-purple-400 uppercase tracking-tight">
                          Split / Custom Resolution
                        </div>
                        <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">
                          Define custom percentage refund.
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-purple-400/50" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
