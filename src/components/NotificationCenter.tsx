import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Bell, BellOff, CheckCircle2, MessageSquare, 
  DollarSign, ShoppingBag, Radio, Shield, Star,
  Clock, ChevronRight, MoreVertical, Filter,
  TrendingUp, Zap, Info, Briefcase, Heart, UserPlus, Repeat, ShieldCheck, Phone
} from "lucide-react";
import { useNotificationStore, NotificationType, NotificationGroup } from '../features/feed/stores/useNotificationStore';
import { useBookingStore } from '../features/bookings/stores/useBookingStore';
import { FollowButton } from "./social/FollowButton";
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { Toast } from './HustleUI';

interface NotificationCenterProps {
  onClose: () => void;
  onOpenEscrow: (bookingId: string) => void;
  onOpenChat: (userId: string) => void;
  onOpenBookingDetail?: (bookingId: string) => void;
}

export default function NotificationCenter({ onClose, onOpenEscrow, onOpenChat, onOpenBookingDetail }: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const { groupedNotifications, markGroupRead, markAllRead, fetchNotifications } = useNotificationStore();
  const { buyerOrders, sellerOrders, fetchBookings, updateBookingStatus } = useBookingStore();
  const { user } = useAuthStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  const handleNotificationClick = (group: NotificationGroup) => {
    markGroupRead(group.items.map(item => item.id));

    // If it's a booking-related notification, open the escrow manager
    const bookingTypes: NotificationType[] = [
      'booking', 'booking_new', 'booking_accepted', 'escrow', 
      'milestone', 'milestone_delivered', 'milestone_released'
    ];

    if (bookingTypes.includes(group.type) && group.entity_id) {
       onOpenEscrow(group.entity_id);
    } else if (group.type === 'internal_share' && group.actors[0]?.id) {
       onOpenChat(group.actors[0].id);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchBookings();
  }, [fetchNotifications, fetchBookings]);

  const filtered = groupedNotifications.filter(n => activeFilter === 'all' || n.type === activeFilter);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-pink-500" />;
      case 'comment': return <MessageSquare size={16} className="text-blue-400" />;
      case 'reply': return <MessageSquare size={16} className="text-blue-400" />;
      case 'repost': return <Repeat size={16} className="text-green-500" />;
      case 'follow': return <UserPlus size={16} className="text-purple-500" />;
      case 'story_reaction': return <Star size={16} className="text-yellow-400" />;
      case 'story_reply': return <MessageSquare size={16} className="text-yellow-400" />;
      case 'internal_share': return <Radio size={16} className="text-brand-primary" />;
      case 'booking': return <Briefcase size={16} className="text-orange-400" />;
      case 'wallet': return <DollarSign size={16} className="text-yellow-500" />;
      case 'escrow': return <Shield size={16} className="text-emerald-500" />;
      case 'work': return <Zap size={16} className="text-blue-500" />;
      case 'milestone': return <TrendingUp size={16} className="text-purple-500" />;
      case 'milestone_delivered': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'milestone_released': return <Zap size={16} className="text-yellow-400" />;
      case 'booking_new': return <Briefcase size={16} className="text-brand-primary animate-pulse" />;
      case 'booking_accepted': return <ShieldCheck size={16} className="text-blue-400" />;
      case 'system': return <Shield size={16} className="text-slate-400" />;
      default: return <Bell size={16} className="text-white/60" />;
    }
  };

  const getTitle = (type: NotificationType, count: number, entityId?: string | null) => {
      if (entityId) {
          const booking = buyerOrders.find(b => b.id === entityId) || sellerOrders.find(b => b.id === entityId);
          if (booking) {
              if (booking.status === 'accepted') return 'Booking Active';
              if (booking.status === 'rejected') return 'Booking Declined';
              if (booking.status === 'cancelled') return 'Booking Cancelled';
              if (booking.status === 'completed') return 'Booking Completed';
              if (booking.status === 'in_progress') return 'Work Active';
          }
      }

      switch (type) {
        case 'like': return count > 1 ? `${count} New Likes` : 'New Like';
        case 'comment': return count > 1 ? `${count} New Comments` : 'New Comment';
        case 'reply': return count > 1 ? `${count} New Replies` : 'New Reply';
        case 'repost': return count > 1 ? `${count} New Reposts` : 'New Repost';
        case 'follow': return count > 1 ? `${count} New Followers` : 'New Follower';
        case 'story_reaction': return count > 1 ? `${count} Story Reactions` : 'Story Reaction';
        case 'story_reply': return count > 1 ? `${count} Story Replies` : 'Story Reply';
        case 'internal_share': return 'Shared Post';
        case 'booking': return 'Booking Alert';
        case 'wallet': return 'Wallet Update';
        case 'escrow': return 'Escrow Update';
        case 'work': return 'Work Update';
        case 'milestone': return 'Milestone Alert';
        case 'milestone_delivered': return 'Work Delivered';
        case 'milestone_released': return 'Payment Released';
        case 'booking_new': return 'New Booking Request';
        case 'booking_accepted': return 'Booking Accepted';
        case 'system': return 'System Alert';
        default: return 'Notification';
      }
  };

  const formatDistanceToNow = (dateString: string) => {
      const diffInSeconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
  };

  const getDescription = (group: any) => {
      const firstActor = group.actors[0]?.full_name || 'Someone';
      const others = group.count - 1;
      
      const bookingTypes: NotificationType[] = ['booking', 'booking_new', 'booking_accepted'];
      if (bookingTypes.includes(group.type) && group.entity_id) {
          const booking = buyerOrders.find(b => b.id === group.entity_id) || sellerOrders.find(b => b.id === group.entity_id);
          if (booking) {
              if (booking.status === 'accepted') return `Booking request was accepted. Project is now active.`;
              if (booking.status === 'rejected') return `This booking request was declined.`;
              if (booking.status === 'cancelled') return `This booking request was cancelled.`;
              if (booking.status === 'completed') return `Project completed! Payment released.`;
              if (booking.status === 'in_progress') return `Work is currently in progress.`;
          }
      }

      switch(group.type) {
          case 'like': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} liked your post.`;
          case 'comment': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} commented on your post.`;
          case 'reply': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} replied to you.`;
          case 'repost': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} reposted your content.`;
          case 'follow': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} started following you.`;
          case 'story_reaction': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} reacted to your story.`;
          case 'story_reply': return `${firstActor}${others > 0 ? ` and ${others} others` : ''} replied to your story.`;
          case 'internal_share': return `${firstActor} shared a post with you.`;
          case 'booking': return group.items[0]?.message || 'You have a new booking request.';
          case 'wallet': return group.items[0]?.message || 'Wallet transaction update.';
          case 'escrow': return group.items[0]?.message || 'Escrow status changed.';
          case 'work': return group.items[0]?.message || 'Work update.';
          case 'milestone': return group.items[0]?.message || 'Milestone achieved.';
          case 'system': return group.items[0]?.message || 'System notification.';
          default: return group.items[0]?.message || 'You have a new notification.';
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
             { id: 'like', label: 'Likes' },
             { id: 'comment', label: 'Comments' },
             { id: 'follow', label: 'Follows' },
             { id: 'repost', label: 'Reposts' },
             { id: 'internal_share', label: 'Shares' },
             { id: 'booking', label: 'Bookings' },
             { id: 'wallet', label: 'Finance' },
             { id: 'escrow', label: 'Escrow' },
             { id: 'work', label: 'Work' },
             { id: 'milestone', label: 'Milestones' },
             { id: 'system', label: 'System' }
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
        <div className="text-[9px] text-white/40 mt-2 italic px-1">
           {activeFilter === 'all' && 'Viewing all of your recent activity.'}
           {activeFilter === 'like' && 'Viewing likes and reactions on your posts.'}
           {activeFilter === 'comment' && 'Viewing comments and replies on your posts.'}
           {activeFilter === 'follow' && 'Viewing users who started following you.'}
           {activeFilter === 'repost' && 'Viewing reposts of your content.'}
           {activeFilter === 'internal_share' && 'Viewing content shared with you.'}
           {activeFilter === 'booking' && 'Viewing booking requests and updates.'}
           {activeFilter === 'wallet' && 'Viewing wallet transactions and balance updates.'}
           {activeFilter === 'escrow' && 'Viewing escrow release and status updates.'}
           {activeFilter === 'work' && 'Viewing hustle work related updates.'}
           {activeFilter === 'milestone' && 'Viewing project milestone completion alerts.'}
           {activeFilter === 'system' && 'Viewing important system and security alerts.'}
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
                 onClick={() => handleNotificationClick(n)}
                 className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${!n.is_read ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-transparent border-transparent opacity-60'}`}
               >
                  <div className="flex gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-white/5 border border-white/10' : 'bg-transparent border border-white/5'}`}>
                        {getIcon(n.type)}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="text-[11px] font-black uppercase tracking-tight italic">{getTitle(n.type, n.count, n.entity_id)}</h3>
                           <span className="text-[8px] font-bold text-white/20 uppercase whitespace-nowrap">{formatDistanceToNow(n.created_at)}</span>
                        </div>
                                <p className="text-[12px] font-medium text-white/60 leading-tight">
                                   {getDescription(n)}
                                </p>

                                {n.type === 'follow' && user && (
                                   <div className="mt-3">
                                     <FollowButton 
                                       targetUserId={n.actors[0].id} 
                                       size="sm"
                                     />
                                   </div>
                                )}

                                 {/* Dynamic Booking Actions */}
                                 {(n.type === 'booking_new' || n.type === 'milestone_delivered') && (
                                    <div className="mt-3">
                                       {(() => {
                                          const booking = n.entity_id ? (buyerOrders.find(b => b.id === n.entity_id) || sellerOrders.find(b => b.id === n.entity_id)) : null;
                                          const isPending = !booking || booking.status === 'pending';
                                          const isAccepted = booking?.status === 'accepted' || booking?.status === 'in_progress';
                                          const isRejected = booking?.status === 'rejected';

                                          if (n.type === 'booking_new' && isPending) {
                                             return (
                                                <div className="flex gap-2">
                                                   <button 
                                                      onClick={async (e) => {
                                                         e.stopPropagation();
                                                         const bookingId = n.entity_id;
                                                         if (bookingId) {
                                                            setIsProcessingId(n.id);
                                                            try {
                                                               await updateBookingStatus(bookingId, 'accepted');
                                                               await fetchBookings();
                                                               await fetchNotifications();

                                                               setToastType('success');
                                                               setToastMessage("Booking Accepted Successfully!");

                                                               setTimeout(() => {
                                                                  setIsProcessingId(null);
                                                                  setToastMessage(null);
                                                                  if (onOpenBookingDetail) {
                                                                     onOpenBookingDetail(bookingId);
                                                                  } else {
                                                                     onOpenEscrow?.(bookingId);
                                                                  }
                                                               }, 1500);
                                                            } catch (err: any) {
                                                               console.error("[NotificationCenter] Error accepting booking:", err);
                                                               setToastType('error');
                                                               setToastMessage(err.message || "Failed to accept booking.");
                                                               setTimeout(() => {
                                                                  setIsProcessingId(null);
                                                                  setToastMessage(null);
                                                               }, 3000);
                                                            }
                                                         }
                                                      }}
                                                      className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/20 hover:brightness-110 active:scale-95 transition-all"
                                                   >
                                                      Accept Booking
                                                   </button>
                                                   <button 
                                                      onClick={async (e) => {
                                                         e.stopPropagation();
                                                         const bookingId = n.entity_id;
                                                         if (bookingId) {
                                                            setIsProcessingId(n.id);
                                                            try {
                                                               await updateBookingStatus(bookingId, 'rejected');
                                                               await fetchBookings();
                                                               await fetchNotifications();
                                                               setToastType('success');
                                                               setToastMessage("Booking Declined successfully.");
                                                               setTimeout(() => {
                                                                  setIsProcessingId(null);
                                                                  setToastMessage(null);
                                                               }, 1500);
                                                            } catch (err: any) {
                                                               console.error("[NotificationCenter] Error declining booking:", err);
                                                               setToastType('error');
                                                               setToastMessage(err.message || "Failed to decline booking.");
                                                               setTimeout(() => {
                                                                  setIsProcessingId(null);
                                                                  setToastMessage(null);
                                                               }, 3000);
                                                            }
                                                         }
                                                      }}
                                                      className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                                   >
                                                      Decline
                                                   </button>
                                                </div>
                                             );
                                          } else if (n.type === 'booking_new' && (isAccepted || isRejected)) {
                                             return (
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                                                   <div className={`w-1.5 h-1.5 rounded-full ${isAccepted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`} />
                                                   <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                                      Request {isAccepted ? 'Accepted' : 'Declined'}
                                                   </span>
                                                </div>
                                             );
                                          } else if (n.type === 'milestone_delivered') {
                                             return (
                                                <button 
                                                   onClick={(e) => {
                                                      e.stopPropagation();
                                                      onOpenEscrow?.(n.entity_id || "");
                                                   }}
                                                   className="px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-primary/20 hover:brightness-110 active:scale-95 transition-all"
                                                >
                                                   Release Funds
                                                </button>
                                             );
                                          }
                                          return null;
                                       })()}
                                    </div>
                                 )}

                                 {n.type === 'booking_accepted' && (
                                    <div className="mt-3">
                                       <button className="w-full py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500/20 transition-all">
                                          <MessageSquare size={12} /> Message Client
                                       </button>
                                    </div>
                                 )}

                                 {n.actors.length > 0 && n.type !== 'system' && (
                          <div className="mt-3 flex items-center gap-2">
                             <div className="flex -space-x-2">
                                {n.actors.slice(0, 3).map((a, idx) => (
                                  <div key={idx} className="w-5 h-5 rounded-full border border-black bg-white/5 overflow-hidden">
                                     <img src={a.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.username}`} alt="user" />
                                  </div>
                                ))}
                             </div>
                             {n.actors.length > 3 && (
                               <span className="text-[8px] font-black uppercase tracking-widest text-white/20">+{n.actors.length - 3} others</span>
                             )}
                          </div>
                        )}
                     </div>
                     {!n.is_read && (
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
         <button onClick={() => markAllRead()} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors group">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">Mark all as processed</span>
         </button>
      </footer>

      <Toast 
        message={toastMessage || ""} 
        type={toastType} 
        isOpen={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />
    </div>
  );
}
