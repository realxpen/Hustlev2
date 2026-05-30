import { motion, AnimatePresence } from "motion/react";
import { 
  Users, TrendingUp, Shield, Activity, ChevronLeft, 
  Settings, Search, ArrowUpRight, DollarSign, Clock,
  CheckCircle2, XCircle, AlertCircle, Plus, MoreHorizontal,
  Briefcase, BarChart3, MessageSquare, ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAgentStore } from "../stores/useAgentStore";
import { useAuth } from "../features/auth";
import { supabase } from "../lib/supabase";

interface AgencyCenterProps {
  onBack: () => void;
}

export default function AgencyCenter({ onBack }: AgencyCenterProps) {
  const { user } = useAuth();
  const { 
    managedHustlers, 
    pendingInvites, 
    commissionHistory,
    analytics,
    isLoading,
    fetchManagedHustlers,
    fetchPendingInvites,
    fetchCommissionHistory,
    fetchAgentAnalytics,
    respondToInvite,
    requestAgentAccess
  } = useAgentStore();

  const [activeTab, setActiveTab] = useState<"overview" | "roster" | "requests" | "revenue">("overview");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hustlerSearchResults, setHustlerSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedHustler, setSelectedHustler] = useState<any>(null);
  const [commissionRate, setCommissionRate] = useState(15);

  useEffect(() => {
    fetchManagedHustlers();
    fetchPendingInvites();
    fetchCommissionHistory();
    fetchAgentAnalytics();
  }, [fetchManagedHustlers, fetchPendingInvites, fetchCommissionHistory, fetchAgentAnalytics]);

  const handleSearchHustlers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setHustlerSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_hustler', true)
        .neq('id', user?.id)
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setHustlerSearchResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!selectedHustler) return;
    try {
      await requestAgentAccess(selectedHustler.id, commissionRate);
      setShowInviteModal(false);
      setSelectedHustler(null);
      setSearchQuery("");
      setHustlerSearchResults([]);
    } catch (err) {
      console.error("Request error:", err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[150] bg-black flex flex-col"
    >
      <div className="grain-overlay pointer-events-none opacity-20" />
      
      {/* Header */}
      <header className="sticky top-0 z-[100] flex justify-between items-center px-6 py-4 bg-black/80 backdrop-blur-3xl border-b border-white/5 safe-top">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-display font-black tracking-widest uppercase text-white">
              {managedHustlers[0]?.agent_profile?.agency_name || "Agency Manager"}
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Enterprise Control Deck</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowInviteModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl shadow-blue-500/20"
        >
          <Plus size={16} /> Invite Talent
        </button>
      </header>

      {/* Main Stats Top Bar */}
      <div className="px-6 py-6 border-b border-white/5 bg-gradient-to-b from-blue-950/10 to-transparent">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Active Talent</p>
            <h3 className="text-xl font-black text-white">{managedHustlers.length}</h3>
          </div>
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Total Revenue</p>
            <h3 className="text-xl font-black text-emerald-400">${analytics.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Avg. Commission</p>
            <h3 className="text-xl font-black text-blue-400">{analytics.averageCommission}%</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 py-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Dashboard", icon: <TrendingUp size={14} /> },
          { id: "roster", label: "Talent Roster", icon: <Users size={14} /> },
          { id: "requests", label: "Requests", icon: <Clock size={14} />, badge: pendingInvites.length },
          { id: "revenue", label: "Revenue History", icon: <DollarSign size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-12 px-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pt-4"
            >
              {/* Active Talent Flow Widget */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Growth Performance</h4>
                  <BarChart3 size={16} className="text-blue-500/40" />
                </div>
                
                <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Net Earnings (30d)</p>
                      <h2 className="text-3xl font-black text-white">${analytics.totalRevenue.toLocaleString()}</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
                       <ArrowUpRight size={14} /> +12.5%
                    </div>
                  </div>
                  
                  {/* Mini-Graph Stub */}
                  <div className="h-20 w-full flex items-end gap-1 px-2">
                    {[30, 45, 25, 60, 40, 75, 50, 90, 65, 80].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-blue-500/20 rounded-t-md hover:bg-blue-500 transition-all cursor-help"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Quick Actions / Activity */}
              <section className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Recent Activity</h4>
                <div className="space-y-3">
                  {commissionHistory.slice(0, 3).map((comm, idx) => (
                    <div key={idx} className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <DollarSign size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white uppercase tracking-tight">Commission Payout</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest font-black">Ref: Booking #{comm.booking_id.substring(0, 6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-emerald-400 tracking-widest">+${comm.commission_amount}</p>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest">Success</p>
                      </div>
                    </div>
                  ))}
                  {commissionHistory.length === 0 && (
                    <div className="p-8 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                      <DollarSign size={24} className="mx-auto text-white/10 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No commission history yet</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "roster" && (
            <motion.div
              key="roster"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text"
                  placeholder="Filter your talent base..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500 transition-all font-black uppercase tracking-[0.2em]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {managedHustlers.map((rel: any) => (
                  <div key={rel.id} className="p-5 rounded-[2.5rem] bg-white/[0.03] border border-white/5 group hover:border-blue-500/30 transition-all relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl border-2 border-white/10 p-0.5 overflow-hidden">
                          <img 
                            src={rel.hustler_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rel.hustler_profile?.username}`} 
                            className="w-full h-full object-cover rounded-[calc(1rem-2px)]"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                             {rel.hustler_profile?.full_name}
                             <ShieldCheck size={14} className="text-blue-500" />
                          </h4>
                          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">@{rel.hustler_profile?.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                           <span className="text-[10px] font-black text-blue-400 tracking-widest">{rel.commission_percentage}%</span>
                        </div>
                        <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">Split Rate</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-white/5">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Contract</p>
                        <p className="text-[10px] font-black text-white uppercase">{new Date(rel.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Role</p>
                        <p className="text-[10px] font-black text-blue-400 uppercase">Specialist</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase">Active</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5">
                         View Performance
                      </button>
                      <button className="w-12 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                         <MessageSquare size={16} className="text-white/40" />
                      </button>
                    </div>
                  </div>
                ))}

                {managedHustlers.length === 0 && (
                   <div className="p-12 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                      <Users size={32} className="mx-auto text-white/10 mb-4" />
                      <h4 className="text-sm font-black text-white/40 uppercase tracking-widest">No Managed Specialists</h4>
                      <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest max-w-[200px] mx-auto">Build your agency by inviting creators to provide agency management services.</p>
                      <button 
                        onClick={() => setShowInviteModal(true)}
                        className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10"
                      >
                         Invite First Creator
                      </button>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-4">
                {pendingInvites.map((invite: any) => {
                  const isSentByMe = invite.agent_id === user?.id;
                  const profile = isSentByMe ? invite.hustler_profile : invite.agent_profile;
                  
                  return (
                    <div key={invite.id} className="p-5 rounded-[2.5rem] bg-white/[0.03] border border-white/5 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden text-center flex items-center justify-center font-black text-xl">
                            {profile?.avatar_url ? (
                               <img src={profile.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                               profile?.full_name?.charAt(0) || "U"
                            )}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">
                               {isSentByMe ? "Invitation Sent" : "Request Received"}
                            </p>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{profile?.full_name}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[11px] font-black text-white tracking-widest">{invite.commission_percentage}%</span>
                           <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">Proposed Split</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 relative z-10">
                        {isSentByMe ? (
                          <button className="flex-1 py-3 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-white/40" disabled>
                             Waiting for approval...
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => respondToInvite(invite.id, 'active')}
                              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active-scale"
                            >
                               Accept Partnership
                            </button>
                            <button 
                              onClick={() => respondToInvite(invite.id, 'revoked')}
                              className="flex-1 py-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all font-black"
                            >
                               Decline
                            </button>
                          </>
                        )}
                      </div>

                      {/* Visual indicator of flow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-3xl pointer-events-none" />
                    </div>
                  );
                })}

                {pendingInvites.length === 0 && (
                   <div className="p-12 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                      <Clock size={32} className="mx-auto text-white/10 mb-4" />
                      <h4 className="text-sm font-black text-white/40 uppercase tracking-widest">Queue Clear</h4>
                      <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest">Manage your pending talent requests and management invites here.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "revenue" && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4"
            >
              <div className="p-6 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-2">Total Accumulated Commission</p>
                 <h2 className="text-5xl font-black text-white italic tracking-tighter">${analytics.totalRevenue.toLocaleString()}<span className="text-lg font-normal text-white/20"> USD</span></h2>
                 <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black mt-4">Growth Rate: +{analytics.growthRate}% Since Last Month</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Ledger Details</h4>
                {commissionHistory.map((comm: any) => (
                  <div key={comm.id} className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center font-black">
                        <span className="text-[8px] text-white/40 leading-none mb-0.5">{new Date(comm.created_at).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-sm text-white leading-none">{new Date(comm.created_at).getDate()}</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-tight">
                           {comm.hustler_profile?.full_name || 'Specialist Split'}
                        </p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest font-black">Booking #{comm.booking_id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-emerald-400 tracking-widest">+${comm.commission_amount}</p>
                       <p className="text-[8px] text-white/20 uppercase tracking-widest">Released</p>
                    </div>
                  </div>
                ))}
                
                {commissionHistory.length === 0 && (
                   <div className="p-12 text-center">
                      <Activity size={32} className="mx-auto text-white/10 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Ledger is currently empty</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invite Talent Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-8 pb-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setShowInviteModal(false)} className="text-white/40 hover:text-white">
                    <XCircle size={24} />
                 </button>
              </div>

              <div className="flex flex-col items-center text-center gap-2 mb-8">
                <Users size={32} className="text-blue-500 mb-2" />
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Invite Talent</h3>
                <p className="text-xs text-white/40 font-medium px-8 leading-relaxed uppercase tracking-widest">Build your portfolio by managing elite creators and hustlers</p>
              </div>

              <div className="space-y-6">
                {/* Search Field */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500 transition-all font-black uppercase tracking-[0.1em]"
                      placeholder="Search for username or specialist name..."
                      value={searchQuery}
                      onChange={(e) => handleSearchHustlers(e.target.value)}
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                         <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {hustlerSearchResults.map((hustler) => (
                      <button
                        key={hustler.id}
                        onClick={() => setSelectedHustler(hustler)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                          selectedHustler?.id === hustler.id 
                            ? 'bg-blue-500/20 border-blue-500 text-white' 
                            : 'bg-white/5 border-transparent text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={hustler.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hustler.username}`} className="w-8 h-8 rounded-full" />
                          <div className="text-left">
                            <p className="text-[11px] font-black uppercase tracking-tight">{hustler.full_name}</p>
                            <p className="text-[9px] opacity-40 uppercase tracking-widest font-black">@{hustler.username}</p>
                          </div>
                        </div>
                        {selectedHustler?.id === hustler.id && <CheckCircle2 size={16} className="text-blue-500" />}
                      </button>
                    ))}
                    {searchQuery.length >= 3 && hustlerSearchResults.length === 0 && !isSearching && (
                       <p className="text-[9px] text-white/20 font-black uppercase tracking-widest py-4">No results for "{searchQuery}"</p>
                    )}
                  </div>
                </div>

                {/* Commission Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Commission Split Rate</p>
                    <span className="text-lg font-black text-blue-400">{commissionRate}%</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
                     <span>Fair Scale (1-10%)</span>
                     <span>Full Service (15-50%)</span>
                  </div>
                </div>

                <div className="pt-4">
                   <button 
                     onClick={handleRequestAccess}
                     disabled={!selectedHustler || isLoading}
                     className={`w-full h-16 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 ${
                       !selectedHustler || isLoading 
                        ? 'bg-white/5 text-white/10 cursor-not-allowed' 
                        : 'bg-white text-black shadow-xl shadow-white/5'
                     }`}
                   >
                     {isLoading ? "Sending Proposal..." : "Dispatch Invite Proposal"} <Plus size={18} />
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </motion.div>
  );
}
