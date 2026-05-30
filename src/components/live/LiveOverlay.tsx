import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageSquare, ShoppingBag, Calendar, 
  Send, X, MoreHorizontal, Users, ShieldCheck, Star, 
  ChevronRight, Briefcase
} from 'lucide-react';
import { useLiveStore } from '../../stores/useLiveStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

interface LiveOverlayProps {
  sessionId: string;
  onClose: () => void;
}

export default function LiveOverlay({ sessionId, onClose }: LiveOverlayProps) {
  const { 
    currentSession, 
    messages, 
    reactions, 
    pinnedItems,
    sendMessage,
    sendReaction 
  } = useLiveStore();
  const { profile } = useAuthStore();
  
  const [commentText, setCommentText] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [hearts, setHearts] = useState<{ id: number, x: number }[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync reactions from other users to the local heart animation
  useEffect(() => {
    if (reactions.length > 0) {
      const lastReaction = reactions[reactions.length - 1];
      // Only animate reactions from others (or all if we want visual consistency)
      // To keep it clean, we just animate the most recent one if it's new
      setHearts(prev => [...prev, { id: Date.now(), x: Math.random() * 40 - 20 }]);
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== Date.now()));
      }, 2000);
    }
  }, [reactions]);

  const handleSendComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    sendMessage(sessionId, commentText);
    setCommentText('');
  };

  const handleReaction = (type: 'like' | 'fire' | 'clap' | 'heart') => {
    sendReaction(sessionId, type);
    // Note: The heart will be added via the useEffect subscription above
  };

  if (!currentSession) return null;

  const hostName = currentSession.host_profiles?.hustle_name || currentSession.host_profiles?.full_name || 'Hustler';
  const hostAvatar = currentSession.host_profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentSession.host_id}`;

  return (
    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
      {/* Top HUD */}
      <div className="p-4 flex justify-between items-start pointer-events-auto">
        <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 items-center gap-2 border border-white/10 shadow-xl">
           <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20">
              <img src={hostAvatar} alt="host" className="w-full h-full object-cover" />
           </div>
           <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1">
                 <span className="text-xs font-black text-white truncate">{hostName}</span>
                 {currentSession.host_profiles?.is_verified && <ShieldCheck size={10} className="text-blue-400 shrink-0" />}
              </div>
              <span className="text-[8px] font-bold text-white/50 tracking-widest uppercase truncate">{currentSession.host_profiles?.primary_skill || 'Host'}</span>
           </div>
           <div className="ml-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full shadow-lg flex items-center gap-1.5 transition-all">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Live
           </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
              <Users size={12} className="text-white/60" />
              <span className="text-[10px] font-black text-white tracking-widest">{currentSession.current_viewers || 0}</span>
           </div>
           <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
              <Heart size={12} className="text-red-500 fill-red-500" />
              <span className="text-[10px] font-black text-white tracking-widest">
                {currentSession.total_reactions > 1000 ? `${(currentSession.total_reactions / 1000).toFixed(1)}K` : currentSession.total_reactions || 0}
              </span>
           </div>
           <button 
             onClick={onClose}
             className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
           >
              <X size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom Area (Chat & Controls) */}
      <div className="p-4 flex flex-col gap-4 pointer-events-auto">
        
        {/* Pinned Item Preview */}
        {pinnedItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-2 bg-brand-primary/90 backdrop-blur-xl rounded-2xl w-fit max-w-[280px] active:scale-95 transition-all cursor-pointer shadow-2xl border border-white/20"
            onClick={() => setShowPinned(true)}
          >
             <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                <ShoppingBag size={18} className="text-brand-primary" />
             </div>
             <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-black/60">Pinned in Stream</span>
                <span className="text-xs font-black text-black truncate">View Community Shop</span>
             </div>
             <ChevronRight size={14} className="text-black/40" />
          </motion.div>
        )}

        {/* Chat Stream */}
        <div className="h-[180px] overflow-y-auto no-scrollbar flex flex-col gap-2 masked-fade-top pointer-events-auto">
          <div className="mt-auto" />
          {messages.map((msg, idx) => (
            <motion.div 
               key={msg.id}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-start gap-2 max-w-[80%] bg-black/20 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/5 shadow-sm"
            >
               <span className="text-[11px] font-black text-white/50 whitespace-nowrap">
                 {msg.user_profiles?.hustle_name || msg.user_profiles?.full_name?.split(' ')[0] || 'User'}
               </span>
               <span className="text-[11px] font-medium text-white leading-relaxed">
                 {msg.message}
               </span>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Interaction Bar */}
        <div className="flex gap-2 items-center">
          <form onSubmit={handleSendComment} className="flex-1 relative">
             <input 
               type="text"
               value={commentText}
               onChange={(e) => setCommentText(e.target.value)}
               placeholder="Chat with the host..."
               className="w-full h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-12 text-sm text-white outline-none focus:border-white/30 transition-all font-medium placeholder:text-white/30 shadow-xl"
             />
             <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/40 hover:text-brand-primary transition-colors">
                <Send size={16} />
             </button>
          </form>

          <div className="relative">
            <button 
              onClick={() => handleReaction('heart')}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 hover:bg-white/20 transition-colors shadow-xl shrink-0 group active:scale-90"
            >
              <Heart size={20} className="fill-transparent group-active:fill-red-500 group-active:scale-125 transition-all" />
            </button>
            
            {/* Floating Hearts Wrapper */}
            <div className="absolute bottom-16 right-0 w-12 h-40 pointer-events-none flex flex-col-reverse items-center overflow-visible">
               <AnimatePresence>
                 {hearts.map(heart => (
                   <motion.div
                     key={heart.id}
                     initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
                     animate={{ opacity: [0, 1, 0.8, 0], scale: [0.8, 1.2, 1], y: -200, x: heart.x }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 2, ease: "easeOut" }}
                     className="absolute"
                   >
                     <Heart size={24} className="text-red-500 fill-red-500 drop-shadow-xl" />
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          </div>

          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors shadow-xl shrink-0">
             <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Pinned Items Drawer */}
      <AnimatePresence>
        {showPinned && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowPinned(false)}
               className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed bottom-0 left-0 right-0 h-2/3 bg-[#0a0a0a] z-40 rounded-t-[2.5rem] flex flex-col border-t border-white/10 pointer-events-auto"
            >
               <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Live Commerce</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Support the creator • Secure Escrow</p>
                  </div>
                  <button onClick={() => setShowPinned(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <X size={18} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 no-scrollbar flex flex-col gap-4">
                  {pinnedItems.map((item) => (
                    <div key={item.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex gap-4 group hover:border-brand-primary/30 transition-all">
                       <div className="w-20 h-20 rounded-2xl bg-zinc-800 overflow-hidden shrink-0 border border-white/5">
                          {item.details?.media_urls?.[0] ? (
                            <img src={item.details.media_urls[0]} alt="product" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                               <Briefcase size={24} className="text-white/20" />
                            </div>
                          )}
                       </div>
                       <div className="flex flex-col justify-between flex-1">
                          <div>
                             <h4 className="text-sm font-black text-white line-clamp-1">{item.details?.title || item.listing_type.toUpperCase()}</h4>
                             <div className="flex items-center gap-2 mt-1">
                               <Star size={10} className="text-yellow-500 fill-yellow-500" />
                               <span className="text-[10px] font-bold text-white/50 italic tracking-widest uppercase">{item.listing_type}</span>
                             </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                             <div className="font-black text-brand-primary text-lg">₦{item.details?.price || '---'}</div>
                             <button className="px-5 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                                View Item
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                  {pinnedItems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 py-20 opacity-20">
                       <ShoppingBag size={48} />
                       <p className="text-xs font-black uppercase tracking-widest">No Featured Items</p>
                    </div>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
