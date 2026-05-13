import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Bell, BellOff, CheckCircle2, MessageSquare, 
  DollarSign, ShoppingBag, Radio, Shield, Star,
  Clock, ChevronRight, MoreVertical, Filter,
  TrendingUp, Zap, Info, Briefcase
} from "lucide-react";

interface NotificationCenterProps {
  onClose: () => void;
}

type NotificationType = 'social' | 'marketplace' | 'wallet' | 'livestream' | 'system';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isUnread: boolean;
  actionLabel?: string;
  bundleCount?: number;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  const notifications: NotificationItem[] = [
    {
      id: '1',
      type: 'marketplace',
      title: 'New Booking Request',
      description: 'Felix wants to book you for "UI Design" session.',
      time: '2m ago',
      isUnread: true,
      actionLabel: 'Review Request'
    },
    {
      id: '2',
      type: 'wallet',
      title: 'Escrow Released',
      description: '₦450,000 has been released to your available balance.',
      time: '1h ago',
      isUnread: true,
      actionLabel: 'View Balance'
    },
    {
      id: '3',
      type: 'social',
      title: 'Post Performance',
      description: 'Your latest reel got 15 likes + 4 others.',
      time: '3h ago',
      isUnread: false,
      bundleCount: 19
    },
    {
      id: '4',
      type: 'livestream',
      title: 'Live Discovery',
      description: 'Sarah is live now: "Marketing Masterclass"',
      time: '5h ago',
      isUnread: false,
      actionLabel: 'Join Live'
    },
    {
      id: '5',
      type: 'system',
      title: 'Security Sync',
      description: 'Your identity verification is successfully completed.',
      time: 'Yesterday',
      isUnread: false
    }
  ];

  const filtered = notifications.filter(n => activeFilter === 'all' || n.type === activeFilter);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'social': return <MessageSquare size={16} className="text-blue-400" />;
      case 'marketplace': return <ShoppingBag size={16} className="text-emerald-400" />;
      case 'wallet': return <DollarSign size={16} className="text-yellow-500" />;
      case 'livestream': return <Radio size={16} className="text-red-500" />;
      case 'system': return <Shield size={16} className="text-brand-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="noise-overlay opacity-[0.03]" />

      <header className="relative z-10 px-6 pt-12 pb-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                 <Bell size={20} className="text-brand-primary" />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-tight italic">Activity Feed</h1>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Smart Notifications</span>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           {[
             { id: 'all', label: 'All' },
             { id: 'social', label: 'Social' },
             { id: 'marketplace', label: 'Orders' },
             { id: 'wallet', label: 'Finance' },
             { id: 'livestream', label: 'Live' }
           ].map(filter => (
             <button 
               key={filter.id}
               onClick={() => setActiveFilter(filter.id as any)}
               className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap active-scale ${activeFilter === filter.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
             >
               {filter.label}
             </button>
           ))}
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar py-4 px-4">
         {filtered.length > 0 ? (
           <div className="space-y-1">
             {filtered.map((n, i) => (
               <motion.div 
                 key={n.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className={`p-5 rounded-[2rem] border transition-all ${n.isUnread ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-transparent border-transparent opacity-60'}`}
               >
                  <div className="flex gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.isUnread ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-white/5'}`}>
                        {getIcon(n.type)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="text-[11px] font-black uppercase tracking-tight italic">{n.title}</h3>
                           <span className="text-[8px] font-bold text-white/20 uppercase whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[12px] font-medium text-white/60 leading-tight">
                           {n.description}
                        </p>
                        
                        {n.actionLabel && (
                          <button className="mt-4 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary hover:text-white transition-all active-scale">
                             {n.actionLabel}
                          </button>
                        )}

                        {n.bundleCount && (
                          <div className="mt-3 flex items-center gap-2">
                             <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="w-5 h-5 rounded-full border border-black bg-white/5 overflow-hidden">
                                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=P${i}`} alt="user" />
                                  </div>
                                ))}
                             </div>
                             <span className="text-[8px] font-black uppercase tracking-widest text-white/20">+{n.bundleCount - 3} others</span>
                          </div>
                        )}
                     </div>
                     {n.isUnread && (
                       <div className="w-2 h-2 rounded-full bg-brand-primary mt-1" />
                     )}
                  </div>
               </motion.div>
             ))}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-full opacity-20 gap-4">
              <BellOff size={64} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Quiet at the moment</p>
           </div>
         )}
      </main>

      <footer className="px-6 py-8 border-t border-white/5 bg-black/40 backdrop-blur-3xl safe-bottom">
         <button className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors group">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">Mark all as processed</span>
         </button>
      </footer>
    </div>
  );
}
