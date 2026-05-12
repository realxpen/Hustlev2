import React from 'react';
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, 
  ShoppingBag, Calendar, CheckCircle2, Navigation, Send,
  Zap, Star, ShieldCheck, ChevronUp, X
} from "lucide-react";

interface LiveStreamCardProps {
  hustler: any;
  onProfileClick: () => void;
  isActive: boolean;
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

export default function LiveStreamCard({ 
  hustler, 
  onProfileClick, 
  isActive, 
  isExpanded = true,
  onExpand,
  onCollapse 
}: LiveStreamCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [hearts, setHearts] = useState<{ id: number, x: number }[]>([]);
  const [comments, setComments] = useState<{id: number, user: string, text: string}[]>([
    { id: 1, user: 'dev_guy', text: 'This looks amazing!' },
    { id: 2, user: 'sarah_styles', text: 'How do I book?' },
    { id: 3, user: 'alex_maker', text: 'Where is this located?' }
  ]);
  const [commentText, setCommentText] = useState('');
  
  const videoRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (isActive) {
      // Simulate live comments
      const interval = setInterval(() => {
        const fakeComments = [
          "Bro this is fire 🔥",
          "Can you explain that again?",
          "Just bought the course!",
          "Wow really nice results.",
          "Greetings from TX 🤠",
          "Tap the screen guys!"
        ];
        setComments(prev => [
            ...prev, 
            { id: Date.now(), user: `user_${Math.floor(Math.random() * 9999)}`, text: fakeComments[Math.floor(Math.random() * fakeComments.length)] }
        ].slice(-10)); // Keep last 10
      }, 3500);
      
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const handleHeartClick = () => {
    setHearts(prev => [...prev, { id: Date.now(), x: Math.random() * 40 - 20 }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== Date.now()));
    }, 2000);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    setComments(prev => [...prev, { id: Date.now(), user: 'you', text: commentText }].slice(-10));
    setCommentText('');
  };

