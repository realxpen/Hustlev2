import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { 
  ShieldAlert, Users, Grid, Shield, AlertTriangle, Settings, 
  ChevronLeft, Search, TrendingUp, DollarSign, Activity, FileText,
  UserCheck, UserX, Info, ArrowRight, Zap, Flag, Scale, CheckCircle2,
  XCircle, Clock, SearchCheck, MessageSquare, Lock, Settings2, ShieldCheck,
  Eye, PauseCircle, RefreshCw, BarChart3, Radio
} from "lucide-react";

interface AdminGovernanceHubProps {
  onClose: () => void;
}

type AdminTab = 'overview' | 'users' | 'verification' | 'disputes' | 'fraud' | 'settings';

export default function AdminGovernanceHub({ onClose }: AdminGovernanceHubProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);

  // Mock Data
  const kpis = {
    users: 14250,
    activeBookings: 842,
    escrowHeld: 125400,
    transactions: 24500,
    openDisputes: 12,
    flaggedContent: 34,
    mrr: 45200
  };

  const recentDisputes = [
    { id: 'DSP-092', client: 'Sarah L.', hustler: 'Marcus V.', reason: 'Non-delivery of final files', amount: 450, status: 'Investigation', risk: 'high', date: '2h ago' },
    { id: 'DSP-091', client: 'John D.', hustler: 'Ayo B.', reason: 'Quality not as described', amount: 120, status: 'Awaiting Hustler', risk: 'low', date: '5h ago' },
    { id: 'DSP-089', client: 'Elena R.', hustler: 'Dave S.', reason: 'No show for appointment', amount: 80, status: 'Admin Review', risk: 'medium', date: '1d ago' },
  ];

  const flaggedItems = [
    { id: 'FLG-1', type: 'Listing', user: 'AlexK', reason: 'Possible scam/fake product', confidence: 94 },
    { id: 'FLG-2', type: 'Account', user: 'DevTeamX', reason: 'Multiple failed payments', confidence: 88 },
    { id: 'FLG-3', type: 'Message', user: 'User99', reason: 'Requesting off-platform payment', confidence: 99 },
  ];

  const verificationQueue = [
    { id: 'V-101', name: 'Studio X', type: 'Agency', applyingFor: 'Premium Hustler', submitted: '1h ago' },
    { id: 'V-102', name: 'Sarah Jess', type: 'Individual', applyingFor: 'Pro Designer', submitted: '3h ago' },
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
            { id: 'overview', icon: <Activity size={14} />, label: 'Overview' },
            { id: 'users', icon: <Users size={14} />, label: 'Users' },
            { id: 'verification', icon: <ShieldCheck size={14} />, label: 'Queue' },
            { id: 'disputes', icon: <Scale size={14} />, label: 'Disputes' },
            { id: 'fraud', icon: <AlertTriangle size={14} />, label: 'Fraud Risk' },
            { id: 'settings', icon: <Settings2 size={14} />, label: 'Config' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-black shadow-lg' 
                  : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
              {(tab.id === 'disputes' || tab.id === 'fraud') && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[7px]">
                  {tab.id === 'disputes' ? kpis.openDisputes : flaggedItems.length}
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
            {activeTab === 'overview' && (
              <>
                <div>
                   <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 flex items-center gap-2">
                     <BarChart3 size={12} /> Platform Health Metrics
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                        { label: 'Total Users', value: kpis.users.toLocaleString(), icon: <Users /> },
                        { label: 'Active Escrow', value: `$${(kpis.escrowHeld/1000).toFixed(1)}k`, icon: <Lock /> },
                        { label: 'Monthly Rev (MRR)', value: `$${(kpis.mrr/1000).toFixed(1)}k`, icon: <TrendingUp /> },
                        { label: 'Open Disputes', value: kpis.openDisputes, icon: <Scale className="text-red-400" /> },
                     ].map((stat, i) => (
                        <div key={i} className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col justify-between h-28 relative overflow-hidden group">
                           <div className="text-white/20 group-hover:text-white/40 transition-colors w-6 h-6">
                              {stat.icon}
                           </div>
                           <div>
                              <div className="text-2xl font-black tracking-tighter text-white">{stat.value}</div>
                              <div className="text-[9px] uppercase tracking-widest text-white/40 mt-1">{stat.label}</div>
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
                      <div>
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                            <span className="text-white">Booking Success Rate</span>
                            <span className="text-blue-400">94.2%</span>
                         </div>
                         <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[94.2%]" />
                         </div>
                      </div>
                      <div>
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                            <span className="text-white">Dispute Frequency (Target &lt; 2%)</span>
                            <span className="text-green-400">1.8%</span>
                         </div>
                         <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[1.8%]" />
                         </div>
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* 2. DISPUTE RESOLUTION + ESCROW */}
            {activeTab === 'disputes' && (
              <div className="flex flex-col gap-6">
                 <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                    <div>
                       <h3 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">Escrow Protection Active</h3>
                       <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Funds frozen until resolution.</p>
                    </div>
                    <Lock size={20} className="text-red-400/50" />
                 </div>

                 {recentDisputes.map(dispute => (
                    <div key={dispute.id} className="p-6 rounded-[2rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-5">
                       <div className="flex justify-between items-start">
                          <div>
                             <span className="text-[9px] font-black bg-red-500/20 text-red-400 px-2 py-1 rounded-md uppercase tracking-widest border border-red-500/20">
                                {dispute.risk} Risk
                             </span>
                             <h4 className="text-sm font-black text-white mt-3">{dispute.id}</h4>
                             <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{dispute.reason}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-xl font-black text-white">${dispute.amount}</div>
                             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Escrow Frozen</span>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 border-dashed">
                          <div className="flex-1 flex flex-col items-center">
                             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Client</span>
                             <span className="text-[10px] font-black text-white">{dispute.client}</span>
                          </div>
                          <div className="text-white/20"><Radio size={12} /></div>
                          <div className="flex-1 flex flex-col items-center">
                             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Hustler</span>
                             <span className="text-[10px] font-black text-white">{dispute.hustler}</span>
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
            )}

            {/* 3. VERIFICATION & MODERATION */}
            {activeTab === 'verification' && (
              <div className="flex flex-col gap-8">
                 <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 flex items-center gap-2">
                      <SearchCheck size={12} /> Pending Verification (Hustlers)
                    </h3>
                    <div className="flex flex-col gap-3">
                       {verificationQueue.map(item => (
                          <div key={item.id} className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col gap-4">
                             <div className="flex justify-between items-start">
                                <div>
                                   <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.name}</h4>
                                   <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Applying: {item.applyingFor}</p>
                                </div>
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.submitted}</span>
                             </div>
                             <div className="flex gap-2">
                                <button className="flex-1 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-500/20 transition-all">
                                   <CheckCircle2 size={12} /> Approve
                                </button>
                                <button className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
                                   <XCircle size={12} /> Reject
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all">
                                   <Eye size={14} />
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Ads & Content Governance */}
                 <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 flex items-center gap-2">
                      <Flag size={12} /> Content & Ads Moderation
                    </h3>
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center text-center gap-3">
                       <ShieldCheck size={32} className="text-white/10" />
                       <h4 className="text-[11px] font-black text-white uppercase tracking-widest">No pending content reviews</h4>
                       <p className="text-[9px] text-white/40 uppercase tracking-widest max-w-[200px]">Auto-mod is currently handling standard posts and listings.</p>
                    </div>
                 </div>
              </div>
            )}

            {/* 4. FRAUD & RISK */}
            {activeTab === 'fraud' && (
              <div className="flex flex-col gap-6">
                 <div className="p-6 rounded-[2rem] bg-red-900/10 border border-red-500/20 flex flex-col gap-2">
                    <h3 className="text-[14px] uppercase tracking-tighter font-black text-red-400 flex items-center gap-2">
                      <ShieldAlert size={16} /> AI Fraud Defense Active
                    </h3>
                    <p className="text-[10px] text-white/60 font-medium leading-relaxed">
                       System is monitoring for off-platform payment requests, network spoofing, and abnormal escrow rapid-releases.
                    </p>
                 </div>

                 <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1">Flagged Activity</h4>
                    <div className="flex flex-col gap-4">
                       {flaggedItems.map(flag => (
                          <div key={flag.id} className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-4">
                             <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${flag.confidence > 90 ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                      <AlertTriangle size={14} />
                                   </div>
                                   <div>
                                      <h5 className="text-[11px] font-black text-white uppercase tracking-wider">{flag.type} Review</h5>
                                      <p className="text-[9px] text-white/40 uppercase tracking-widest">{flag.user}</p>
                                   </div>
                                </div>
                                <div className="flex flex-col items-end">
                                   <span className={`text-[10px] font-black uppercase tracking-widest ${flag.confidence > 90 ? 'text-red-400' : 'text-yellow-400'}`}>
                                      {flag.confidence}% Risk
                                   </span>
                                </div>
                             </div>
                             <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] text-white font-medium italic">"{flag.reason}"</p>
                             </div>
                             <div className="flex gap-2">
                                <button className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest">Restrict</button>
                                <button className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest">Ignore</button>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {/* 5. USER & AGENT MANAGMENT */}
            {activeTab === 'users' && (
              <div className="flex flex-col gap-6">
                 {/* Search & Filter */}
                 <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      type="text" 
                      placeholder="Search UID, Name, Email..." 
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 text-xs text-white outline-none focus:border-white/30 transition-all font-medium"
                    />
                 </div>

                 <div className="p-6 rounded-[2rem] bg-purple-900/10 border border-purple-500/20">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-purple-400 mb-2 flex items-center gap-2">
                      <UserCheck size={12} /> Agent Network
                    </h3>
                    <p className="text-[10px] text-white/50 mb-4">Agents are currently managing 1,240 localized hustlers.</p>
                    <button className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/30 transition-all">
                       View Agent Performance Board
                    </button>
                 </div>

                 {/* Example User Card */}
                 <div className="p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-4 group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                          <img src="https://i.pravatar.cc/100?img=33" alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <h4 className="text-sm font-black text-white uppercase tracking-tight">Elijah M.</h4>
                             <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/20">Pro Hustler</span>
                          </div>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Joined 2024</p>
                       </div>
                       <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                          <Settings size={14} className="text-white/40" />
                       </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">Jobs</span>
                          <span className="text-xs font-black text-white mt-1">142</span>
                       </div>
                       <div className="flex flex-col items-center border-l border-r border-white/5">
                          <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">Rating</span>
                          <span className="text-xs font-black text-white mt-1">4.9</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">Status</span>
                          <span className="text-xs font-black text-green-400 mt-1">Active</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* 6. SETTINGS & PLATFORM CONFIG */}
            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                 <div>
                    <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-4 px-1">Global Economic Variables</h4>
                    <div className="flex flex-col gap-3">
                       {[
                         { label: 'Platform Commission', value: '12%', desc: 'Base cut per transaction' },
                         { label: 'Agent Revenue Share', value: '3%', desc: 'Commission given to acquiring agent' },
                         { label: 'Escrow Auto-Release', value: '7 Days', desc: 'Post-delivery auto clear timeline' }
                       ].map((setting, i) => (
                          <div key={i} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-[#0c0c0c] border border-white/5">
                             <div>
                                <h5 className="text-[11px] font-black text-white uppercase tracking-widest">{setting.label}</h5>
                                <p className="text-[9px] text-white/40 mt-1">{setting.desc}</p>
                             </div>
                             <div className="text-sm font-black text-white">{setting.value}</div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-6 rounded-[2rem] border border-white/10 border-dashed flex flex-col gap-3">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Radio size={14} className="text-yellow-500" /> Broadcast System
                    </h4>
                    <p className="text-[9px] text-white/40 leading-relaxed font-medium">
                       Send a push notification and in-app banner to all 14,250 active ecosystem users instantly.
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
                             <h3 className="text-xl font-black text-white tracking-tighter uppercase">{selectedDispute.id}</h3>
                             <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest border border-red-500/20">
                                Action Required
                             </span>
                          </div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1">
                             <Lock size={10} /> Escrow $450.00 Frozen
                          </p>
                       </div>
                       <button onClick={() => setSelectedDispute(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                          <XCircle size={20} />
                       </button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-8">
                    {/* Parties Timeline */}
                    <div>
                       <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/30 mb-4">The Parties</h4>
                       <div className="flex items-stretch gap-2">
                          <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Client (Filing Party)</span>
                             <div className="text-sm font-black text-white mt-1 uppercase">{selectedDispute.client}</div>
                             <button className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-3 flex items-center gap-1">
                                <MessageSquare size={10} /> View Chat Hist
                             </button>
                          </div>
                          <div className="flex items-center justify-center w-8 text-white/20">
                             <RefreshCw size={14} />
                          </div>
                          <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/5">
                             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Hustler (Provider)</span>
                             <div className="text-sm font-black text-white mt-1 uppercase">{selectedDispute.hustler}</div>
                             <button className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-3 flex items-center gap-1">
                                <FileText size={10} /> View Deliverables
                             </button>
                          </div>
                       </div>
                    </div>

                    <div className="p-5 rounded-[1.5rem] bg-red-900/10 border border-red-500/20">
                       <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500 mb-2">Claim Details</h4>
                       <p className="text-xs text-white/80 font-medium leading-relaxed italic">
                          "The provider marked the job as delivered 3 days ago, but only sent draft files. They are not responding to my revisions requesting the final source files as agreed in the contract."
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
                                <div className="text-[11px] font-black text-white uppercase tracking-tight">Refund Client Fully</div>
                                <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">Returns $450 to client wallet. Penalizes hustler.</div>
                             </div>
                             <ArrowRight size={16} className="text-white/40" />
                          </button>
                          <button className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                             <div>
                                <div className="text-[11px] font-black text-white uppercase tracking-tight">Release to Hustler</div>
                                <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">Clears $450 escrow to hustler. Dismisses claim.</div>
                             </div>
                             <ArrowRight size={16} className="text-white/40" />
                          </button>
                          <button className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                             <div>
                                <div className="text-[11px] font-black text-purple-400 uppercase tracking-tight">Split / Custom Resolution</div>
                                <div className="text-[9px] text-white/40 mt-1 uppercase tracking-widest">Define custom percentage refund.</div>
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
