import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, X, Send, Command, MessageSquare, 
  Search, Briefcase, Zap, DollarSign, Brain,
  ChevronRight, Mic, Filter, Cpu, Globe, Shield
} from "lucide-react";

interface HustleAIProps {
  onClose: () => void;
  currentContext: 'feed' | 'marketplace' | 'wallet' | 'chat' | 'profile' | 'live';
}

export default function HustleAI({ onClose, currentContext }: HustleAIProps) {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const contextSuggestions = {
    feed: ['Suggest hustlers for UI DESIGN', 'Show me viral marketing tips', 'Trending skills in Lagos'],
    marketplace: ['Is this price fair?', 'Review my listing description', 'Compare with top hustlers'],
    wallet: ['Explain this escrow status', 'How do I withdraw to bank?', 'Summary of last 30 days'],
    chat: ['Summarize our negotiation', 'Draft a professional reply', 'Highlight key deliverables'],
    profile: ['How to rank higher?', 'Optimize my portfolio', 'Analyse my review stats'],
    live: ['Suggest engagement topics', 'Who is in my audience?', 'Top gifters summary']
  };

  const currentSuggestions = contextSuggestions[currentContext] || contextSuggestions.feed;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      setQuery('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-end justify-center px-6 pb-12 font-sans">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />

        <header className="flex justify-between items-center relative z-10">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/30 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                 <Brain size={24} className="text-white" />
              </div>
              <div>
                 <h2 className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2">
                    Hustle AI 
                    <span className="px-2 py-0.5 bg-white/5 rounded-full border border-white/10 text-[8px] font-black text-white/40 tracking-widest flex items-center gap-1">
                       <Zap size={8} className="text-yellow-500" /> PRO
                    </span>
                 </h2>
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Context: {currentContext}</p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
              <X size={20} />
           </button>
        </header>

        <div className="space-y-6 relative z-10">
           <div className="flex flex-col gap-3">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Smart Suggestions</h4>
              <div className="flex flex-wrap gap-2">
                 {currentSuggestions.map((s, i) => (
                   <button 
                     key={i}
                     onClick={() => setQuery(s)}
                     className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all active-scale text-left"
                   >
                      {s}
                   </button>
                 ))}
              </div>
           </div>

           <form onSubmit={handleSubmit} className="relative group">
              <div className={`absolute inset-0 bg-brand-primary/10 blur-xl rounded-[2.5rem] transition-all duration-500 ${isThinking ? 'opacity-100' : 'opacity-0'}`} />
              <div className="relative flex items-center gap-3 bg-white/5 rounded-[2.5rem] p-3 border border-white/10 group-focus-within:border-brand-primary transition-all">
                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    {isThinking ? (
                      <Cpu size={20} className="text-brand-primary animate-spin" />
                    ) : (
                      <Sparkles size={20} className="text-brand-primary" />
                    )}
                 </div>
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="Ask me anything about your hustle..." 
                   className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium"
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                 />
                 <button 
                   type="submit"
                   disabled={!query.trim()}
                   className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/20 active-scale disabled:opacity-50 disabled:grayscale transition-all"
                 >
                    <Send size={20} className="translate-x-0.5" />
                 </button>
              </div>
           </form>

           <div className="flex items-center justify-center gap-6 py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                 <Globe size={12} className="text-white/20" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Market Insight Ready</span>
              </div>
              <div className="flex items-center gap-2">
                 <Shield size={12} className="text-white/20" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Private & Secure</span>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