  // The commerce CTA attached to this stream
  const isCommerce = true; // simulate attached offering
  const commerceType = hustler.category === 'Instructor' || hustler.category === 'Digital Shop' ? 'product' : 'service';
  
  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-end">
      {/* Fallback to image if no video, assuming we use gif/image for mock live streams */}
      <img 
        ref={videoRef}
        src={hustler.detailData?.heroMedia?.[0] || hustler.creator.avatar || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80"}
        className="absolute inset-0 w-full h-full object-cover"
        alt="stream"
      />
      
      {/* Live Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {!isExpanded && (
        <div 
          className="absolute inset-0 z-30 cursor-pointer flex flex-col justify-end p-4"
          onClick={() => onExpand?.()}
        >
          {/* Minimal info for non-expanded state */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
            </div>
            <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded">
               12.4K
            </div>
          </div>
          
          <div className="mb-4">
             <div className="flex items-center gap-2 mb-2">
                <img src={`https://i.pravatar.cc/150?u=${hustler.creator.name}`} className="w-8 h-8 rounded-full border border-white/20" />
                <span className="text-white font-bold">{hustler.creator.name}</span>
             </div>
             <h3 className="text-sm font-medium text-white/90 line-clamp-2">
               Mastering {hustler.category} Live Q&A - Ask me anything! 🚀
             </h3>
             <p className="text-white/50 text-xs mt-2 flex items-center gap-1 animate-pulse">
               Tap to enter live stream <ChevronUp size={12} className="rotate-90" />
             </p>
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Close expanded view button */}
          <button 
             onClick={() => onCollapse?.()}
             className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
          >
             <X size={20} />
          </button>

          {/* Top HUD */}
          <div className="absolute top-[80px] left-4 right-16 flex justify-between items-start z-10 pointer-events-none">
             <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 items-center gap-2 pointer-events-auto border border-white/10 shadow-xl">
                <button onClick={onProfileClick} className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                   <img src={`https://i.pravatar.cc/150?u=${hustler.creator.name}`} alt="creator" className="w-full h-full object-cover" />
                </button>
                <div className="flex flex-col min-w-0 pr-2">
                   <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white truncate">{hustler.creator.name}</span>
                      {hustler.creator.verified && <CheckCircle2 size={10} className="text-blue-400 shrink-0" />}
                   </div>
                   <span className="text-[8px] font-bold text-white/60 tracking-widest uppercase truncate">{hustler.category}</span>
                </div>
                {!isFollowing && (
                   <button onClick={() => setIsFollowing(true)} className="ml-1 shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <UserPlus size={12} className="text-white" />
                   </button>
                )}
             </div>

             <div className="flex flex-col items-end gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-xl">
                   <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-white tracking-widest">12.4K</span>
                </div>
             </div>
          </div>

          {/* Right Interaction Bar */}
          <div className="absolute bottom-[140px] right-4 flex flex-col items-center gap-6 z-20">
            <button onClick={onProfileClick} className="relative w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-2xl bg-zinc-800">
               <img src={`https://i.pravatar.cc/150?u=${hustler.creator.name}`} alt="creator" className="w-full h-full object-cover" />
               {!isFollowing && (
                 <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black pointer-events-none">
                   +
                 </div>
               )}
            </button>

            <button onClick={handleHeartClick} className="flex flex-col items-center gap-1 group">
               <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:bg-black/60 transition-colors">
                  <Heart size={24} className="text-white fill-transparent group-active:scale-95 group-active:fill-red-500 group-active:text-red-500 transition-all" />
               </div>
               <span className="text-[10px] font-bold text-white drop-shadow-md">45.2K</span>
               
               {/* Floating Hearts */}
               <AnimatePresence>
                 {hearts.map(heart => (
                   <motion.div
                     key={heart.id}
                     initial={{ opacity: 0, y: 0, scale: 0.5, x: 0 }}
                     animate={{ opacity: [0, 1, 0], y: -150, scale: 1, x: heart.x }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="absolute bottom-16 pointer-events-none"
                   >
                     <Heart size={28} className="text-red-500 fill-red-500" />
                   </motion.div>
                 ))}
               </AnimatePresence>
            </button>

            <button className="flex flex-col items-center gap-1 group">
               <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:bg-black/60 transition-colors">
                  <MessageCircle size={24} className="text-white fill-white/20 group-active:scale-95 transition-all" />
               </div>
               <span className="text-[10px] font-bold text-white drop-shadow-md">342</span>
            </button>

            <button className="flex flex-col items-center gap-1 group">
               <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:bg-black/60 transition-colors">
                  <Share2 size={24} className="text-white fill-white/20 group-active:scale-95 transition-all" />
               </div>
               <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
            </button>
          </div>

          {/* Info & Commerce Layer (Bottom Left) */}
          <div className="absolute bottom-[90px] left-4 right-[80px] flex flex-col gap-3 z-20 pointer-events-none">
             <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-lg leading-tight">
               Mastering {hustler.category} Live Q&A - Ask me anything! 🚀
             </h3>
             
             {/* Live Commerce CTA */}
             {isCommerce && (
               <div 
                 className="pointer-events-auto flex items-center gap-3 p-2 pr-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-fit active:scale-95 transition-all cursor-pointer shadow-xl"
                 onClick={() => setShowDrawer(true)}
               >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                     {commerceType === 'product' ? <ShoppingBag size={18} className="text-white" /> : <Calendar size={18} className="text-white" />}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
                       {commerceType === 'product' ? 'Featured Product' : 'Book Session'}
                     </span>
                     <span className="text-xs font-black text-white">
                       {commerceType === 'product' ? 'Exclusive Kit Vol 1' : '1:1 Consultation'}
                     </span>
                  </div>
               </div>
             )}
          </div>

          {/* Live Comments Stream */}
          <div className="absolute bottom-[160px] left-4 right-[80px] h-[120px] overflow-hidden z-10 pointer-events-none flex flex-col justify-end gap-2 masked-fade-top">
             <AnimatePresence>
                {comments.map((comment) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 max-w-full drop-shadow-md bg-black/20 backdrop-blur-md rounded-lg px-2 py-1 w-fit border border-white/5"
                  >
                     <span className="text-[11px] font-bold text-white/60 whitespace-nowrap">{comment.user}</span>
                     <span className="text-[11px] font-medium text-white break-words">{comment.text}</span>
                  </motion.div>
                ))}
             </AnimatePresence>
          </div>

          {/* Comment Input Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-2">
             <form onSubmit={handleSendComment} className="flex-1 relative">
                <input 
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-12 text-sm text-white outline-none focus:border-white/30 transition-all font-medium placeholder:text-white/40 shadow-xl"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/50 hover:text-blue-400 transition-colors">
                   <Send size={16} />
                </button>
             </form>
             <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors shadow-xl shrink-0">
                <MoreHorizontal size={20} />
             </button>
          </div>

          {/* Product/Service Drawer */}
          <AnimatePresence>
            {showDrawer && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDrawer(false)}
                  className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-2/3 bg-[#0a0a0a] z-40 rounded-t-[2.5rem] flex flex-col border-t border-white/10"
            >
               <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Featured in Stream</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Secure Escrow Protection</p>
                  </div>
                  <button onClick={() => setShowDrawer(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <X size={16} className="text-white" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 no-scrollbar flex flex-col gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex gap-4">
                       <div className="w-20 h-20 rounded-2xl bg-zinc-800 overflow-hidden shrink-0">
                          <img src={`https://images.unsplash.com/photo-${i === 1 ? '1611162617474-5b21e879e113' : '1552664730-d307ca884978'}?w=200&q=80`} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col justify-between flex-1">
                          <div>
                             <h4 className="text-sm font-black text-white line-clamp-1">{i === 1 ? 'Premium Consultation' : 'Digital Starter Kit'}</h4>
                             <div className="flex items-center gap-2 mt-1">
                               <Star size={10} className="text-yellow-500 fill-yellow-500" />
                               <span className="text-[10px] font-bold text-white/60">4.9 (124 reviews)</span>
                             </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                             <div className="font-black text-white text-lg">${i === 1 ? '150' : '45'}</div>
                             <button className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors">
                                {i === 1 ? 'Book' : 'Buy'}
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </>
        )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
