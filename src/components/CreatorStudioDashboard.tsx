import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Settings, TrendingUp, DollarSign, Eye, Users, 
  Video, Briefcase, ShoppingBag, Radio, Sparkles, 
  ChevronRight, Calendar, Clock, Edit3, Trash2, 
  ArrowUpRight, BarChart3, LayoutDashboard, Layers,
  Play, MessageSquare, Heart, Share2, MoreVertical, X,
  CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Zap, ShieldCheck, FileText
} from "lucide-react";
import { useCreatorStore } from '../features/feed/stores/useCreatorStore';
import { useAuth } from '../features/auth';
import { useBookingStore } from '../features/bookings/stores/useBookingStore';
import { Toast } from './HustleUI';

interface CreatorStudioDashboardProps {
  onClose: () => void;
  onLaunchCreator: (type?: string) => void;
  onAction?: (action: string, payload?: any) => void;
}

export default function CreatorStudioDashboard({ onClose, onLaunchCreator, onAction }: CreatorStudioDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'monetization'>('overview');
  const { fetchMyListings, myServices, myProducts, myTraining, myPosts, isLoading, toggleListingStatus, deleteListing, deletePost } = useCreatorStore();
  const { fetchSellerOrders, sellerOrders, isLoading: isBookingsLoading } = useBookingStore();
  const { profile } = useAuth();
  const isHustler = !!profile?.is_hustler;

  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleAcceptClick = async (booking: any) => {
    setIsAcceptingId(booking.id);
    try {
      console.log("[CreatorStudio] Accepting booking:", booking.id);
      await useBookingStore.getState().updateBookingStatus(booking.id, 'accepted');
      console.log("[CreatorStudio] Booking updated in store successfully.");

      await fetchSellerOrders();
      const updatedList = useBookingStore.getState().sellerOrders;
      const updatedBooking = updatedList.find(b => b.id === booking.id) || { ...booking, status: 'accepted' };

      setToastType('success');
      setToastMessage("Booking Accepted Successfully!");

      setTimeout(() => {
        setIsAcceptingId(null);
        setToastMessage(null);
        // Call parent action to redirect to booking details page after brief delay
        onAction?.('open_booking_detail', { booking: updatedBooking });
      }, 1500);

    } catch (err: any) {
      console.error("[CreatorStudio] Error accepting booking:", err);
      setToastType('error');
      setToastMessage(err.message || "Failed to accept booking.");
      setTimeout(() => {
        setIsAcceptingId(null);
        setToastMessage(null);
      }, 3000);
    }
  };

  useEffect(() => {
    if (isHustler) {
      fetchMyListings();
      fetchSellerOrders();
    }
  }, [fetchMyListings, fetchSellerOrders, isHustler]);

  if (!isHustler) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="w-24 h-24 rounded-[2rem] bg-brand-primary/20 flex items-center justify-center text-brand-primary mb-8 animate-pulse">
          <Zap size={48} className="fill-brand-primary" />
        </div>
        <h2 className="text-4xl font-display font-black tracking-tighter uppercase italic mb-4">Hustler Mode Required</h2>
        <p className="text-white/40 font-medium leading-relaxed max-w-xs mb-10">
          The Creator Studio is reserved for verified Hustlers. Apply now to start earning and managing your professional presence.
        </p>
        <button 
          onClick={onClose}
          className="w-full max-w-xs h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 shadow-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  const earnings = {
    total: sellerOrders.reduce((sum, b) => sum + (b.total_price || 0), 0),
    pending: sellerOrders.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.total_price || 0), 0),
    growth: 12
  };

  const drafts = [
    { id: 1, type: 'video', title: 'Morning Hustle Routine', date: '2h ago', preview: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200' },
    { id: 2, type: 'service', title: '1-on-1 Strategy Session', date: 'Yesterday', preview: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=200' },
  ];

  const allListings = [
    ...myServices.map(s => ({ ...s, type: 'service' })),
    ...myProducts.map(p => ({ ...p, type: 'product' })),
    ...myTraining.map(t => ({ ...t, type: 'training' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-primary/60 flex items-center justify-center shadow-glow-red">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic">Creator Studio</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="relative z-10 px-6 py-4 flex gap-6 border-b border-white/5 bg-black/20">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
          { id: 'content', label: 'Content & Drafts', icon: <Layers size={14} /> },
          { id: 'monetization', label: 'Monetization', icon: <DollarSign size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-2 relative transition-colors ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabStudio"
                className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-brand-primary shadow-glow-red"
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              {/* Earnings Card */}
              <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                  <BarChart3 className="text-white/5 w-24 h-24" strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Net Lifetime Earnings</p>
                  <div className="flex items-end gap-3 mb-6">
                    <h2 className="text-5xl font-display font-black tracking-tighter">${earnings.total.toLocaleString()}</h2>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold mb-2">
                      <TrendingUp size={16} />
                      <span className="text-xs">+{earnings.growth}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Pending Payout</p>
                      <p className="font-bold text-lg text-brand-primary">${earnings.pending.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center justify-center">
                      <button className="text-[9px] font-black uppercase tracking-widest text-white group-hover:text-brand-primary transition-colors flex items-center gap-2">
                        View Wallet <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Actions (Launchpad) */}
              <section>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onLaunchCreator('post')}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-brand-primary text-white shadow-premium group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
                    <Video size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">New Content</span>
                  </button>
                  <button 
                    onClick={() => onLaunchCreator('live')}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <Radio size={24} className="text-red-500 group-hover:scale-110 transition-transform animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Go Live</span>
                  </button>
                </div>
              </section>

              {/* Active Orders / New Bookings */}
              <section>
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Active Hustles</h3>
                  <div className="px-2 py-1 bg-blue-500/10 rounded-full">
                    <span className="text-[8px] font-black uppercase text-blue-400">{sellerOrders.length} Orders</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {sellerOrders.length === 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center">
                       <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">No active bookings yet</p>
                    </div>
                  )}
                  {sellerOrders.slice(0, 5).map((booking) => {
                    const parsedNotes = booking.parsedNotes || {};
                    const milestoneProgress = booking.milestones?.length > 0 
                      ? Math.round((booking.milestones.filter((m: any) => m.status === 'released').length / booking.milestones.length) * 100)
                      : 0;
                    
                    return (
                      <div key={booking.id} className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] flex flex-col gap-5 group hover:bg-white/[0.08] transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-3xl rounded-full" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-lg">
                              <img src={booking.buyer?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.buyer_id}`} alt="Buyer" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black uppercase tracking-tight">{booking.buyer?.hustle_name || booking.buyer?.full_name || 'Client'}</h4>
                                {booking.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping" />}
                              </div>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{booking.listing_type} Engagement</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            booking.status === 'accepted' || booking.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}>
                            {booking.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                           <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5">
                              <span className="text-[8px] font-black uppercase text-white/30 block mb-1">Contract Budget</span>
                              <span className="text-sm font-black text-white">₦{(booking.total_price || 0).toLocaleString()}</span>
                           </div>
                           <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5">
                              <span className="text-[8px] font-black uppercase text-white/30 block mb-1">Progress</span>
                              <div className="flex items-center gap-2">
                                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${milestoneProgress}%` }} />
                                 </div>
                                 <span className="text-[9px] font-black text-emerald-400">{milestoneProgress}%</span>
                              </div>
                           </div>
                        </div>

                        {parsedNotes.client_note && booking.status === 'pending' && (
                           <p className="text-[10px] text-white/60 font-medium italic line-clamp-2 px-1">
                              "{parsedNotes.client_note}"
                           </p>
                        )}
                                               <div className="flex flex-wrap gap-2 w-full relative z-10">
                           {booking.status === 'pending' ? (
                             <div className="flex gap-2 w-full">
                               <button 
                                  onClick={() => onAction?.('view_booking', { booking })}
                                  className="flex-1 h-12 bg-white text-black rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                               >
                                  <FileText size={16} /> Review & Accept
                               </button>
                               <button 
                                  onClick={() => onAction?.('chat', { userId: booking.buyer_id, bookingId: booking.id })}
                                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all">
                                  <MessageSquare size={16} />
                               </button>
                             </div>
                           ) : (
                               <div className="flex flex-col gap-2 w-full">
                                 <div className="flex gap-2 w-full">
                                   <button 
                                      onClick={() => onAction?.('view_booking', { booking })}
                                      className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                      <FileText size={14} /> Details
                                   </button>
                                   <button 
                                      onClick={() => onAction?.('manage_booking', { booking })}
                                      className="flex-1 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95">
                                      <ShieldCheck size={14} /> Open Escrow
                                   </button>
                                 </div>
                                 <div className="flex gap-2 w-full">
                                    <button 
                                       onClick={() => onAction?.('chat', { userId: booking.buyer_id, bookingId: booking.id })}
                                       className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                       <MessageSquare size={14} /> Open Chat
                                    </button>
                                    {(booking.status === 'accepted' || booking.status === 'in_progress') && (
                                       <button 
                                          onClick={() => onAction?.('view_booking', { booking, tab: 'tracking' })}
                                          className="flex-1 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500/20">
                                          <Zap size={14} /> Deliver Work
                                       </button>
                                    )}
                                 </div>
                               </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {sellerOrders.length > 3 && (
                    <button className="text-center py-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                      View all orders
                    </button>
                  )}
                </div>
              </section>

              {/* Recent Performance Stats */}
              <section>
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Global Reach</h3>
                  <button className="text-[9px] font-bold text-brand-primary uppercase">Details</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Content', value: myPosts.length.toString(), icon: <Eye size={14} />, color: 'text-blue-400' },
                    { label: 'Listings', value: (myServices.length + myProducts.length + myTraining.length).toString(), icon: <Briefcase size={14} />, color: 'text-purple-400' },
                    { label: 'Clicks', value: '890', icon: <ArrowUpRight size={14} />, color: 'text-brand-primary' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-2">
                      <div className={`${stat.color} opacity-40`}>{stat.icon}</div>
                      <span className="text-md font-black tracking-tighter">{stat.value}</span>
                      <span className="text-[8px] font-black uppercase text-white/30">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Drafts Section */}
              <section>
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Active Content</h3>
                  <div className="px-2 py-1 bg-brand-primary/10 rounded-full">
                    <span className="text-[8px] font-black uppercase text-brand-primary">{myPosts.length} Live</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {myPosts.length === 0 && (
                    <p className="text-center py-6 text-[10px] text-white/20 uppercase tracking-widest">No published content found</p>
                  )}
                  {myPosts.map((post) => (
                    <div key={post.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-colors">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 relative shrink-0 shadow-lg">
                        {post.thumbnail_url || post.media_url || post.media?.[0]?.url ? (
                          <img src={post.thumbnail_url || post.media_url || post.media?.[0]?.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MessageSquare size={20} className="text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                           {post.media_type === 'video' && <Play size={20} className="text-white opacity-40 shadow-xl" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black uppercase truncate mb-1 tracking-tight">{post.caption || "No Caption"}</h4>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-white/30 uppercase">
                          <div className="flex items-center gap-1">
                            <Heart size={10} /> {post.likes_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare size={10} /> {post.comments_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Share2 size={10} /> {post.reposts_count || 0}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm('Delete this post permanently?')) {
                            deletePost(post.id);
                          }
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Drafts Section */}
              <section>
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Active Drafts</h3>
                  <div className="px-2 py-1 bg-brand-primary/10 rounded-full">
                    <span className="text-[8px] font-black uppercase text-brand-primary">2 Pending</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-colors">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 relative shrink-0 shadow-lg">
                        <img src={draft.preview} alt={draft.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {draft.type === 'video' ? <Play size={20} className="text-white opacity-40" /> : <Edit3 size={20} className="text-white opacity-40" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black uppercase truncate mb-1 tracking-tight">{draft.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase">
                          <Clock size={10} />
                          <span>Edited {draft.date}</span>
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Scheduled Content */}
              <section>
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Scheduled Flow</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase mb-1">No content scheduled</h4>
                    <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px]">Keep your presence consistent by scheduling your content in advance.</p>
                  </div>
                  <button className="mt-2 text-[9px] font-black uppercase tracking-widest text-brand-primary">Schedule Now</button>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'monetization' && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-8"
            >
              {/* Listings Header */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                    <ShoppingBag size={24} />
                 </div>
                 <div>
                    <h5 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Monetization Active</h5>
                    <p className="text-xs text-white/60 leading-relaxed font-medium">Your listings are currently receiving global visibility.</p>
                 </div>
              </div>

              {/* Active Offerings */}
              <section>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Active Listings</h3>
                  <button 
                    onClick={() => onLaunchCreator('service')}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {isLoading && <p className="text-center text-xs text-white/40">Syncing Marketplace...</p>}
                  {!isLoading && allListings.length === 0 && (
                    <div className="text-center py-10 opacity-30">
                      <Briefcase size={40} className="mx-auto mb-4" />
                      <p className="text-xs uppercase font-black tracking-widest leading-loose">
                        No listings found.<br />
                        Start your hustle ecosystem.
                      </p>
                    </div>
                  )}
                  {allListings.map((listing: any) => (
                    <div key={`${listing.type}-${listing.id}`} className={`bg-white/5 border p-4 rounded-[2rem] flex items-center justify-between group transition-all ${listing.is_active ? 'border-white/5 hover:border-white/20' : 'border-red-500/20 opacity-60'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${listing.type === 'service' ? 'bg-blue-500/10 text-blue-400' : listing.type === 'product' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {listing.type === 'service' ? <Briefcase size={20} /> : listing.type === 'product' ? <ShoppingBag size={20} /> : <Play size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-black uppercase tracking-tight truncate max-w-[150px]">{listing.title || listing.name}</h4>
                            {!listing.is_active && (
                              <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[7px] font-black uppercase">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-white/60">${listing.base_price || listing.price || 0}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="text-[10px] font-black uppercase text-brand-primary">
                              {listing.type === 'training' ? ' Academy' : listing.type === 'product' ? ' Stall' : ' Skill'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleListingStatus(listing.type, listing.id, listing.is_active)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${listing.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-white/20 hover:bg-white/10'}`}
                          title={listing.is_active ? "Deactivate" : "Activate"}
                        >
                          {listing.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                        <button 
                           onClick={() => {
                             if (confirm(`Delete this ${listing.type}?`)) {
                               deleteListing(listing.type, listing.id);
                             }
                           }}
                           className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Monetization Hints */}
              <section className="bg-brand-primary/5 border border-brand-primary/10 p-6 rounded-[2rem]">
                <h4 className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-3">Hustle AI Tip</h4>
                <p className="text-xs text-white/60 leading-relaxed font-medium italic">
                  "Creators who link training modules to their services see a 45% higher conversion rate in this category."
                </p>
                <button className="mt-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Browse Marketplace Trends</button>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Bottom Bar with Stats Summary */}
      <div className="px-6 py-6 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center safe-bottom">
        <div className="flex -space-x-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-black overflow-hidden relative">
              <div className="w-full h-full bg-brand-primary/20 flex items-center justify-center">
                <Heart size={8} className="text-brand-primary" />
              </div>
            </div>
          ))}
          <div className="w-6 h-6 rounded-full border-2 border-black bg-white/10 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white/60">+12</span>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Current Active Live Session</p>
           <div className="flex items-center gap-2 justify-end">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-glow-red" />
              <span className="text-xs font-black tracking-tighter">1,240 REVENUE READY</span>
           </div>
        </div>
      </div>

      <Toast 
        message={toastMessage || ""} 
        type={toastType} 
        isOpen={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />
    </div>
  );
}

