import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Video, Settings, Tag, Briefcase, Play, Users, MessageCircle, 
  TrendingUp, Star, DollarSign, Pin, Share2, MoreHorizontal, 
  CheckCircle2, BarChart3, Clock, ShoppingBag, Calendar, Radio,
  Lock, Globe, MapPin, ChevronRight, Layout, Mic, Grid, Layers, Camera
} from 'lucide-react';

interface LiveCreatorStudioProps {
  onClose: () => void;
}

type StudioPhase = 'ENTRY' | 'SETUP' | 'PREPARING' | 'LIVE' | 'SUMMARY';

const CATEGORIES = ["Skill Demo", "Product Launch", "Work Session", "Live Training", "Q&A", "Promo"];

const MOCK_ATTACHMENTS = [
  { id: 's1', type: 'service', name: 'UI/UX Consultation', price: '$120', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&q=80' },
  { id: 'p1', type: 'product', name: 'Design Assets Pack', price: '$45', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&q=80' },
  { id: 't1', type: 'training', name: 'Mastering Figma Course', price: '$199', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&q=80' },
];

export default function LiveCreatorStudio({ onClose }: LiveCreatorStudioProps) {
  const [phase, setPhase] = useState<StudioPhase>('ENTRY');
  const [streamTitle, setStreamTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedAudience, setSelectedAudience] = useState('Everyone');
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [isAddonsOpen, setIsAddonsOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [activeTab, setActiveTab] = useState<'chat' | 'monetize' | 'guests'>('chat');
  const [isMuted, setIsMuted] = useState(false);
  const [pinnedItemId, setPinnedItemId] = useState<string | null>(null);
  const [streamGoal, setStreamGoal] = useState({ current: 42, target: 100, label: 'Viewers' });
  const [showGoalNotification, setShowGoalNotification] = useState(false);
  
  // Preparing phase countdown
  useEffect(() => {
    if (phase === 'PREPARING') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('LIVE');
      }
    }
  }, [phase, countdown]);

  const toggleAttachment = (id: string) => {
    setSelectedAttachments(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const renderEntry = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white relative overflow-hidden">
       <div className="absolute inset-0 bg-red-600/10 blur-[120px] rounded-full top-[-50%] pointer-events-none" />
       
       <div className="relative z-10 p-6 flex justify-between">
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <X size={20} />
           </button>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center px-8 text-center z-10 space-y-6">
           <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4">
               <Video size={40} className="text-red-500" />
           </div>
           
           <div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Ready To<br /> <span className="text-red-500">Earn.</span></h1>
           </div>
       </div>

       <div className="p-8 pb-12 z-10 w-full mb-4 space-y-4">
            <button 
              onClick={() => setPhase('SETUP')}
              className="w-full h-16 rounded-[2rem] bg-red-500 text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:bg-red-400 active:scale-95 transition-all"
            >
              GO LIVE
            </button>
            <p className="text-center text-[10px] uppercase font-black tracking-widest text-white/30">Start earning from your skills</p>
       </div>
    </div>
  );

  const renderSetup = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('ENTRY')} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
          <span className="text-sm font-black tracking-tighter uppercase">Setup Stream</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="space-y-8 pb-24">
          
          {/* Title Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">What's this about?</label>
            <input 
              type="text" 
              placeholder="Enter Live Title..."
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              className="w-full bg-transparent border-b-2 border-white/10 p-2 text-2xl font-black italic placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">Category</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['Service', 'Product', 'Training', 'Casual'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                    selectedCategory === cat 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 border-white/10 text-white/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">Audience</label>
            <div className="flex gap-2">
              {['Everyone', 'Followers', 'Nearby'].map(aud => (
                <button 
                  key={aud}
                  onClick={() => setSelectedAudience(aud)}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedAudience === aud 
                    ? 'bg-white/10 border-white text-white' 
                    : 'bg-transparent border-white/10 text-white/40'
                  }`}
                >
                  {aud}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Add-ons */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <button 
               onClick={() => setIsAddonsOpen(!isAddonsOpen)}
               className="flex items-center justify-between w-full p-1"
            >
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Optional Add-ons</span>
               <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {isAddonsOpen ? 'Hide' : 'Show'} 
                  {selectedAttachments.length > 0 && ` (${selectedAttachments.length} Selected)`}
               </span>
            </button>
            
            {isAddonsOpen && (
              <div className="grid grid-cols-1 gap-2 pt-2">
                {MOCK_ATTACHMENTS.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => toggleAttachment(item.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center gap-4 text-left ${
                      selectedAttachments.includes(item.id) 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mt-1">{item.type} • {item.price}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      selectedAttachments.includes(item.id) 
                      ? 'bg-red-500 border-red-500 text-white' 
                      : 'border-white/10 text-transparent'
                    }`}>
                      <CheckCircle2 size={12} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Button Container */}
      <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 left-0 right-0">
        <button 
          disabled={!streamTitle}
          onClick={() => setPhase('PREPARING')}
          className="w-full h-16 rounded-2xl bg-red-500 text-white font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-2xl shadow-red-500/40 hover:bg-red-400 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all"
        >
           Start Live
        </button>
      </div>
    </div>
  );

  const renderPreparing = () => (
    <div className="flex flex-col items-center justify-center h-full bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-red-600/5 blur-[120px] rounded-full animate-pulse" />
      <motion.div 
        key={countdown}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 2, opacity: 0 }}
        className="text-[12rem] font-black italic tracking-tighter z-10"
      >
        {countdown === 0 ? "LIVE" : countdown}
      </motion.div>
      <div className="mt-8 text-[12px] font-black uppercase tracking-[0.4em] text-white/30 animate-pulse">Initializing Stream...</div>
    </div>
  );

  const renderLive = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white relative overflow-hidden">
      {/* Background Live Feed Placeholder */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80" className="w-full h-full object-cover scale-[1.02] blur-sm opacity-60" alt="Live Feed" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/60" />
      </div>

      {/* Top Overlay UI */}
      <div className="relative z-10 p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </div>
              <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Users size={12} className="text-white/60" /> 1.2K
              </div>
              <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-green-400">
                <DollarSign size={12} /> $432
              </div>
            </div>
            {/* Live Goal Tracker */}
            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-full px-3 py-1.5 w-fit flex items-center gap-3">
              <div className="text-[8px] font-black uppercase tracking-widest text-white/30">{streamGoal.label} Goal</div>
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(streamGoal.current / streamGoal.target) * 100}%` }}
                  className="h-full bg-blue-500"
                />
              </div>
              <div className="text-[8px] font-bold text-white/60">{streamGoal.current}/{streamGoal.target}</div>
            </div>
          </div>
          
          <button onClick={() => setPhase('SUMMARY')} className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors">
            End Stream
          </button>
        </div>
      </div>

      {/* Main Center UI - Interaction & Overlays */}
      <div className="flex-1 relative z-10 p-6 flex flex-col justify-end">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-end">
          
          {/* Chat & Activity Area */}
          <div className="flex flex-col gap-4 max-h-[40vh] mb-24 md:mb-0">
             {selectedCategory === "Live Training" && (
                <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 p-4 rounded-3xl mb-4 max-w-sm">
                   <h5 className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">Lesson Outline</h5>
                   <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-[10px] font-bold text-white/80">
                         <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">1</div>
                         Intro to Spatial Layouts
                      </li>
                      <li className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                         <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/20">2</div>
                         The 3-Click Rule
                      </li>
                   </ul>
                </div>
             )}
             <div className="space-y-3 overflow-y-auto no-scrollbar mask-fade-top pr-10">
                {[
                  { user: 'Sasha_K', text: 'Love the creative process! 🎨', color: 'text-blue-400' },
                  { user: 'HustleLord', text: 'Just booked the consultation! Can\'t wait.', color: 'text-purple-400' },
                  { user: 'TechWiz', text: 'What tools are you using for this?', color: 'text-emerald-400' },
                  { user: 'StudioLife', text: 'The lighting is perfect today.', color: 'text-orange-400' },
                ].map((msg, i) => (
                  <div key={i} className="flex flex-col gap-1 items-start">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${msg.color}`}>{msg.user}</span>
                    <p className="bg-black/40 backdrop-blur-md border border-white/5 px-4 py-2.5 rounded-2xl text-xs max-w-[80%] leading-relaxed">{msg.text}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Right Sidebar - Creator Tools */}
          <div className="flex flex-col gap-3">
             {/* Pinned Item UI (If exists) */}
             <AnimatePresence>
               {pinnedItemId && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="bg-white text-black p-4 rounded-3xl shadow-2xl relative group"
                >
                  <button onClick={() => setPinnedItemId(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white border-2 border-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <X size={12} />
                  </button>
                  <div className="flex items-center gap-3">
                    <img src={MOCK_ATTACHMENTS.find(a => a.id === pinnedItemId)?.image} className="w-12 h-12 rounded-xl object-cover" alt="Pinned" />
                    <div className="flex-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-0.5 flex items-center gap-1">
                        <Pin size={10} className="fill-black/40 translate-y-[-1px]" /> Featured Offer
                      </div>
                      <h4 className="font-black text-sm leading-tight line-clamp-1">{MOCK_ATTACHMENTS.find(a => a.id === pinnedItemId)?.name}</h4>
                      <p className="text-xs font-bold text-red-600">Buy now: {MOCK_ATTACHMENTS.find(a => a.id === pinnedItemId)?.price}</p>
                    </div>
                  </div>
                </motion.div>
               )}
             </AnimatePresence>

             {/* Live Actions Hub */}
             <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Studio Tools</h3>
                   <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"><Settings size={14} /></button>
                   </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                   <button 
                     onClick={() => setActiveTab('chat')}
                     className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'chat' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                   >
                     <MessageCircle size={18} />
                     <span className="text-[8px] font-black uppercase">Chat</span>
                   </button>
                   <button 
                     onClick={() => setActiveTab('monetize')}
                     className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'monetize' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                   >
                     <ShoppingBag size={18} />
                     <span className="text-[8px] font-black uppercase">Store</span>
                   </button>
                   <button 
                     onClick={() => setActiveTab('guests')}
                     className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'guests' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                   >
                     <Users size={18} />
                     <span className="text-[8px] font-black uppercase">Guests</span>
                   </button>
                   <button 
                     onClick={() => setIsMuted(!isMuted)}
                     className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all ${isMuted ? 'bg-zinc-700 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                   >
                     <Mic size={18} className={isMuted ? 'opacity-50' : ''} />
                     <span className="text-[8px] font-black uppercase">{isMuted ? 'Muted' : 'Mic On'}</span>
                   </button>
                </div>

                {/* Dynamic Panel based on selection */}
                <div className="min-h-[140px] pt-4 border-t border-white/5">
                   <AnimatePresence mode="wait">
                      {activeTab === 'monetize' && (
                        <motion.div 
                          key="store"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-3"
                        >
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Pin to highlight</p>
                           <div className="flex flex-col gap-2">
                              {MOCK_ATTACHMENTS.filter(a => selectedAttachments.includes(a.id)).map(item => (
                                <button 
                                  key={item.id}
                                  onClick={() => setPinnedItemId(item.id)}
                                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${pinnedItemId === item.id ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                >
                                   <div className="flex items-center gap-3">
                                      <img src={item.image} className="w-8 h-8 rounded-lg object-cover" alt="Item" />
                                      <span className="text-[10px] font-bold">{item.name}</span>
                                   </div>
                                   <Pin size={12} className={`transition-transform group-hover:scale-110 ${pinnedItemId === item.id ? 'text-red-500 fill-red-500 rotate-45' : 'text-white/20 group-hover:text-white/40'}`} />
                                </button>
                              ))}
                              {selectedAttachments.length === 0 && (
                                <div className="text-center py-6 text-white/10">
                                   <Layers size={24} className="mx-auto mb-2 opacity-10" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">No offers linked</p>
                                </div>
                              )}
                           </div>
                        </motion.div>
                      )}
                      
                      {activeTab === 'chat' && (
                        <motion.div 
                          key="chat-tools"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-4"
                        >
                           <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                              <span className="text-[10px] font-bold text-white/60">Auto-Moderation</span>
                              <div className="w-8 h-4 rounded-full bg-red-500/20 relative">
                                 <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-red-500 shadow-lg" />
                              </div>
                           </div>
                           <button className="w-full py-3 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all">Clear Chat</button>
                        </motion.div>
                      )}

                      {activeTab === 'guests' && (
                        <motion.div 
                          key="guests"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex flex-col items-center justify-center py-6 gap-3"
                        >
                           <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                              <Users size={18} className="text-white/10" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No active guests</p>
                           <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest">Invite Co-host</button>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Floating Alerts (Mock Sales) */}
      <div className="absolute top-24 left-6 z-20 pointer-events-none">
         <AnimatePresence>
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 5 }}
              className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl"
            >
               <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ShoppingBag size={14} />
               </div>
               <div>
                  <p className="text-[9px] font-black uppercase text-emerald-400">Order Received</p>
                  <p className="text-[11px] font-bold">New Booking from @Leo</p>
               </div>
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Bottom Nav / Quick Actions (Mobile optimized) */}
      <div className="relative z-10 px-6 pb-8 flex items-center justify-between md:hidden">
         <button className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center"><Grid size={20} /></button>
         <button className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-110 active:scale-95 transition-transform"><Camera size={28} /></button>
         <button className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center"><Layout size={20} /></button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="flex flex-col h-full bg-[#050505] text-white p-6 justify-center items-center">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="w-full max-w-md space-y-10"
       >
          <div className="text-center space-y-4">
             <div className="w-20 h-20 rounded-[2rem] bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <Radio size={32} className="text-red-500" />
             </div>
             <h2 className="text-4xl font-black italic tracking-tighter">STREAM ENDED</h2>
             <p className="text-white/40 text-sm font-medium">Great work today! Here are your live session results.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {[
               { icon: <Users size={16} />, label: 'Viewers', val: '4.8K', sub: '+12% vs last' },
               { icon: <ShoppingBag size={16} />, label: 'Orders', val: '24', sub: '$940 Revenue' },
               { icon: <MessageCircle size={16} />, label: 'Comments', val: '1.2K', sub: 'Very high' },
               { icon: <Clock size={16} />, label: 'Duration', val: '1h 12m', sub: 'Optimal' },
             ].map((stat, i) => (
               <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40">{stat.icon}</div>
                  <div>
                    <div className="text-2xl font-black tracking-tight">{stat.val}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/30">{stat.label}</div>
                  </div>
                  <p className="text-[10px] font-bold text-emerald-400">{stat.sub}</p>
               </div>
             ))}
          </div>

          <div className="space-y-3">
             <button 
               onClick={onClose}
               className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm shadow-xl hover:bg-zinc-200 transition-all active:scale-95"
             >
               Go to Dashboard
             </button>
             <button className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-sm text-white/60 hover:text-white transition-all">
               Save Replay to Profile
             </button>
          </div>
       </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'ENTRY' && (
          <motion.div 
            key="entry"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="w-full h-full"
          >
            {renderEntry()}
          </motion.div>
        )}

        {phase === 'SETUP' && (
          <motion.div 
            key="setup"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="w-full h-full"
          >
            {renderSetup()}
          </motion.div>
        )}
        
        {phase === 'PREPARING' && (
          <motion.div 
            key="preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="w-full h-full"
          >
            {renderPreparing()}
          </motion.div>
        )}

        {phase === 'LIVE' && (
          <motion.div 
            key="live"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
          >
            {renderLive()}
          </motion.div>
        )}

        {phase === 'SUMMARY' && (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full"
          >
            {renderSummary()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
