import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageSquare, Share2, Bookmark, Star, MapPin, CheckCircle, Repeat2, Music, ShoppingBag, ArrowRight } from "lucide-react";
import { useState } from "react";

export interface EmbedCTA {
  type: "book" | "buy" | "apply";
  label: string;
  price?: number;
}

export interface FeedContent {
  type: "video" | "image" | "carousel" | "text" | "audio";
  mediaUrls?: string[];
  thumbnail?: string;
  caption: string;
  hasMusic?: boolean;
  musicTrack?: string;
}

export interface FeedCardProps {
  id: number;
  onProfileClick?: () => void;
  creator: {
    id: number;
    name: string;
    avatar: string;
    category: string;
    location: string;
    rating: number;
    jobs: number;
    verified: boolean;
    active: boolean;
  };
  content: FeedContent;
  repost?: {
    by: string;
    thought?: string;
  };
  embedCTA?: EmbedCTA;
  recommendationReason?: string;
  isAd?: boolean;
}

export default function FeedCard({ 
  creator, 
  content, 
  repost,
  embedCTA,
  isAd,
  onProfileClick, 
  recommendationReason 
}: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Fallback for embed if not provided, just defaults to Book (for existing mock data)
  const cta = embedCTA || { type: "book", label: "Book Service" };

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden text-white">
      {/* Repost Header Layer */}
      {repost && (
        <div className="absolute top-20 left-4 right-4 z-40 bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Repeat2 size={12} className="text-white/60" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              Reposted by {repost.by}
            </span>
          </div>
          {repost.thought && (
            <p className="text-xs font-medium">"{repost.thought}"</p>
          )}
        </div>
      )}

      {/* Content Layer (Mixed Media Placeholder) */}
      <div className="absolute inset-0 z-0 bg-black" onDoubleClick={() => setLiked(true)}>
        {content.type === "text" ? (
          <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-b from-zinc-900 to-black">
            <p className="text-2xl font-display font-medium text-center leading-snug">{content.caption}</p>
          </div>
        ) : (
          <div className={`w-full h-full flex flex-col bg-gradient-to-br ${creator.id % 2 === 0 ? 'from-slate-900 to-black' : 'from-zinc-950 to-black'} items-center justify-center relative`}>
            {/* Carousel indicators logic would go here if multiple mediaUrls */}
            <div className="w-1/2 h-1/2 bg-white/5 blur-3xl rounded-full animate-pulse absolute" />
            {content.type === "audio" && (
              <div className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                 <Music size={40} className="text-white/40" />
              </div>
            )}
          </div>
        )}
        <div className="grain-overlay opacity-[0.03]" />
      </div>

      {/* Overlay: Bottom Information */}
      <div className="absolute bottom-0 left-0 right-0 pt-32 pb-24 px-4 z-20 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto max-w-[80%]">
          
          {/* Context Badges (Ad or Intelligence) */}
          <div className="flex items-center gap-2">
            {isAd && (
              <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-white/20">
                Sponsored
              </div>
            )}
            {recommendationReason && !isAd && (
              <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center gap-1.5"
              >
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">{recommendationReason}</span>
              </motion.div>
            )}
          </div>

          {/* Identity & Trust Block */}
          <div className="flex items-center gap-3">
             <div 
               onClick={onProfileClick}
               className="w-11 h-11 rounded-full border border-white/20 overflow-hidden bg-white/10 cursor-pointer shrink-0"
             >
               <div className="w-full h-full flex items-center justify-center text-sm font-black text-white/40">
                 {creator.name.charAt(0)}
               </div>
             </div>
             
             <div className="flex flex-col cursor-pointer" onClick={onProfileClick}>
               <h3 className="text-base font-display font-bold tracking-tight flex items-center gap-1.5">
                 {creator.name}
                 {creator.verified && <CheckCircle size={12} className="text-blue-400 fill-blue-500/20" />}
               </h3>
               <div className="flex items-center gap-2 text-[10px] text-white/60 font-medium tracking-wide">
                 <span>{creator.category}</span>
                 <span>•</span>
                 <span className="flex items-center gap-0.5"><MapPin size={10} /> {creator.location}</span>
                 {creator.rating > 0 && (
                   <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-yellow-500"><Star size={10} className="fill-yellow-500" /> {creator.rating}</span>
                   </>
                 )}
               </div>
             </div>
          </div>

          {/* Caption */}
          {content.type !== "text" && (
            <p className="text-sm font-light leading-snug line-clamp-2">
              {content.caption}
            </p>
          )}

          {/* Music Integration */}
          {content.hasMusic && (
            <div className="flex items-center gap-2 mt-1">
              <Music size={12} className="text-white/40 animate-bounce" />
              <div className="w-full overflow-hidden whitespace-nowrap mask-image-r">
                <p className="text-[10px] font-bold tracking-wider inline-block animate-[marquee_5s_linear_infinite]">
                  {content.musicTrack || "Original Audio - " + creator.name}
                </p>
              </div>
            </div>
          )}

          {/* Social Commerce Embed */}
          <div className="mt-2">
             <motion.button 
               whileTap={{ scale: 0.97 }}
               className={`h-11 px-4 rounded-xl flex items-center justify-between gap-3 font-semibold text-sm w-fit border backdrop-blur-md
                 ${cta.type === 'buy' ? 'bg-black/50 border-white/20 hover:bg-white/10' : 
                   cta.type === 'apply' ? 'bg-purple-500/20 border-purple-500/30 text-purple-100 hover:bg-purple-500/30' : 
                   'bg-white text-black hover:bg-white/90 border-transparent'}
               `}
             >
                <div className="flex items-center gap-2">
                  {cta.type === 'book' && <CheckCircle size={16} />}
                  {cta.type === 'buy' && <ShoppingBag size={16} />}
                  {cta.type === 'apply' && <ArrowRight size={16} />}
                  <span>{cta.label}</span>
                </div>
                {cta.price && (
                  <span className={`font-black ml-2 ${cta.type === 'book' ? 'text-black/50' : 'text-white/50'}`}>
                    ${cta.price}
                  </span>
                )}
             </motion.button>
          </div>
        </div>
      </div>

      {/* Action Layer: Engagement Sidebar */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-5 pointer-events-auto">
        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setLiked(!liked)}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${liked ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
          >
            <Heart size={20} className={liked ? "fill-current" : ""} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">3.2k</span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setShowComments(true)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <MessageSquare size={20} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">148</span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setReposted(!reposted)}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${reposted ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
          >
            <Repeat2 size={20} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">12</span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setSaved(!saved)}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${saved ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
          >
            <Bookmark size={20} className={saved ? "fill-current" : ""} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">Save</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors mt-2"
        >
          <Share2 size={18} />
        </motion.button>
      </div>
      
      {/* Interactive Fake Comment Drawer */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowComments(false)}
               className="absolute inset-0 bg-black/40 z-40"
            />
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="absolute bottom-0 left-0 right-0 h-[60%] bg-[#0a0a0a] rounded-t-3xl z-50 flex flex-col border-t border-white/10"
            >
               <div className="w-full flex items-center justify-center p-3">
                 <div className="w-10 h-1 bg-white/20 rounded-full" />
               </div>
               <h3 className="text-center font-bold text-xs uppercase tracking-widest text-white/40 mb-4">Comments (148)</h3>
               
               <div className="flex-1 overflow-y-auto px-4 pb-20 flex flex-col gap-4">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-white/60">@user_{i}</span>
                        <p className="text-sm font-medium">This is so fire! 🔥 Can I book for tomorrow?</p>
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-white/40">
                          <span className="font-bold cursor-pointer hover:text-white">Reply</span>
                          <span>2h</span>
                        </div>
                      </div>
                      <Heart size={12} className="ml-auto text-white/20 mt-2" />
                    </div>
                  ))}
               </div>
               
               <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] to-[#0a0a0a]/80 backdrop-blur-md border-t border-white/5">
                 <div className="bg-white/5 border border-white/10 rounded-full h-12 flex items-center px-4">
                    <input type="text" placeholder="Add a comment..." className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-white/30" />
                    <button className="text-blue-400 font-bold text-sm">Post</button>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
