import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Phone, Video, MoreVertical, Send, Paperclip, 
  Mic, Image as ImageIcon, Briefcase, Lock, DollarSign,
  Check, CheckCheck, Clock, Reply, Smile, Shield, ChevronLeft,
  FileText, Download, Play, MessageSquare, AlertCircle,
  ExternalLink,
  UserPlus,
  UserCheck
} from "lucide-react";
import TransactionMessage from './TransactionMessage';
import { TransactionType } from '../types';
import { useConversation } from '../features/chat/hooks/useConversation';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { useChatStore } from '../features/chat/stores/useChatStore';
import { useBookingStore } from '../features/bookings/stores/useBookingStore';
import BookingContextCard from './BookingContextCard';
import TrustBadge from './TrustBadge';
import { supabase } from '../lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';
import { AudioPlayer } from './chat/AudioPlayer';
import { VoiceRecorder } from './chat/VoiceRecorder';
import { MessageReactions } from './chat/MessageReactions';

interface ConversationViewProps {
  // We use `conversationId` instead of `chat` object in the updated flow 
  // wait MockHome passes `conversationId` to ConversationView. Let's make sure it handles both.
  conversationId?: string; // from MockHome
  chat?: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
    projectStatus?: string;
    hasEscrow?: boolean;
    otherParticipant?: any;
  };
  onClose: () => void;
  onManageBooking?: (booking: any) => void;
}

