import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Gift, Copy, Share2, Check, Send, 
  Twitter, Facebook, MessageSquare, Mail, 
  ArrowRight, Sparkles, Award, Star, ShieldCheck, 
  ChevronLeft, Landmark, RefreshCw, ShieldAlert, AlertCircle, Eye
} from "lucide-react";

export interface ReferralStat {
  invitesSent: number;
  successfulSignups: number;
  pendingSignups: number;
  tokensEarned: number;
  cashBonusEarned: number;
  flaggedCount: number;
}

export interface ReferralLog {
  id: string;
  name: string;
  email: string;
  status: "pending" | "signed_up" | "declined" | "flagged";
  date: string;
  rewardAmount: string;
  fraudReason?: string;
}

interface ReferralHubProps {
  onBack: () => void;
}

export function ReferralHub({ onBack }: ReferralHubProps) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [showToast, setShowToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "audit">("general");

  const [stats, setStats] = useState<ReferralStat>({
    invitesSent: 12,
    successfulSignups: 4,
    pendingSignups: 3,
    tokensEarned: 240,
    cashBonusEarned: 85.00,
    flaggedCount: 0
  });

  const [logs, setLogs] = useState<ReferralLog[]>([]);
  const [referralCode, setReferralCode] = useState("HUSTLE-JOIN-XPENS7");
  const [referralLink, setReferralLink] = useState("https://hustle.app/join?ref=XPENS7");
  const [simulationEmail, setSimulationEmail] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  // Safe API helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("hustle_auth_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats from Express backend
      const response = await fetch("/api/referrals/stats", {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (result.success && result.data) {
        const backendStats = result.data.stats;
        const backendLogs = result.data.logs;

        setStats({
          invitesSent: backendStats.invitesSentCount ?? 0,
          successfulSignups: backendStats.successfulSignupsCount ?? 0,
          pendingSignups: backendStats.pendingSignupsCount ?? 0,
          tokensEarned: backendStats.rewardsXp ?? 0,
          cashBonusEarned: backendStats.rewardsBalance ?? 0,
          flaggedCount: backendStats.flaggedCount ?? 0
        });

        if (backendStats.referralCode) {
          setReferralCode(backendStats.referralCode);
          setReferralLink(backendStats.referralLink);
        }

        const formattedLogs: ReferralLog[] = backendLogs.map((item: any) => ({
          id: item.id,
          name: item.inviteeName,
          email: item.inviteeEmail,
          status: item.status,
          date: new Date(item.createdAt).toISOString().split("T")[0],
          rewardAmount: item.status === "signed_up" ? "$20.00 + 50 XP" : item.status === "flagged" ? "Ineligible" : "Pending Signup",
          fraudReason: item.fraudReason
        }));

        setLogs(formattedLogs);
      } else {
        // Fallback for demo when no user logged in
        setLogs([
          {
            id: "ref-1",
            name: "Marcus Aurelius",
            email: "marcus.barber@gmail.com",
            status: "signed_up",
            date: "2026-06-08",
            rewardAmount: "$20.00 + 50 XP"
          },
          {
            id: "ref-2",
            name: "Juliana Santos",
            email: "jules.designs@ux.io",
            status: "signed_up",
            date: "2026-06-05",
            rewardAmount: "$20.00 + 50 XP"
          },
          {
            id: "ref-3",
            name: "Derrick Vance",
            email: "derrick.v@outlook.com",
            status: "pending",
            date: "2026-06-10",
            rewardAmount: "Pending Signup"
          },
          {
            id: "ref-4",
            name: "Sarah Chen",
            email: "sarahc.mktg@gmail.com",
            status: "signed_up",
            date: "2026-05-28",
            rewardAmount: "$20.00 + 50 XP"
          },
          {
            id: "ref-5",
            name: "Liam O'Connor",
            email: "liam@builders.ie",
            status: "pending",
            date: "2026-06-11",
            rewardAmount: "Pending Signup"
          }
        ]);
      }
    } catch (err) {
      console.warn("Express API unreachable, running client sandbox mode", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    triggerToast("Referral link copied to clipboard! Share it anywhere.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) {
      triggerToast("Please supply both nominee name and email address.", "error");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/referrals/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail
        })
      });

      const result = await response.json();

      if (result.success) {
        triggerToast(`Frictionless invite successfully routed to ${inviteName}!`, "success");
        setInviteName("");
        setInviteEmail("");
        // Refresh live data
        await loadData();
      } else {
        // Display precise error, commonly fraud flags
        triggerToast(result.error || "System rejected referral creation", "error");
        await loadData();
      }
    } catch (err: any) {
      triggerToast("Failed to communicate with Express security layer.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationEmail) {
      triggerToast("Please supply a referred friend's email address.", "error");
      return;
    }

    setIsSimulating(true);
    try {
      const response = await fetch("/api/referrals/reward", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: simulationEmail })
      });
      const result = await response.json();

      if (result.success) {
        triggerToast("Successful simulation join! Split cash bonus distributed.", "success");
        setSimulationEmail("");
        await loadData();
      } else {
        triggerToast(result.error || "Failed to trigger user onboarding simulation", "error");
      }
    } catch (err) {
      triggerToast("Failed to process simulation request on server", "error");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSocialShare = (platform: "twitter" | "facebook" | "whatsapp" | "email") => {
    let url = "";
    const text = encodeURIComponent("Accelerate your trade freelancing career with Hustle. Claim your $20 bonus using my dynamic partner link!");
    
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(referralLink)}`;
        break;
      case "email":
        url = `mailto:?subject=Earn%20$20%20with%20Hustle%20Academy&body=${text}%20${encodeURIComponent(referralLink)}`;
        break;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    triggerToast(`Launching ${platform} shared dialog!`, "info");
  };

  const handleClaimPayout = async () => {
    if (stats.cashBonusEarned <= 0) {
      triggerToast("Accumulate further signup milestones to initiate withdraw transfers.", "error");
      return;
    }

    try {
      const response = await fetch("/api/referrals/payout", {
        method: "POST",
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (result.success) {
        triggerToast(`Successfully withdrawn $${result.payout.claimed.toFixed(2)} to your connected card! 💳`, "success");
        await loadData();
      } else {
        triggerToast(result.error || "Withdraw claims rejected", "error");
      }
    } catch (err) {
      // Fallback local UI behavior
      const currentBonus = stats.cashBonusEarned;
      triggerToast(`Dispatching $${currentBonus.toFixed(2)} to your connected balance card! 💳`, "success");
      setStats(prev => ({
        ...prev,
        cashBonusEarned: 0
      }));
    }
  };

  return (
    <motion.div 
      id="referral-hub-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-[#050608] flex flex-col overflow-hidden text-white"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/15 via-[#06070a] to-[#040507] pointer-events-none" />
      <div className="grain-overlay pointer-events-none" />

      {/* Top Banner Navigation */}
      <div className="relative z-10 px-6 pt-12 pb-5 border-b border-white/[0.04] bg-[#06070a]/85 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            id="referral-back-btn"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#10b981]">Platform Growth</p>
            <h2 className="text-lg font-black tracking-tight italic uppercase">Referral Center</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-2xl flex p-0.5">
            <button 
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${activeTab === "general" ? "bg-white/10 text-white" : "text-white/40"}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab("audit")}
              className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "audit" ? "bg-red-500/10 text-red-400 border border-red-500/10" : "text-white/40"}`}
            >
              <ShieldCheck size={11} /> Fraud Guard
            </button>
          </div>
          <button 
            onClick={loadData} 
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Primary Scroll Container */}
      <div id="referrals-scroll" className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10 px-6 pt-6">

        {/* TOAST SYSTEM */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 left-6 right-6 z-[650] max-w-md mx-auto"
            >
              <div className={`border text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-3xl ${
                showToast.type === "success" 
                  ? "bg-[#0b1b14] border-emerald-500/30 text-emerald-300"
                  : showToast.type === "error"
                  ? "bg-[#210f0f] border-red-500/30 text-red-300"
                  : "bg-[#10131c] border-blue-500/30 text-blue-300"
              }`}>
                {showToast.type === "error" ? <AlertCircle size={16} /> : <Sparkles size={16} className="animate-pulse" />}
                <span>{showToast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-md mx-auto flex flex-col gap-6">

          {activeTab === "general" ? (
            <>
              {/* Epic Hero Invitation Card */}
              <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#0c0d12] via-[#080d1a] to-[#040507] border border-blue-500/10 text-left relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-10 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-3">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 self-start rounded-full text-[8px] font-mono tracking-widest uppercase font-black">
                    Viral Engine
                  </span>
                  <h3 className="text-2xl font-black italic uppercase tracking-tight leading-none mt-1">
                    Bring Your Crew. <br />
                    <span className="text-[#10b981]">Split $40 Cash.</span>
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed mt-1">
                    Nominate fellow tradespeople or technicians. When they register and fulfill a debut request, <span className="text-white font-bold">you pocket $20</span> and <span className="text-white font-bold">they pocket $20</span> instantly.
                  </p>

                  {/* Copy Area */}
                  <div className="mt-4 flex flex-col gap-1.5">
                    <label className="text-[8px] font-mono font-black uppercase text-white/40 tracking-widest">Your Private Partner Link</label>
                    <div className="flex bg-white/[0.02] border border-white/5 rounded-2xl p-1.5 focus-within:border-emerald-500/30 transition-all items-center justify-between">
                      <span className="text-xs font-mono text-white/50 overflow-hidden text-ellipsis whitespace-nowrap pl-2.5 max-w-[210px]">
                        {referralLink}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-white text-black hover:bg-emerald-400 hover:text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                      >
                        {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Viral share buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => handleSocialShare("twitter")}
                      className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-sky-500/10 hover:text-sky-400 flex items-center justify-center transition-all cursor-pointer"
                      title="Share on Twitter"
                    >
                      <Twitter size={15} />
                    </button>
                    <button 
                      onClick={() => handleSocialShare("facebook")}
                      className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-blue-600/10 hover:text-blue-500 flex items-center justify-center transition-all cursor-pointer"
                      title="Share on Facebook"
                    >
                      <Facebook size={15} />
                    </button>
                    <button 
                      onClick={() => handleSocialShare("whatsapp")}
                      className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-emerald-500/10 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                      title="Share on WhatsApp"
                    >
                      <MessageSquare size={15} />
                    </button>
                    <button 
                      onClick={() => handleSocialShare("email")}
                      className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                      title="Invite via Email"
                    >
                      <Mail size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Dashboard Ledger - Bento Structure */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 text-left">Real-Time Progression Logs</h3>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                  
                  {/* Box 1: Successful */}
                  <div className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden group">
                    <div className="absolute right-2 top-2 bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                      <Users size={16} />
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-[28px] font-black tracking-tight text-white leading-none">
                        {stats.successfulSignups}
                      </span>
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-wider mt-1">Successful Signups</span>
                    </div>
                  </div>

                  {/* Box 2: Invites Sent */}
                  <div className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden group">
                    <div className="absolute right-2 top-2 bg-blue-500/10 text-blue-400 p-2 rounded-xl border border-blue-500/20">
                      <Send size={16} />
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-[28px] font-black tracking-tight text-white leading-none">
                        {stats.invitesSent}
                      </span>
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-wider mt-1">Invites Sent</span>
                    </div>
                  </div>

                  {/* Box 3: Total Rewards Earned with Action to Claim */}
                  <div className="col-span-2 p-5 rounded-[2rem] bg-gradient-to-tr from-emerald-950/20 to-white/[0.01] border border-emerald-500/10 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 blur-xl pointer-events-none" />
                    <div className="text-left relative z-10">
                      <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">Available Balance</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black tracking-tight">
                          ${stats.cashBonusEarned.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-emerald-400/60 font-mono font-bold">+ {stats.tokensEarned} XP</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleClaimPayout}
                      className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#050608] font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_5px_15px_rgba(16,185,129,0.3)]"
                    >
                      <Landmark size={12} /> Claim Cash
                    </button>
                  </div>

                </div>
              </div>

              {/* Social Email Dispatch Inviter Form */}
              <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Direct Network Dispatch</h4>
                    <p className="text-[9px] text-white/40 uppercase tracking-wider">Route zero-friction invites via system mailers</p>
                  </div>
                </div>

                <form onSubmit={handleSendInvite} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="First Nominee Name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="px-4 py-3.5 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:border-blue-500/30 focus:outline-none transition-all"
                      disabled={isSending}
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Nominee Email Address (Blocks Spam)"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 px-4 py-3.5 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:border-blue-500/30 focus:outline-none transition-all"
                      disabled={isSending}
                    />
                    
                    <button
                      type="submit"
                      disabled={isSending}
                      className="px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSending ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Send size={12} /> Route
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Detailed Referrals list audit ledger */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 text-left">Referral Ledger History</h3>

                <div className="flex flex-col gap-2">
                  {logs.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/[0.01] border border-white/5 text-center text-white/40 text-xs">
                      No referral invitations recorded. Choose a friend above to begin.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between text-left relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold border uppercase text-xs ${
                            log.status === "flagged" 
                              ? "bg-red-500/10 text-red-400 border-red-500/20" 
                              : "bg-white/5 text-white/70 border-white/5"
                          }`}>
                            {log.status === "flagged" ? "!" : log.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{log.name}</h4>
                              <span className="text-[8px] text-white/30 font-mono">{log.date}</span>
                            </div>
                            <p className="text-[10px] text-white/40 mt-1 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{log.email}</p>
                            {log.status === "flagged" && log.fraudReason && (
                              <p className="text-[9px] text-red-400 font-medium flex items-center gap-1 mt-1 font-mono">
                                <ShieldAlert size={10} /> {log.fraudReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[11px] font-mono font-black text-white">{log.rewardAmount}</span>
                          <div className="mt-1 flex justify-end">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              log.status === "signed_up" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : log.status === "flagged"
                                ? "bg-red-500/10 text-red-400 border border-red-400/20"
                                : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            }`}>
                              {log.status === "signed_up" ? "Reward Issued" : log.status === "flagged" ? "Flagged Threat" : "Pending Join"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* FRAUD GUARD AUDIT SCREEN */
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-6 text-left"
            >
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-red-950/10 to-transparent border border-red-500/10 relative overflow-hidden">
                <div className="absolute top-2 right-2 p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-base font-black italic uppercase text-red-400">Hustle Shield Pro active</h3>
                <p className="text-xs text-white/60 leading-relaxed mt-2">
                  Our fully automated fraud analysis pipeline scrutinizes each incoming request against sybil patterns. Flagged items can never trigger wallet cash actions.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-red-500/10 text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-white/40">Disposable Domains Blocked</p>
                    <p className="text-sm font-black text-white mt-1">9 standard (Mailinator, Yopmail...)</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-white/40">Flagged Campaign Threats</p>
                    <p className="text-sm font-black text-red-400 mt-1">{stats.flaggedCount} Invites</p>
                  </div>
                </div>
              </div>

              {/* Simulate join center */}
              <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Onboarding Simulation Engine</h4>
                    <p className="text-[9px] text-white/40 uppercase tracking-wider">Fast-verify split cash rewards and ledger distribution.</p>
                  </div>
                </div>

                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                  Enter any referred friend's email address from your list and register their join action. Clean invites earn <strong>$20.00 cash + 50 Academy XP</strong> under real-time settlements. Flagged accounts are blocked instantly.
                </p>

                <form onSubmit={handleSimulateSignup} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter friend's email (e.g. derrick.v@outlook.com)"
                    value={simulationEmail}
                    onChange={(e) => setSimulationEmail(e.target.value)}
                    className="flex-1 px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:border-blue-500/30 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSimulating}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                  </button>
                </form>
              </div>

              {/* Explaining our Anti-Fraud rules */}
              <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 flex flex-col gap-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#10b981]">Pipeline Protection Standards</h4>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</div>
                    <div>
                      <h5 className="font-bold text-white uppercase tracking-tight text-[11px]">Self-Referral Deterrence</h5>
                      <p className="text-white/50 text-[11px] mt-0.5">Scans normalization variables to arrest authors who enroll alias alternatives like (bob+1@gmail.com) matching the identity header.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</div>
                    <div>
                      <h5 className="font-bold text-white uppercase tracking-tight text-[11px]">Velocity Throttle Bounds</h5>
                      <p className="text-white/50 text-[11px] mt-0.5">Halts Sybil spam attacks instantly. Limits account holders to a strict maximum of 5 dispatched invitations per rolling 10-minute window.</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</div>
                    <div>
                      <h5 className="font-bold text-white uppercase tracking-tight text-[11px]">IP/Host Fingerprint Cluster Inspection</h5>
                      <p className="text-white/50 text-[11px] mt-0.5">Arrest multi-device farms. Flags campaigns immediately if distinct, unrelated accounts submit referrals using duplicate network footprints.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </motion.div>
  );
}

export default ReferralHub;
