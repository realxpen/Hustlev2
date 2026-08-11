import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, StopCircle, ShoppingBag, Settings, 
  Users, Flame, Send, MessageSquare, Heart, 
  Plus, CheckCircle2, X
} from 'lucide-react';
import { useLiveStore } from '../../stores/useLiveStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

interface LiveStudioProps {
  onClose: () => void;
}

export default function LiveStudio({ onClose }: LiveStudioProps) {
  const { 
    createSession, 
    startSession, 
    endSession, 
    currentSession,
    messages,
    reactions,
    pinnedItems,
    pinItem,
    unpinItem,
    myListings,
    fetchMyListings
  } = useLiveStore();
  const { profile } = useAuthStore();
  
  const [step, setStep] = useState<'setup' | 'streaming'>('setup');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [showListingSelector, setShowListingSelector] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'streaming') {
      fetchMyListings();
    }
  }, [step]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup stream
  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsStarting(true);
    const session = await createSession({ title, description });
    if (session) {
      const started = await startSession(session.id);
      if (started) {
        setStep('streaming');
        // Host also joins their own session to receive real-time updates
        useLiveStore.getState().joinSession(session.id);
      }
    }
    setIsStarting(false);
  };

  const handleEnd = async () => {
    if (currentSession) {
      const sid = currentSession.id;
      await endSession(sid);
      useLiveStore.getState().leaveSession(sid);
      onClose();
    }
  };

  if (step === 'setup') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md flex flex-col gap-8"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-brand-primary flex items-center justify-center shadow-[0_0_40px_rgba(var(--brand-primary-rgb),0.3)]">
               <Video size={40} className="text-black" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Live Studio</h2>
               <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Ready to showcase your craft?</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
             <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Stream Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's this stream about?"
                  className="h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm text-white outline-none focus:border-brand-primary/50 transition-all font-medium"
                />
             </div>
             <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Give viewers more context..."
                  className="h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-brand-primary/50 transition-all font-medium resize-none"
                />
             </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
             <button
               onClick={handleCreate}
               disabled={!title.trim() || isStarting}
               className="h-16 bg-brand-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center justify-center gap-2 shadow-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
             >
                {isStarting ? 'Initializing...' : 'Go Live Now'}
             </button>
             <button onClick={onClose} className="h-12 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:text-white transition-all">
                Cancel
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Mock Camera View */}
      <div className="absolute inset-0 bg-zinc-900 overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale-[0.5]" />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>

      {/* Top HUD */}
      <div className="relative z-10 p-4 flex justify-between items-start">
         <div className="flex items-center gap-3">
            <div className="flex bg-red-500/10 backdrop-blur-md rounded-xl p-1 items-center gap-2 border border-red-500/20 shadow-xl px-3 h-10">
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live</span>
               <div className="w-px h-3 bg-white/20" />
               <span className="text-[10px] font-black text-white/60">00:42:15</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md px-3 h-10 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-xl">
               <Users size={12} className="text-white/60" />
               <span className="text-[10px] font-black text-white tracking-widest">
                 {currentSession?.current_viewers || 0}
               </span>
            </div>
         </div>

         <div className="flex gap-2">
            <button 
              onClick={handleEnd}
              className="h-10 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-xl flex items-center gap-2 shadow-2xl active:scale-95 transition-all"
            >
               <StopCircle size={14} /> End Session
            </button>
         </div>
      </div>

      <div className="flex-1" />

      {/* Host Controls Panel */}
      <div className="relative z-10 p-4 pb-8 flex flex-col gap-6">
         
          {/* Insights Ticker */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
             <div className="flex shrink-0 items-center gap-2 bg-black/40 backdrop-blur-lg px-4 py-2.5 rounded-2xl border border-white/5 shadow-xl">
                <Heart size={14} className="text-red-500 fill-red-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {currentSession?.total_reactions ? (currentSession.total_reactions > 1000 ? `${(currentSession.total_reactions / 1000).toFixed(1)}K` : currentSession.total_reactions) : 0} Reactions
                </span>
             </div>
          </div>

         <div className="grid grid-cols-2 gap-4">
            
            {/* Live Chat Monitor */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2 px-1">
                  <MessageSquare size={12} className="text-white/30" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Live Chat</span>
               </div>
               <div className="h-48 bg-black/30 backdrop-blur-md rounded-3xl border border-white/5 p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar masked-fade-top">
                  {messages.map((m, i) => (
                    <div key={i} className="flex flex-col">
                       <span className="text-[9px] font-black text-white/30 uppercase tracking-tight">{m.user_profiles?.hustle_name || 'Fan'}</span>
                       <span className="text-[11px] font-medium text-white/80">{m.message}</span>
                    </div>
                  ))}
                  <div className="mt-auto flex flex-col items-center gap-2 py-4 opacity-10">
                     <div className="w-1 h-1 bg-white rounded-full" />
                     <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                  <div ref={chatEndRef} />
               </div>
            </div>

            {/* Shoppable Items (pinnedItems) */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={12} className="text-white/30" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Store items</span>
                  </div>
                  <button className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Manage</button>
               </div>
               <div className="h-48 flex flex-col gap-2">
                   {pinnedItems.map((item) => (
                    <div key={item.id} className="bg-brand-primary p-3 rounded-2xl flex items-center justify-between group shadow-lg">
                       <div className="min-w-0 pr-2">
                          <p className="text-[8px] font-black uppercase tracking-widest text-black/40">Active Pin</p>
                          <p className="text-[10px] font-black text-black truncate">{item.details?.title || item.listing_type.toUpperCase()}</p>
                       </div>
                       <button onClick={() => unpinItem(item.id)} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black hover:bg-black/20">
                          <X size={14} />
                       </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowListingSelector(true)}
                    className="flex-1 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 active:scale-95 transition-all group"
                  >
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-all">
                        <Plus size={16} />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-white">Pin Product</span>
                  </button>
               </div>
            </div>
         </div>

         {/* Share & Invite Control */}
         <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 h-14 rounded-2xl flex items-center px-4 gap-3">
               <Send size={16} className="text-white/40" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Acknowledge fans with a shoutout</span>
               <button className="ml-auto bg-white/10 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/20">Action</button>
            </div>
         </div>
      </div>

      {/* Listing Selector Modal */}
      <AnimatePresence>
        {showListingSelector && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowListingSelector(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className="relative w-full max-w-md bg-[#0f0f0f] rounded-t-[2.5rem] border-t border-white/10 p-6 flex flex-col gap-6"
            >
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Your Catalog</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Select an item to feature live</p>
                  </div>
                  <button onClick={() => setShowListingSelector(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                    <X size={20} />
                  </button>
               </div>

               <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto no-scrollbar">
                  {myListings.map(listing => (
                    <button 
                       key={listing.id}
                       onClick={() => {
                          if (currentSession) {
                            pinItem(currentSession.id, listing.id, listing.listing_type);
                            setShowListingSelector(false);
                          }
                       }}
                       className="p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-brand-primary/50 transition-all text-left"
                    >
                       <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0">
                          <ShoppingBag size={20} className="text-white/40" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-white truncate">{listing.title}</h4>
                          <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">₦{listing.price}</p>
                       </div>
                       <Plus size={18} className="text-white/20" />
                    </button>
                  ))}
                  {myListings.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
                       <ShoppingBag size={48} />
                       <p className="text-[10px] font-black uppercase tracking-widest text-center">No active listings found in your catalog</p>
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