export default function ConversationView({ chat: passedChat, conversationId, onClose, onManageBooking }: ConversationViewProps) {
  const { user } = useAuthStore();
  const cId = passedChat?.id || conversationId!;
  
  const { messages, sendMessage, isSending, setTyping } = useConversation(cId);
  
  const foundConversation = useChatStore(state => state.conversations.find(c => c.id === cId));
  
  const onlineUsers = useChatStore(state => state.onlineUsers);
  
  const chat = passedChat || (foundConversation ? {
    id: foundConversation.id,
    name: foundConversation.otherParticipant?.full_name || foundConversation.otherParticipant?.username || 'Unknown Hustler',
    avatar: foundConversation.otherParticipant?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundConversation.id}`,
    online: foundConversation.otherParticipant?.id ? onlineUsers[foundConversation.otherParticipant.id] : false,
  } : { id: cId, name: 'Loading...', avatar: '', online: false });

  const typingUsers = useChatStore(state => state.typingUsers[cId]);
  const typingRecord = typingUsers || {};
  const isOtherTyping = Object.keys(typingRecord).length > 0 && Object.values(typingRecord).some(isT => isT);
  const typingUserNames = Object.keys(typingRecord)
    .filter(uid => typingRecord[uid] && uid !== user?.id)
    .map(uid => {
      const otherPart = foundConversation?.otherParticipant;
      if (otherPart && uid === otherPart.id) {
        return otherPart.full_name || otherPart.username || 'The recipient';
      }
      return 'The recipient';
    });
  const typingText = typingUserNames.length > 0 ? `${typingUserNames[0]} is typing` : 'Someone is typing';
  const activeReply = useChatStore(state => state.activeReplies[cId]);


  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { buyerOrders, sellerOrders } = useBookingStore();
  
  const targetUser = foundConversation?.otherParticipant || passedChat?.otherParticipant;
  
  // Find active booking between the current user and the target user
  let activeBooking = null;
  if (targetUser && user) {
     const relevantBuyer = buyerOrders.find(b => b.seller_id === targetUser.id && (b.status === 'pending' || b.status === 'in_progress' || b.status === 'accepted'));
     const relevantSeller = sellerOrders.find(b => b.buyer_id === targetUser.id && (b.status === 'pending' || b.status === 'in_progress' || b.status === 'accepted'));
     activeBooking = relevantBuyer || relevantSeller || null;
  }

  const durations = [
    { label: 'Off', value: null },
    { label: '1 Hour', value: '1 hour' },
    { label: '1 Day', value: '1 day' },
    { label: '1 Week', value: '7 days' },
    { label: '1 Month', value: '30 days' },
    { label: '1 Year', value: '1 year' },
  ];

   // File upload handling
   const fileInputRef = useRef<HTMLInputElement>(null);
   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     // Optional: You could show local optimistic preview
     // For now just invoke store
     await useChatStore.getState().sendMediaMessage(cId, file);
     
     if (fileInputRef.current) fileInputRef.current.value = '';
   };

  // For shared post previews
  const [postPreviews, setPostPreviews] = useState<Record<string, any>>({});

  useEffect(() => {
     if (cId) {
       useChatStore.getState().markConversationRead(cId);
     }
  }, [cId, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  useEffect(() => {
    // Fetch post previews for shared posts
    const sharedPosts = messages.filter(m => m.message_type === 'shared_post' && m.shared_post_id);
    sharedPosts.forEach(async (m) => {
      if (m.shared_post_id && !postPreviews[m.shared_post_id]) {
        const { data } = await supabase
          .from('posts')
          .select('*, profiles!posts_user_id_fkey(*)')
          .eq('id', m.shared_post_id)
          .single();
        if (data) {
          setPostPreviews(prev => ({ ...prev, [m.shared_post_id!]: data }));
        }
      }
    });
  }, [messages]);

  // Typing debounce timer
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (setTyping) {
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    }
  };

  useEffect(() => {
    // Force re-render to handle local expiration cleanup
    const interval = setInterval(() => {
      setPostPreviews(prev => ({ ...prev }));
    }, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const visibleMessages = messages.filter(m => !m.expires_at || new Date(m.expires_at) > new Date());

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText;
    setInputText('');
    if (setTyping) setTyping(false);
    await sendMessage(text);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Thread Header - Project Rooted */}
      <header className="relative z-10 px-6 pt-12 pb-6 border-b border-white/5 bg-black/80 backdrop-blur-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors active-scale">
              <ChevronLeft size={24} />
           </button>
           <div className="relative">
              <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden">
                 <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              </div>
              {chat.online && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-black" />
              )}
           </div>
           <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-black uppercase tracking-tight italic">{chat.name}</h2>
                {targetUser?.verified && (
                  <TrustBadge type="verified" size="xs" showLabel={false} />
                )}
                {targetUser?.is_hustler && (
                  <TrustBadge type="trusted_hustler" size="xs" showLabel={false} />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${chat.online ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{chat.online ? 'Active Now' : 'Last seen 2h ago'}</span>
                 {activeBooking && (
                   <button 
                     onClick={() => onManageBooking && onManageBooking(activeBooking)}
                     className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-primary/15 border border-brand-primary/30 hover:bg-brand-primary/25 cursor-pointer rounded-full transition-all active:scale-95 text-[7px] font-black text-brand-primary uppercase tracking-widest shrink-0"
                   >
                     <Briefcase size={8} />
                     <span>Contract Details</span>
                   </button>
                 )}
                 {foundConversation?.disappearing_messages_duration && (
                   <div className="flex items-center gap-1 ml-1 pl-1 border-l border-white/10">
                     <Clock size={8} className="text-brand-primary" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary">
                       {foundConversation.disappearing_messages_duration} mode
                     </span>
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="flex items-center gap-1">
           <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <Phone size={18} className="text-white/40" />
           </button>
           <button 
             onClick={() => setShowSettings(!showSettings)}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showSettings ? 'bg-brand-primary text-white' : 'hover:bg-white/5 text-white/40'}`}
           >
              <Clock size={18} />
           </button>
           <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <Video size={18} className="text-white/40" />
           </button>
           <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <MoreVertical size={18} className="text-white/40" />
           </button>
        </div>
      </header>

      {activeBooking && (
        <BookingContextCard 
          booking={activeBooking as any} 
          onOpenBooking={() => onManageBooking && onManageBooking(activeBooking)} 
        />
      )}

      {/* Project Status Bar - The HUD for Work */}
      <div className="relative z-10 bg-white/5 border-b border-white/5 px-6 py-3 flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <Briefcase size={12} className="text-blue-400" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{chat.projectStatus || 'Open Project'}</span>
            </div>
            {chat.hasEscrow && (
              <div className="flex items-center gap-2">
                 <Lock size={12} className="text-emerald-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Escrow Locked</span>
              </div>
            )}
         </div>
         <button className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 group active-scale">
            <DollarSign size={10} className="text-brand-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white group-hover:text-brand-primary transition-colors">Request Payment</span>
         </button>
      </div>

      {/* Messages Timeline */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="flex flex-col items-center mb-8 gap-2">
           <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Project Phase 1 Commenced</span>
           </div>
           <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">End-to-End Encryption Enabled</p>
        </div>

        {visibleMessages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const time = format(new Date(msg.created_at), 'h:mm a');
          
          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${msg.message_type === 'system' ? 'w-full items-center' : ''}`}
            >
              {msg.message_type === 'system' ? (
                <div className="w-full flex flex-col items-center gap-4 my-2">
                   {msg.media_metadata && typeof msg.media_metadata === 'object' && msg.media_metadata.booking_id ? (
                      <div className="w-full max-w-[90%] pointer-events-auto">
                         <TransactionMessage 
                           payload={{
                             type: msg.media_metadata.booking_status === 'accepted' ? TransactionType.ESCROW_FUNDED : TransactionType.AWAITING_APPROVAL,
                             title: msg.content,
                             amount: Number(msg.media_metadata.booking_price || 0),
                             description: msg.media_metadata.booking_status === 'accepted' 
                               ? "Funds are escrowed under Hustler Trust protection. The project is safe and underway."
                               : msg.media_metadata.booking_status === 'rejected'
                               ? "The booking request was declined. No charges were made."
                               : "Track the transaction and escrow history of this active contract anytime.",
                             actionLabel: "View Escrow Vault",
                             onAction: () => {
                               if (onManageBooking) {
                                 onManageBooking({
                                    id: msg.media_metadata.booking_id,
                                    buyer_id: msg.media_metadata.buyer_id,
                                    seller_id: msg.media_metadata.seller_id,
                                    total_price: msg.media_metadata.booking_price,
                                    status: msg.media_metadata.booking_status
                                 });
                               }
                             }
                           }}
                         />
                      </div>
                   ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 mx-auto">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.5)]" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">{msg.content}</span>
                      </div>
                   )}
                </div>
              ) : (
                <>
                  {/* Meta Info */}
                  <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                     <span className="text-[8px] font-bold text-white/20 uppercase">{time}</span>
                     {msg.expires_at && (
                       <div className="flex items-center gap-1 text-brand-primary animate-pulse">
                         <Clock size={8} />
                         <span className="text-[7px] font-bold uppercase whitespace-nowrap">
                           Expires in {formatDistanceToNow(new Date(msg.expires_at), { addSuffix: false })}
                         </span>
                       </div>
                     )}
                     {isMe && (
                       <div className="flex items-center gap-1 group/status">
                         {msg.is_read ? (
                           <>
                             <CheckCheck size={10} className="text-brand-primary" />
                             <span className="text-[7px] font-black uppercase tracking-tighter text-brand-primary hidden group-hover/status:block">Read</span>
                           </>
                         ) : msg.delivered_at ? (
                           <>
                             <CheckCheck size={10} className="text-white/40" />
                             <span className="text-[7px] font-black uppercase tracking-tighter text-white/40 hidden group-hover/status:block">Delivered</span>
                           </>
                         ) : (
                           <>
                             <Check size={10} className="text-white/40" />
                             <span className="text-[7px] font-black uppercase tracking-tighter text-white/40 hidden group-hover/status:block">Sent</span>
                           </>
                         )}
                       </div>
                     )}
                  </div>

                  {/* Content Logic */}
                  <div className={`max-w-[85%] rounded-[1.75rem] p-4 relative group ${
                    isMe 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-white rounded-tl-none'
                  }`}>
                     {(msg.media_metadata as any)?.reply_to_content && (
                       <div className="mb-2 pl-3 border-l-2 border-white/20 bg-black/10 p-2 rounded-lg">
                          <p className="text-[9px] font-bold text-white/50 mb-0.5">{`Replying to ${(msg.media_metadata as any)?.reply_to_sender}`}</p>
                          <p className="text-[11px] text-white/70 line-clamp-1">{(msg.media_metadata as any)?.reply_to_content}</p>
                       </div>
                     )}
                     {(msg.message_type === 'text' || !msg.message_type) && <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>}
                     
                     {msg.message_type === 'file' && (
                       <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                             <FileText size={20} className="text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <h5 className="text-[11px] font-black uppercase tracking-tight italic line-clamp-1">{msg.content || 'File Attachment'}</h5>
                             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Download</span>
                          </div>
                          <a 
                            href={msg.media_url || (msg.media_metadata as any)?.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                             <Download size={14} />
                          </a>
                       </div>
                     )}

                     {msg.message_type === 'shared_post' && msg.shared_post_id && (
                       <div className="flex flex-col gap-3 min-w-[200px]">
                          {postPreviews[msg.shared_post_id] ? (
                            <div className="flex flex-col bg-black/40 rounded-2xl overflow-hidden border border-white/10">
                               <div className="aspect-[4/5] relative">
                                  {postPreviews[msg.shared_post_id].media_type === 'video' ? (
                                    <video src={postPreviews[msg.shared_post_id].media_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={postPreviews[msg.shared_post_id].media_url} className="w-full h-full object-cover" alt="Post" />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden">
                                        <img src={postPreviews[msg.shared_post_id].profiles?.avatar_url} className="w-full h-full object-cover" />
                                     </div>
                                     <span className="text-[9px] font-bold text-white truncate">@{postPreviews[msg.shared_post_id].profiles?.username}</span>
                                  </div>
                               </div>
                               <div className="p-3">
                                  <p className="text-[10px] text-white/60 line-clamp-2 italic mb-3">"{postPreviews[msg.shared_post_id].caption}"</p>
                                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                     View Post <ExternalLink size={10} />
                                  </button>
                               </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-4 bg-black/20 rounded-2xl animate-pulse">
                               <div className="w-10 h-10 rounded-xl bg-white/5" />
                               <div className="flex-1 space-y-2">
                                  <div className="h-2 w-20 bg-white/5 rounded" />
                                  <div className="h-1.5 w-32 bg-white/5 rounded" />
                               </div>
                            </div>
                          )}
                          <p className="text-[12px] font-medium leading-relaxed opacity-60">Shared a post with you</p>
                       </div>
                     )}

                     {msg.message_type === 'image' && (
                       <div className="rounded-2xl overflow-hidden border border-white/10 mt-1">
                          <img src={msg.media_url || (msg.media_metadata as any)?.url} className="max-w-full h-auto object-cover" alt="Attachment" />
                       </div>
                     )}

                     {msg.message_type === 'video' && (
                       <div className="rounded-2xl overflow-hidden border border-white/10 mt-1">
                          <video src={msg.media_url || (msg.media_metadata as any)?.url} controls className="max-w-[240px] w-full bg-black" />
                       </div>
                     )}

                     {msg.message_type === 'voice' && (
                       <div className="mt-1">
                          <AudioPlayer 
                             mediaUrl={msg.media_url || (msg.media_metadata as any)?.url} 
                             duration={(msg.media_metadata as any)?.duration_seconds} 
                          />
                       </div>
                     )}

                     <MessageReactions messageId={msg.id} isMe={isMe} />

                     <button 
                       onClick={() => useChatStore.getState().setActiveReply(cId, msg)}
                       className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'right-[105%]' : 'left-[105%]'} opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 border border-white/10 rounded-full p-2 hover:bg-white/10`}
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                     </button>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
        {isOtherTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex flex-col items-start"
          >
             <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[8px] font-bold text-brand-primary uppercase tracking-wider animate-pulse">{typingText}</span>
             </div>
             <div className="bg-white/5 border border-white/5 rounded-[1.75rem] rounded-tl-none p-4 py-3 flex items-center gap-1.5 w-16 mb-4">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
             </div>
          </motion.div>
        )}
      </main>

      {/* Actionable Toolbar - Fast interactions */}
      <div className="px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
         {[
           { icon: <Briefcase size={12} />, label: 'Milestone' },
           { icon: <Clock size={12} />, label: 'Schedule' },
           { icon: <ImageIcon size={12} />, label: 'Moodboard' },
           { icon: <AlertCircle size={12} />, label: 'Critical' }
         ].map((tool, i) => (
           <button key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors whitespace-nowrap active-scale">
              <span className="text-white/40">{tool.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{tool.label}</span>
           </button>
         ))}
      </div>

      {/* Input Hub */}
      <footer className="px-6 py-8 safe-bottom bg-black/80 backdrop-blur-3xl border-t border-white/5 relative z-10 flex flex-col gap-2">
         {activeReply && (
           <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10 mx-2">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                 Replying to {activeReply.sender?.full_name || activeReply.sender?.username || 'User'}
               </span>
               <span className="text-xs text-white/70 line-clamp-1">{activeReply.content || activeReply.message_type}</span>
             </div>
             <button 
               onClick={() => useChatStore.getState().setActiveReply(cId, null)}
               className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
           </div>
         )}
         {isRecording ? (
           <VoiceRecorder 
             onSend={(file, duration) => {
               useChatStore.getState().sendVoiceMessage(cId, file, duration);
               setIsRecording(false);
             }}
             onCancel={() => setIsRecording(false)}
           />
         ) : (
           <div className="flex items-center gap-3 bg-white/5 rounded-[2.5rem] p-2 pr-4 border border-white/5 group focus-within:border-brand-primary/40 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group">
                 <Paperclip size={20} className="text-white/40 group-hover:text-white" />
              </button>
              <input 
                type="text" 
                placeholder="Design brief, files, or message..." 
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium h-12"
              />
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setIsRecording(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                 >
                    <Mic size={18} className="text-white/20" />
                 </button>
                 <button 
                   onClick={handleSendMessage}
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${inputText.trim() ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/40' : 'bg-white/5 text-white/20'}`}
                 >
                    <Send size={20} className={inputText.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
                 </button>
              </div>
           </div>
         )}
      </footer>

      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-4 border border-brand-primary/20">
                  <Clock size={32} className="text-brand-primary" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Disappearing Messages</h3>
                <p className="text-xs text-white/40 leading-relaxed max-w-[240px]">
                  New messages sent in this chat will disappear after the selected duration has passed.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                 {durations.map(d => (
                   <button
                     key={d.label}
                     onClick={() => {
                       useChatStore.getState().updateConversationSettings(cId, { disappearing_messages_duration: d.value });
                       setShowSettings(false);
                     }}
                     className={`flex items-center justify-between px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all active-scale ${
                       foundConversation?.disappearing_messages_duration === d.value 
                         ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20' 
                         : 'bg-white/5 hover:bg-white/10 text-white/60'
                     }`}
                   >
                     {d.label}
                     {foundConversation?.disappearing_messages_duration === d.value && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                   </button>
                 ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
