import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageSquare, Share2, Bookmark, Star, MapPin, CheckCircle2, Repeat2, Music, ShoppingBag, ArrowRight, X, Plus, Send, Link, Link2, MessageCircle, HeartCrack } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import DetailScreen from "./DetailScreen";
import { DetailData } from "../types";

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
  embedCTA?: EmbedCTA | EmbedCTA[];
  detailData?: DetailData | DetailData[];
  recommendationReason?: string;
  isAd?: boolean;
}

export default function FeedCard({ 
  creator, 
  content, 
  repost,
  embedCTA,
  detailData,
  isAd,
  onProfileClick, 
  recommendationReason 
}: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showHeartBreak, setShowHeartBreak] = useState(false);
  
  const [saved, setSaved] = useState(false);
  const [showSaveCollections, setShowSaveCollections] = useState(false);
  
  const [reposted, setReposted] = useState(false);
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [repostThought, setRepostThought] = useState("");
  
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([
    { 
      id: 1, 
      user: "street_vision", 
      text: "This is so fire! 🔥 Need this energy.", 
      time: "2h", 
      liked: false,
      replies: [
        { id: 101, user: creator.name, text: "Appreciate you! 🙏", time: "1h", liked: true, replies: [] }
      ]
    },
    { id: 2, user: "local_legend", text: "Quality is crazy. Sent a DM.", time: "4h", liked: true, replies: [] }
  ]);
  const [replyingTo, setReplyingTo] = useState<{id: number, user: string} | null>(null);

  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DetailData | null>(null);
  const [showImmersiveDetail, setShowImmersiveDetail] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showCtaFlow, setShowCtaFlow] = useState(false);
  // Normalize details and CTAs into arrays
  const details = Array.isArray(detailData) ? detailData : detailData ? [detailData] : [];
  const ctas = Array.isArray(embedCTA) ? embedCTA : embedCTA ? [embedCTA] : [];

  const [selectedCta, setSelectedCta] = useState<EmbedCTA | null>(ctas[0] || null);

  // Stats for optimistic UI
  const [stats, setStats] = useState({
    likes: 3200,
    comments: 148,
    reposts: 12
  });

  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleCtaClick = (item?: EmbedCTA) => {
    if (item) setSelectedCta(item);
    if (details.length > 0) {
      setShowSummarySheet(true);
    } else {
      setShowCtaFlow(true);
    }
  };

  const openImmersiveDetail = (data: DetailData) => {
    setSelectedDetail(data);
    setShowImmersiveDetail(true);
    setShowSummarySheet(false);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setStats(prev => ({ ...prev, likes: prev.likes + 1 }));
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 1000);
    } else {
      setLiked(false);
      setStats(prev => ({ ...prev, likes: prev.likes - 1 }));
      setShowHeartBreak(true);
      setTimeout(() => setShowHeartBreak(false), 1000);
    }
  };

  const toggleLike = (comments: any[], id: number): any[] => {
    return comments.map(c => {
      if (c.id === id) {
        return { ...c, liked: !c.liked };
      }
      if (c.replies) {
        return { ...c, replies: toggleLike(c.replies, id) };
      }
      return c;
    });
  };

  const toggleLikeComment = (id: number) => {
    setCommentsList(list => toggleLike(list, id));
  };

  const addReply = (comments: any[], targetId: number, reply: any): any[] => {
    return comments.map(c => {
      if (c.id === targetId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      if (c.replies) {
        return { ...c, replies: addReply(c.replies, targetId, reply) };
      }
      return c;
    });
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    const commentData = { id: Date.now(), user: "you", text: newComment, time: "Just now", liked: false, replies: [] };

    if (replyingTo) {
      if (replyingTo.id === -1) {
        // Repost reply
        setCommentsList([{...commentData, isRepostReply: true}, ...commentsList]);
      } else {
        setCommentsList(list => addReply(list, replyingTo.id, commentData));
      }
      setReplyingTo(null);
    } else {
      setCommentsList([commentData, ...commentsList]);
    }
    
    setStats(prev => ({ ...prev, comments: prev.comments + 1 }));
    setNewComment("");
  };

  const handleSaveToggle = () => {
    if (!saved) {
      setShowSaveCollections(true);
    } else {
      setSaved(false);
    }
  };

  const handleRepostSubmit = () => {
    setReposted(true);
    setStats(prev => ({ ...prev, reposts: prev.reposts + 1 }));
    setShowRepostSheet(false);
  };


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
      <div className="absolute inset-0 z-0 bg-black" onDoubleClick={handleDoubleTap}>
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

        {/* Heart Burst Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5, rotate: -15 }}
              animate={{ scale: 2, opacity: 1, rotate: 0 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.6 }}
              className="absolute inset-0 m-auto w-32 h-32 flex items-center justify-center pointer-events-none z-50 text-red-500 drop-shadow-2xl"
            >
              <Heart size={120} className="fill-current text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heart Break Animation */}
        <AnimatePresence>
          {showHeartBreak && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5, rotate: 15 }}
              animate={{ scale: 2, opacity: 1, rotate: 0 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.6 }}
              className="absolute inset-0 m-auto w-32 h-32 flex items-center justify-center pointer-events-none z-50 text-white/50 drop-shadow-2xl"
            >
              <HeartCrack size={120} className="text-white/40" />
            </motion.div>
          )}
        </AnimatePresence>
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
                 {creator.verified && <CheckCircle2 size={12} className="text-blue-400 fill-blue-500/20" />}
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

          {/* Social Commerce Embed / Multi-Product Attachments */}
          <div className="mt-2 flex flex-wrap gap-2">
             {ctas.length > 0 ? ctas.map((item, idx) => (
                <motion.button 
                  key={idx}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCtaClick(item)}
                  className={`h-11 px-4 rounded-xl flex items-center justify-between gap-3 font-semibold text-sm w-fit border backdrop-blur-md
                    ${item.type === 'buy' ? 'bg-black/50 border-white/20 hover:bg-white/10' : 
                      item.type === 'apply' ? 'bg-purple-500/20 border-purple-500/30 text-purple-100 hover:bg-purple-500/30' : 
                      'bg-white text-black hover:bg-white/90 border-transparent'}
                  `}
                >
                   <div className="flex items-center gap-2">
                     {item.type === 'book' && <CheckCircle2 size={16} />}
                     {item.type === 'buy' && <ShoppingBag size={16} />}
                     {item.type === 'apply' && <ArrowRight size={16} />}
                     <span>{item.label}</span>
                   </div>
                   {item.price && (
                     <span className={`font-black ml-2 ${item.type === 'book' ? 'text-black/50' : 'text-white/50'}`}>
                       ${item.price}
                     </span>
                   )}
                   {ctas.length === 1 && <ArrowRight size={14} className="opacity-40" />}
                </motion.button>
             )) : details.length > 0 ? (
               <motion.button 
                 whileTap={{ scale: 0.97 }}
                 onClick={handleCtaClick}
                 className="h-11 px-4 rounded-xl flex items-center justify-between gap-3 font-semibold text-sm w-fit border backdrop-blur-md bg-white text-black"
               >
                 <span>View Details</span>
                 <ArrowRight size={14} className="opacity-40" />
               </motion.button>
             ) : null}
          </div>
        </div>
      </div>

      {/* Action Layer: Engagement Sidebar */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-5 pointer-events-auto">
        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleDoubleTap}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${liked ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
          >
            <Heart size={20} className={liked ? "fill-current" : ""} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">{stats.likes >= 1000 ? (stats.likes / 1000).toFixed(1) + 'k' : stats.likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setShowComments(true)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <MessageSquare size={20} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">{stats.comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => {
              if (reposted) {
                setReposted(false);
                setStats(p => ({ ...p, reposts: p.reposts - 1 }));
              } else {
                setShowRepostSheet(true);
              }
            }}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${reposted ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
          >
            <Repeat2 size={20} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">{stats.reposts}</span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleSaveToggle}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${saved ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-black/40 border-white/10 text-white hover:bg-white/10'}`}
          >
            <Bookmark size={20} className={saved ? "fill-current" : ""} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">Save</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => setShowShareSheet(true)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors mt-2"
        >
          <Share2 size={18} />
        </motion.button>
      </div>
      
      {/* Interactive Comment Drawer */}
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
               className="absolute bottom-0 left-0 right-0 h-[65%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
               <div className="w-full flex items-center justify-center p-3 shrink-0">
                 <div className="w-10 h-1 bg-white/20 rounded-full" />
               </div>
               <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                 <h3 className="font-bold text-sm text-white/80">Comments ({stats.comments})</h3>
                 <button onClick={() => setShowComments(false)} className="p-1 text-white/40 hover:text-white">
                   <X size={18} />
                 </button>
               </div>
                      <div className="flex-1 overflow-y-auto px-6 pb-20 flex flex-col gap-6 scrollbar-hide">
                  {repost && repost.thought && (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-blue-400 border border-white/5">
                          <Repeat2 size={12} />
                        </div>
                        <div className="flex-1 flex flex-col pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-white/50">{repost.by}</span>
                            <span className="text-[9px] bg-white/10 rounded px-1.5 py-0.5 text-white/40 uppercase tracking-wider font-bold">Repost</span>
                          </div>
                          <p className="text-[13px] font-medium leading-relaxed mt-0.5">{repost.thought}</p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-white/30">
                            <span 
                              className="font-bold cursor-pointer hover:text-white/60"
                              onClick={() => {
                                setReplyingTo({ id: -1, user: repost.by });
                                setNewComment(`@${repost.by} `);
                                commentInputRef.current?.focus();
                              }}
                            >
                              Reply
                            </span>
                            <span>Just now</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {commentsList.filter(c => c.isRepostReply).map(reply => (
                          function renderComment(comment: any, depth: number = 0) {
                            return (
                              <div key={comment.id} className={`flex flex-col gap-4 ${depth > 0 ? 'pl-9 relative before:absolute before:left-[-18px] before:top-[-20px] before:bottom-[10px] before:w-[20px] before:border-l before:border-b before:border-white/10 before:rounded-bl-lg' : 'pl-9 relative before:absolute before:left-[-18px] before:top-[-20px] before:bottom-[10px] before:w-[20px] before:border-l before:border-b before:border-white/10 before:rounded-bl-lg'}`}>
                                <div className="flex gap-3 relative z-10">
                                  <div className={`rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-white/40 border border-white/5 ${depth > -1 ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]'}`}>
                                    {comment.user.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 flex flex-col pt-0.5">
                                    <span className={`font-bold text-white/50 ${depth > -1 ? 'text-[10px]' : 'text-[11px]'}`}>{comment.user}</span>
                                    <p className={`font-medium leading-relaxed mt-0.5 ${depth > -1 ? 'text-[12px]' : 'text-[13px]'}`}>{comment.text}</p>
                                    <div className={`flex items-center gap-4 mt-2 text-white/30 ${depth > -1 ? 'text-[10px]' : 'text-[11px]'}`}>
                                      <span 
                                        className="font-bold cursor-pointer hover:text-white/60"
                                        onClick={() => {
                                          setReplyingTo({ id: comment.id, user: comment.user });
                                          setNewComment(`@${comment.user} `);
                                          commentInputRef.current?.focus();
                                        }}
                                      >
                                        Reply
                                      </span>
                                      <span>{comment.time}</span>
                                    </div>
                                  </div>
                                  <button 
                                     className="h-fit pt-2"
                                     onClick={() => toggleLikeComment(comment.id)}
                                  >
                                     <Heart size={depth > -1 ? 10 : 14} className={comment.liked ? "fill-red-500 text-red-500" : "text-white/20"} />
                                  </button>
                                </div>
                                
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="flex flex-col gap-3">
                                    {comment.replies.map((r: any) => renderComment(r, depth + 1))}
                                  </div>
                                )}
                              </div>
                            );
                          }(reply, 0)
                        ))}
                      </div>
                    </div>
                  )}

                  {commentsList.filter(c => !c.isRepostReply).map(function renderComment(comment: any, depth: number = 0) {
                    return (
                      <div key={comment.id} className={`flex flex-col gap-4 ${depth > 0 ? 'pl-9 relative before:absolute before:left-[-18px] before:top-[-20px] before:bottom-[10px] before:w-[20px] before:border-l before:border-b before:border-white/10 before:rounded-bl-lg' : ''}`}>
                        <div className="flex gap-3 relative z-10">
                          <div className={`rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-white/40 border border-white/5 ${depth > 0 ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]'}`}>
                            {comment.user.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 flex flex-col pt-0.5">
                            <span className={`font-bold text-white/50 ${depth > 0 ? 'text-[10px]' : 'text-[11px]'}`}>{comment.user}</span>
                            <p className={`font-medium leading-relaxed mt-0.5 ${depth > 0 ? 'text-[12px]' : 'text-[13px]'}`}>{comment.text}</p>
                            <div className={`flex items-center gap-4 mt-2 text-white/30 ${depth > 0 ? 'text-[10px]' : 'text-[11px]'}`}>
                              <span 
                                className="font-bold cursor-pointer hover:text-white/60"
                                onClick={() => {
                                  setReplyingTo({ id: comment.id, user: comment.user });
                                  setNewComment(`@${comment.user} `);
                                  commentInputRef.current?.focus();
                                }}
                              >
                                Reply
                              </span>
                              <span>{comment.time}</span>
                            </div>
                          </div>
                          <button 
                             className="h-fit pt-2"
                             onClick={() => toggleLikeComment(comment.id)}
                          >
                             <Heart size={depth > 0 ? 10 : 14} className={comment.liked ? "fill-red-500 text-red-500" : "text-white/20"} />
                          </button>
                        </div>
                        
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="flex flex-col gap-3">
                            {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
               
               <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0f0f0f] border-t border-white/5 pb-8">
                 <div className="bg-white/5 border border-white/10 rounded-full h-12 flex items-center px-4 gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 shrink-0">Y</div>
                    <input 
                      ref={commentInputRef}
                      type="text" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                      placeholder="Add a comment..." 
                      className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-white/30" 
                    />
                    <button 
                      onClick={handlePostComment}
                      disabled={!newComment.trim()}
                      className="text-blue-400 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed w-8 flex justify-center"
                    >
                      <Send size={16} />
                    </button>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Collection Drawer */}
      <AnimatePresence>
        {showSaveCollections && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowSaveCollections(false)}
               className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="absolute bottom-0 left-0 right-0 h-[50%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
               <div className="w-full flex items-center justify-center p-3 shrink-0">
                 <div className="w-10 h-1 bg-white/20 rounded-full" />
               </div>
               <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                 <h3 className="font-bold text-sm text-white/80">Save to Collection</h3>
                 <button onClick={() => setShowSaveCollections(false)} className="p-1 text-white/40 hover:text-white">
                   <X size={18} />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-3">
                  <button className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Plus size={24} />
                    </div>
                    <span className="font-semibold text-sm">Create new collection</span>
                  </button>
                  
                  {["Style Inspo", "Service Providers", "Apprenticeships"].map((collection) => (
                    <button 
                      key={collection}
                      onClick={() => {
                        setSaved(true);
                        setShowSaveCollections(false);
                      }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                        <Bookmark size={20} className="text-white/20" />
                      </div>
                      <span className="font-semibold text-sm">{collection}</span>
                    </button>
                  ))}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Repost Drawer */}
      <AnimatePresence>
        {showRepostSheet && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowRepostSheet(false)}
               className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="absolute bottom-0 left-0 right-0 h-auto bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] px-6 pb-8 pt-4"
            >
               <div className="w-full flex items-center justify-center pb-4 shrink-0">
                 <div className="w-10 h-1 bg-white/20 rounded-full" />
               </div>
               
               <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold shrink-0">
                   Y
                 </div>
                 <div className="flex flex-col flex-1">
                   <textarea
                     value={repostThought}
                     onChange={(e) => setRepostThought(e.target.value)}
                     placeholder="Add a thought to your repost..."
                     className="w-full bg-transparent border-none outline-none text-base resize-none min-h-[80px] placeholder:text-white/30"
                     autoFocus
                   />
                   
                   {/* Quoted Post Preview */}
                   <div className="mt-2 mb-4 p-3 rounded-xl border border-white/10 bg-white/5 flex gap-3 opacity-80">
                     <div className="w-10 h-10 bg-zinc-800 rounded bg-cover bg-center" style={{ backgroundImage: `url(${creator.avatar})` }} />
                     <div className="flex flex-col overflow-hidden">
                       <span className="font-bold text-[10px] text-white/50">{creator.name}</span>
                       <span className="text-xs text-white/80 line-clamp-1">{content.caption}</span>
                     </div>
                   </div>

                   <div className="flex justify-between items-center mt-2">
                     <button 
                       onClick={() => setShowRepostSheet(false)}
                       className="text-white/40 text-sm font-semibold hover:text-white"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleRepostSubmit}
                       className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-white/90 transition-colors"
                     >
                       {repostThought.trim() ? 'Repost with Thought' : 'Repost'}
                     </button>
                   </div>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Drawer */}
      <AnimatePresence>
        {showShareSheet && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowShareSheet(false)}
               className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="absolute bottom-0 left-0 right-0 h-auto bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-8 overflow-hidden"
            >
               <div className="w-full flex items-center justify-center p-3 shrink-0">
                 <div className="w-10 h-1 bg-white/20 rounded-full" />
               </div>
               
               <div className="px-6 py-4 flex items-center justify-around gap-6">
                 <div className="flex flex-col items-center gap-2">
                   <button 
                     onClick={() => {
                        setShowShareSheet(false);
                        setShowRepostSheet(true);
                     }}
                     className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                   >
                     <Repeat2 size={24} />
                   </button>
                   <span className="text-[10px] text-white/60">Repost</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-colors">
                     <Link2 size={24} />
                   </button>
                   <span className="text-[10px] text-white/60">Copy Link</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                     <MessageCircle size={24} />
                   </button>
                   <span className="text-[10px] text-white/60">Message</span>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CTA Bottom Sheet (e.g. Booking/Buy Flow) */}
      <AnimatePresence>
        {showCtaFlow && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowCtaFlow(false)}
               className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="absolute bottom-0 left-0 right-0 h-[75%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
               <div className="w-full flex items-center justify-center p-3 shrink-0">
                 <div className="w-10 h-1 bg-white/20 rounded-full" />
               </div>
               <div className="flex items-center justify-between px-6 pb-2 shrink-0">
                 <h3 className="font-bold text-lg text-white">{selectedCta?.label}</h3>
                 <button onClick={() => setShowCtaFlow(false)} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full mt-[-8px]">
                   <X size={18} />
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
                 {/* Provider Info */}
                 <div className="flex items-center gap-4 pb-6 border-b border-white/10 mt-2">
                   <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center font-bold text-xl text-white/40">
                     {creator.name.charAt(0)}
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-white/60 uppercase tracking-widest">{creator.category}</span>
                     <h4 className="text-xl font-bold flex items-center gap-2">{creator.name} {creator.verified && <CheckCircle2 size={14} className="text-blue-500" />}</h4>
                     <div className="flex gap-2 text-xs font-semibold text-white/40 items-center">
                       <span>★ {creator.rating}</span>
                       <span>•</span>
                       <span>1hr avg response</span>
                     </div>
                   </div>
                 </div>

                 {/* Requirements/Details stub */}
                 {selectedCta?.type === 'book' && (
                   <div className="flex flex-col gap-3">
                     <h5 className="font-bold text-sm text-white/80">Service Details</h5>
                     <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                       <span className="text-sm text-white/60">Duration: 1-2 hours</span>
                       <span className="text-sm text-white/60">Location: {creator.location}</span>
                     </div>
                   </div>
                 )}
                 {selectedCta?.type === 'buy' && (
                   <div className="flex flex-col gap-3">
                     <h5 className="font-bold text-sm text-white/80">Product Options</h5>
                     <div className="flex gap-2">
                       <div className="border border-white/20 px-4 py-2 rounded-lg bg-white/5 text-sm">Size M</div>
                       <div className="border border-white/20 px-4 py-2 rounded-lg bg-black text-sm text-white/40">Size L</div>
                     </div>
                   </div>
                 )}
                 
                 <div className="mt-auto pt-6 flex flex-col gap-3">
                   <div className="flex justify-between items-center px-1">
                     <span className="text-white/60 font-medium">Total Price</span>
                     <span className="text-2xl font-black">${selectedCta?.price || 'Free'}</span>
                   </div>
                   <button 
                     onClick={() => {
                        setShowCtaFlow(false);
                     }}
                     className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 text-base transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 ${
                       selectedCta?.type === 'apply' ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-white text-black hover:bg-white/90'
                     }`}
                   >
                     {selectedCta?.type === 'book' ? 'Select Date & Time' : selectedCta?.type === 'buy' ? 'Add to Cart' : 'Submit Application'}
                   </button>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Summary Preview Sheet */}
      <AnimatePresence>
        {showSummarySheet && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setShowSummarySheet(false)}
               className="absolute inset-0 bg-black/80 z-[60] backdrop-blur-md"
            />
            <motion.div 
               initial={{ y: "100%" }} 
               animate={{ y: 0 }} 
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 30, stiffness: 300 }}
               className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-[#0f0f0f] rounded-t-[3rem] z-[70] flex flex-col border-t border-white/10 shadow-2xl p-8"
            >
               <div className="w-full flex items-center justify-center mb-6">
                 <div className="w-12 h-1.5 bg-white/10 rounded-full" />
               </div>

               <div className="flex flex-col gap-8 overflow-y-auto scrollbar-hide py-2">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                      {details.length > 1 ? "Linked Opportunities" : "Quick Preview"}
                    </h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Tap to view full details</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {details.map((item, idx) => (
                      <motion.div 
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openImmersiveDetail(item)}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-6 group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.heroMedia[0]})` }} />
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{item.type}</span>
                            <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                               <div className="flex items-center gap-1">
                                  <Star size={12} className="text-yellow-500 fill-current" />
                                  <span className="text-xs font-bold">{item.creator.rating}</span>
                               </div>
                               <span className="text-white/20 text-xs">|</span>
                               <span className="text-xs font-black text-green-500 uppercase tracking-widest">Verified</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Starts at</span>
                              <span className="text-2xl font-black">${'price' in item ? item.price : 'priceStructure' in item ? item.priceStructure.startingPrice : 'Free'}</span>
                           </div>
                           <button className="h-12 px-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 group-hover:scale-105 transition-transform">
                              Full Details <ArrowRight size={14} />
                           </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
               </div>

               <button 
                onClick={() => setShowSummarySheet(false)}
                className="mt-8 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
               >
                 Close Preview
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Immersive Detail Screen */}
      <AnimatePresence>
        {showImmersiveDetail && selectedDetail && (
          <DetailScreen 
            isOpen={showImmersiveDetail}
            onClose={() => setShowImmersiveDetail(false)}
            data={selectedDetail}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
