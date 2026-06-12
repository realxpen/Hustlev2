import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, MessageSquare, User, PlusCircle, X, Search, Calendar, 
  Wallet, Bell, Phone, Play, ShoppingBag, Map as MapIcon, Home, Radio,
  Sparkles, Zap, ArrowRight, ChevronLeft, Briefcase, ShieldAlert
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../features/auth";
import { usePostActions } from "../features/feed/hooks/usePostActions";
import FeedCard from "./FeedCard";
import ProfilePage from "./ProfilePage";
import MyProfileHub from "./MyProfileHub";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import BookingsHub from "./BookingsHub";
import JobEscrowList from "./JobEscrowList";
import BookingDetail from "./BookingDetail";
import WalletHub from "./WalletHub";
import ActivityCenter from "./ActivityCenter";
import NearbyMap from "./NearbyMap";
import DiscoveryView from "./DiscoveryView";
import CreateMenu from "./CreateMenu";
import UploadFlow from "./UploadFlow";
import TrustCenter from "./TrustCenter";
import JourneyTracker from "./JourneyTracker";
import HustleFoundation from "./HustleFoundation";
import JobEscrowManager from "./JobEscrowManager";
import BookingFlow from "./BookingFlow";
import PaymentFlow from "./PaymentFlow";
import MainFeedHub from "./MainFeedHub";
import LiveCreatorStudio from "./LiveCreatorStudio";
import CreatorStudioDashboard from "./CreatorStudioDashboard";
import UnifiedCreatorFlow from "./UnifiedCreatorFlow";
import ServiceCreationFlow from "./ServiceCreationFlow";
import CallScreen, { CallInfo } from "./CallScreen";
import ChatHub from "./ChatHub";
import ConversationView from "./ConversationView";
import NotificationCenter from "./NotificationCenter";
import HustleAI from "./HustleAI";
import AdminGovernanceHub from "./AdminGovernanceHub";

import { useNotificationStore } from '../features/feed/stores/useNotificationStore';
import { useSocialGraphStore } from '../features/social/stores/useSocialGraphStore';
import { useChatStore } from '../features/chat/stores/useChatStore';
import { useRealtimeChat } from '../features/chat/hooks/useRealtimeChat';
import { useBookingStore } from '../features/bookings/stores/useBookingStore';
import { supabase } from '../lib/supabase';

export default function MockHome() {
  useRealtimeChat();
  const { fetchNotifications, subscribeToNotifications, unreadCount } = useNotificationStore();
  const { fetchRelationships, subscribeToRelationships } = useSocialGraphStore();

  const [showPrompt, setShowPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedHustler, setSelectedHustler] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<"home" | "live" | "wallet" | "profile">("home");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [isHustler, setIsHustler] = useState(false);
  const [selectedBookingForEscrow, setSelectedBookingForEscrow] = useState<any>(null);
  
  // Tab Memory - preserve scroll/state
  const [tabStore, setTabStore] = useState<Record<string, any>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadFlowOpen, setIsUploadFlowOpen] = useState(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isJobEscrowListOpen, setIsJobEscrowListOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [isFoundationOpen, setIsFoundationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<"for-you" | "live" | "nearby">("for-you");
  const [isCreatorStudioOpen, setIsCreatorStudioOpen] = useState(false);
  const [isCreatorFlowOpen, setIsCreatorFlowOpen] = useState(false);
  const [isServiceCreationOpen, setIsServiceCreationOpen] = useState(false);
  const [initialFlowType, setInitialFlowType] = useState<string | undefined>(undefined);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Mission State (Smart Contextual Persistence)
  const [activeMission, setActiveMission] = useState<any>(null);
  
  // Call State
  const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [showIncomingBanner, setShowIncomingBanner] = useState(false);

  // Financial Flow State
  const [activePayment, setActivePayment] = useState<any>(null);

  // Global Polish & System Glue
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminHubOpen, setIsAdminHubOpen] = useState(false);
  
  // Auth State
  const { session, profile, signOut } = useAuth();

  useEffect(() => {
    const handleOpenAdmin = () => setIsAdminHubOpen(true);
    window.addEventListener('open-admin-hub', handleOpenAdmin as EventListener);
    return () => window.removeEventListener('open-admin-hub', handleOpenAdmin as EventListener);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      subscribeToNotifications();
      fetchRelationships(session.user.id);
      subscribeToRelationships(session.user.id);
      useBookingStore.getState().fetchBookings();
    }
  }, [session?.user, fetchNotifications, subscribeToNotifications, fetchRelationships, subscribeToRelationships]);

  const { createPost } = usePostActions();
  const isLoggedIn = !!session;
  const hasCompletedOnboarding = true; // Handled by outer OnboardingGuard
  
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const handleSignUp = () => {
    // handled via AuthScreen now, but we keep this stub just in case
  };

  const handleResetApp = async () => {
    localStorage.clear();
    await signOut();
    window.location.reload();
  };

  // Sync Hustler status from Supabase Profile database field
  useEffect(() => {
    if (profile) {
      setIsHustler(!!profile.is_hustler);
    }
  }, [profile]);

  // Simulated Incoming Call after initial mount
  useEffect(() => {
    if (isLoggedIn && hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        if (!activeCall) setShowIncomingBanner(true);
      }, 15000); 
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, hasCompletedOnboarding]);

  const handleAcceptCall = () => {
    setShowIncomingBanner(false);
    setActiveCall({
      id: "inc-1",
      name: "Alex J.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      mode: "video",
      context: {
        title: "Brand Collaboration",
        stage: "Discovery",
        price: "TBD"
      }
    });
    setIsCallMinimized(false);
  };

  // Booking Flow State
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [bookingHustler, setBookingHustler] = useState<any>(null);

  // Intent Bridge: Connect Discovery to Action
  const bridgeIntent = (hustler: any) => {
    setSelectedHustler(hustler);
    setActiveMission({
      id: `hustle-${hustler.id}`,
      step: "TRUST",
      context: hustler
    });
  };

  const advanceMission = () => {
    if (!activeMission) return;
    
    setIsGlobalLoading(true);
    setTimeout(() => {
      setIsGlobalLoading(false);
      if (activeMission.step === "TRUST") {
        // Move to chat
        setSelectedChat({ 
          id: activeMission.context.id, 
          name: activeMission.context.creator.name,
          lastMessage: "Let's talk about your project",
          time: "Now",
          unread: false,
          online: true
        });
        setIsChatOpen(true);
        setActiveMission({ ...activeMission, step: "INTENT" });
        setSelectedHustler(null); // Close profile if open
      } else if (activeMission.step === "INTENT") {
        setActiveNav("bookings");
        setActiveMission({ ...activeMission, step: "TRANSACTION" });
      } else if (activeMission.step === "TRANSACTION") {
        // Simulate booking completion
        setActiveNav("profile");
        setActiveMission({ ...activeMission, step: "OUTCOME" });
      } else {
        // Complete loop - Reputation evolved
        setActiveMission(null);
        // Trigger a subtle success toast/hint
        setShowHint(true);
      }
    }, 800);
  };

  useEffect(() => {
    // Delay prompts for in-feed flow feel
    const promptTimer = setTimeout(() => setShowPrompt(true), 1500);
    const hintTimer = setTimeout(() => setShowHint(true), 3000);
    
    return () => {
      clearTimeout(promptTimer);
      clearTimeout(hintTimer);
    };
  }, []);

  useEffect(() => {
    // Reset nav visibility when switching tabs
    setIsNavVisible(true);
    setLastScrollY(0);

    // Contextual Loading State for transition "feel"
    setIsGlobalLoading(true);
    const timer = setTimeout(() => setIsGlobalLoading(false), 600);

    // Sync state for overlays
    if (activeNav === "home") {
      setIsChatOpen(false);
    }

    return () => clearTimeout(timer);
  }, [activeNav]);

  const handleGlobalScroll = (e: any) => {
    const scrollPos = (e.currentTarget as HTMLDivElement).scrollTop;
    
    // Smooth threshold for hiding/showing
    if (scrollPos > lastScrollY && scrollPos > 80) {
      if (isNavVisible) setIsNavVisible(false);
    } else if (scrollPos < lastScrollY - 5) {
      if (!isNavVisible) setIsNavVisible(true);
    }
    setLastScrollY(scrollPos);

    if (activeNav === "home") {
      const height = (e.currentTarget as HTMLDivElement).offsetHeight;
      const index = Math.round(scrollPos / height);
      setActiveIndex(index);
      if (showHint && index > 0) setShowHint(false);
    }
  };

  // Tab Order for Gestures
  const TABS = ["home", "live", "wallet", "profile"] as const;

  const handleTabChange = (dir: "left" | "right") => {
    const currentIndex = TABS.indexOf(activeNav);
    let nextIndex = currentIndex + (dir === "left" ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < TABS.length) {
      setActiveNav(TABS[nextIndex]);
    }
  };

  return (
    <main className="fixed inset-0 bg-black text-white font-sans overflow-hidden selection:bg-brand-primary/30">
      {/* Account Suspended Interception Overlay */}
      {isLoggedIn && profile && (profile as any).is_suspended && (
        <div className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center p-6 text-white text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#0c0c0c] border border-red-500/20 rounded-[2rem] p-8 flex flex-col items-center gap-6"
          >
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
              <ShieldAlert size={48} />
            </div>
            
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-red-500">
                Account Suspended
              </h1>
              <p className="text-xs text-white/50 leading-relaxed">
                Your account (@{profile.username || 'hustler'}) has been suspended due to violations of our safety and community guidelines. This restriction cannot be bypassed.
              </p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left font-mono text-[9px] text-white/40 uppercase tracking-wider flex flex-col gap-2">
              <div>
                <span className="text-white/20">Status: </span>
                <span className="text-red-400 font-bold">Suspended</span>
              </div>
              <div>
                <span className="text-white/20">Restriction: </span>
                <span className="text-red-400">Write & Match Disabled</span>
              </div>
              <div>
                <span className="text-white/20">Ref Code: </span>
                <span>{profile.id.substring(0, 8)}...</span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full py-3.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 cursor-pointer"
            >
              Logout Securely
            </button>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* LANDING PAGE / SIGN UP FLOW */}
        {!isLoggedIn && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[400] bg-black flex flex-col overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-black to-blue-500/10 pointer-events-none" />
             <div className="noise-overlay opacity-[0.05] pointer-events-none" />
             
             <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-24 h-24 rounded-[2.5rem] bg-brand-primary flex items-center justify-center shadow-2xl shadow-brand-primary/40 mb-12"
                >
                   <Zap size={48} className="text-white fill-white" />
                </motion.div>

                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-center space-y-6 max-w-sm"
                >
                   <h1 className="text-6xl font-black italic tracking-tighter leading-[0.8] uppercase">
                      Hustle <br />
                      <span className="text-brand-primary">Harder.</span> <br />
                      Live.
                   </h1>
                   <p className="text-sm font-medium text-white/40 leading-relaxed">
                      The world's first live-first professional commerce platform. Start, scale, and secure your future.
                   </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full max-w-xs mt-16 space-y-4"
                >
                   <button 
                     onClick={handleSignUp}
                     className="w-full h-16 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] active-scale shadow-2xl transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
                   >
                      Join The Economy <PlusCircle size={18} />
                   </button>
                   <button 
                     onClick={handleSignUp}
                     className="w-full h-16 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] active-scale hover:bg-white/10 transition-all"
                   >
                      Log In
                   </button>
                   <button 
                     onClick={handleResetApp}
                     className="w-full py-2 text-[8px] font-black uppercase tracking-[0.4em] text-white/5 hover:text-white/20 transition-colors"
                   >
                      Reset System State
                   </button>
                </motion.div>
             </div>

             <footer className="p-8 text-center relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">© 2024 Hustle Technologies Inc.</p>
             </footer>
          </motion.div>
        )}

      </AnimatePresence>

      {/* MAIN APPLICATION FRAME */}
      {isLoggedIn && hasCompletedOnboarding && (
        <div
          className="h-screen w-full bg-black text-white relative overflow-hidden"
          id="home-screen"
        >
      <div className="grain-overlay pointer-events-none" />

      <AnimatePresence>
        {activeMission && (
          <JourneyTracker 
            mission={activeMission} 
            onClose={() => setActiveMission(null)}
            onNext={advanceMission}
          />
        )}
      </AnimatePresence>
      
      {/* Header Overlay - Minimal & Translucent */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 pt-12 pb-6 bg-gradient-to-b from-black/80 via-black/20 to-transparent transition-all duration-500 ${!isNavVisible || activeNav === "profile" ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse shadow-glow ${activeNav === 'home' ? 'bg-brand-primary' : activeNav === 'live' ? 'bg-red-500' : activeNav === 'wallet' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
          <h2 
            onClick={() => setIsFoundationOpen(true)}
            className="text-xl font-display font-black tracking-[0.2em] pointer-events-auto cursor-pointer hover:text-brand-primary transition-colors flex items-center gap-2"
          >
            HUSTLE
          </h2>
          <button
              onClick={() => setIsAIOpen(true)}
              className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-colors border border-brand-primary/30 pointer-events-auto"
          >
             <Sparkles size={16} />
          </button>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={() => setIsJobEscrowListOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Briefcase size={22} className="text-white/80" />
          </button>
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Bell size={22} className="text-white/80" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full border-2 border-black bg-brand-primary flex items-center justify-center text-[8px] font-black font-mono">
                 {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5 overflow-hidden active-scale cursor-pointer" onClick={() => setActiveNav("profile")}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Me" className="w-full h-full rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <div className="h-full w-full">
        <AnimatePresence mode="wait">
          {activeNav === "home" && (
            <motion.div 
               key="home-view"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full w-full"
            >
              <MainFeedHub 
                bridgeIntent={bridgeIntent} 
                onOpenBookings={() => setActiveNav("bookings")} 
                onOpenActivity={() => setIsNotificationsOpen(true)}
                onOpenChat={() => setIsChatOpen(true)} 
                onOpenSearch={() => setIsSearchOpen(true)}
                unreadCount={unreadCount}
                onScroll={handleGlobalScroll}
                isNavVisible={isNavVisible}
                initialTab={activeFeedTab}
                onQuickBook={(data) => {
                  setActivePayment({
                    title: data.title,
                    hustler: data.creatorName || "Hustler",
                    amount: data.price,
                    escrowDays: 7,
                    sellerId: data.creatorId,
                    listingId: data.id,
                    listingType: data.type
                  });
                }}
              />
            </motion.div>
          )}

          {activeNav === "live" && (
            <motion.div 
               key="live-view"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full w-full"
            >
              <MainFeedHub 
                bridgeIntent={bridgeIntent} 
                onScroll={handleGlobalScroll}
                isNavVisible={isNavVisible}
                initialTab="live"
              />
            </motion.div>
          )}

          {activeNav === "bookings" && (
            <motion.div 
               key="bookings-view"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="h-full w-full bg-[#030303] flex items-center justify-center p-6"
            >
               <div className="absolute top-12 left-6 z-50">
                 <button onClick={() => setActiveNav("profile")} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white backdrop-blur-md">
                    <ChevronLeft size={20} />
                 </button>
               </div>
               <div className="w-full h-full max-h-[80vh] overflow-y-auto no-scrollbar pt-20 rounded-[3rem] bg-[#0c0c0c] border border-white/5 shadow-2xl px-6">
                 <div className="mb-8">
                   <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Workhub</h1>
                   <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-2">Manage your active contracts and escrow</p>
                 </div>
                 
                 <JobEscrowList 
                   onClose={() => setActiveNav("profile")}
                   onViewDetails={(booking) => setSelectedBooking(booking)}
                 />
               </div>
            </motion.div>
          )}

          {activeNav === "wallet" && (
            <motion.div 
               key="wallet-view"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="h-full w-full"
            >
              <WalletHub onClose={() => setActiveNav("home")} />
            </motion.div>
          )}

          {activeNav === "profile" && (
            <motion.div 
              key="profile-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full"
            >
              <MyProfileHub 
                isHustler={isHustler} 
                onHustlerModeChange={setIsHustler} 
                setActiveNav={(nav: any) => setActiveNav(nav)} 
                onOpenCreatorStudio={() => setIsCreatorStudioOpen(true)}
                onSignOut={() => handleResetApp()}
                onOpenBookingDetail={(booking) => setSelectedBooking(booking)}
                onOpenChat={(booking) => {
                  // Find or create conversation for this booking
                  const otherUserId = booking.buyer_id === session?.user?.id ? booking.seller_id : booking.buyer_id;
                  if (otherUserId) {
                    const existingChat = useChatStore.getState().conversations.find(c => 
                      c.otherParticipant?.id === otherUserId
                    );
                    if (existingChat) {
                      setSelectedChat(existingChat);
                    } else {
                      // Fallback: just open chat list if no direct conversation found
                      setActiveNav("home");
                      setIsChatOpen(true);
                    }
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Room Overlay */}
      <AnimatePresence>
        {selectedChat && (
          <ChatRoom 
            chat={selectedChat} 
            onBack={() => setSelectedChat(null)} 
            onOpenBooking={() => {
              // Now that we are real, we can bridge to profile using selectedChat directly
              setBookingHustler({
                id: selectedChat?.id,
                creator: { name: selectedChat?.name, avatar: selectedChat?.avatar }
              });
              setIsBookingFlowOpen(true);
            }}
            onOpenEscrow={(booking) => setSelectedBookingForEscrow(booking)}
            onStartCall={(mode) => {
              setActiveCall({
                id: selectedChat.id.toString(),
                name: selectedChat.name,
                avatar: selectedChat.avatar,
                isGroup: selectedChat.isGroup,
                mode: mode,
                context: {
                  title: "Active Booking Discussion",
                  stage: "Milestone 2",
                  price: "$2,400"
                }
              });
              setIsCallMinimized(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Soft Guided Hint Overlay */}
      <AnimatePresence>
        {showHint && activeNav === "feed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 px-6 py-3 rounded-full flex flex-col items-center gap-1 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Swipe up to discover</span>
              </div>
              <p className="text-[9px] text-white/40 tracking-widest uppercase">Real people • Real work</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav System - Dynamic & Alive */}
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ y: (isNavVisible && activeNav !== "wallet" && activeNav !== "bookings" && activeNav !== "profile") ? 0 : 120 }}
        transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
        className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-2 z-50 shadow-2xl"
      >
        {/* Deep Pulsing Background - Wrapped in clipped container to avoid clipping the floating button */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 opacity-20 transition-colors duration-1000 blur-3xl scale-150 pointer-events-none ${
            activeNav === 'home' ? 'bg-brand-primary' : 
            activeNav === 'live' ? 'bg-red-600' : 
            activeNav === 'wallet' ? 'bg-emerald-500' : 
            'bg-blue-500'
          }`} />
        </div>

        <button 
          onClick={() => setActiveNav("home")}
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-500 z-10 group ${activeNav === "home" ? 'text-brand-primary scale-110' : 'text-white/20 hover:text-white/60'}`}
        >
          <Home size={22} strokeWidth={activeNav === "home" ? 2.5 : 2} className={activeNav === "home" ? 'drop-shadow-glow-red' : ''} />
          <span className={`text-[8px] uppercase tracking-tighter font-black transition-all duration-300 ${activeNav === "home" ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>Home</span>
        </button>

        <button 
          onClick={() => setActiveNav("live")}
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-500 z-10 group ${activeNav === "live" ? 'text-red-500 scale-110' : 'text-white/20 hover:text-white/60'}`}
        >
          <div className="relative">
            <Radio size={22} strokeWidth={activeNav === "live" ? 2.5 : 2} className={activeNav === "live" ? 'drop-shadow-glow-red text-red-500' : ''} />
            <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-glow-red ${activeNav === 'live' ? 'opacity-100' : 'opacity-40'}`} />
          </div>
          <span className={`text-[8px] uppercase tracking-tighter font-black transition-all duration-300 ${activeNav === "live" ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>Live</span>
        </button>

        {/* Dynamic Global Create Hub - The "Smart" Centerpiece */}
        <div className="relative w-20 flex justify-center -mt-12 mr-[-2px] z-10">
          <div className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse opacity-40 transition-colors duration-1000 ${
            activeNav === 'home' ? 'bg-brand-primary' : 
            activeNav === 'live' ? 'bg-red-500' : 
            activeNav === 'wallet' ? 'bg-emerald-500' : 
            'bg-blue-500'
          }`} />
          <motion.button 
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCreateOpen(true)}
            className={`w-16 h-16 rounded-[1.75rem] flex flex-col items-center justify-center shadow-premium-deep border border-white/20 relative z-10 transition-all duration-500 bg-white group active-scale ${
              activeNav === 'live' ? 'hover:bg-red-500 hover:text-white' : 
              activeNav === 'wallet' ? 'hover:bg-emerald-500 hover:text-white' : 
              'hover:bg-brand-primary hover:text-white'
            } text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]`}
          >
            <PlusCircle size={24} className="group-hover:scale-110 transition-transform mb-0.5 text-brand-primary" />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-black uppercase tracking-tighter"
            >
              Create
            </motion.span>
          </motion.button>
        </div>

        <button 
          onClick={() => setActiveNav("wallet")}
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-500 z-10 group ${activeNav === "wallet" ? 'text-emerald-400 scale-110' : 'text-white/20 hover:text-white/60'}`}
        >
          <Wallet size={22} strokeWidth={activeNav === "wallet" ? 2.5 : 2} className={activeNav === "wallet" ? 'drop-shadow-glow-emerald text-emerald-400' : ''} />
          <span className={`text-[8px] uppercase tracking-tighter font-black transition-all duration-300 ${activeNav === "wallet" ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>Wallet</span>
        </button>

        <button 
          onClick={() => setActiveNav("profile")}
          className={`flex-1 flex flex-col items-center gap-1 transition-all duration-500 z-10 group ${activeNav === "profile" ? 'text-blue-400 scale-110' : 'text-white/20 hover:text-white/60'}`}
        >
          <User size={22} strokeWidth={activeNav === "profile" ? 2.5 : 2} className={activeNav === "profile" ? 'drop-shadow-glow-blue text-blue-400' : ''} />
          <span className={`text-[8px] uppercase tracking-tighter font-black transition-all duration-300 ${activeNav === "profile" ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>Profile</span>
        </button>

        {/* Floating Contextual Bubbles - Movable & Frictionless */}
        {isNavVisible && (
          <div className="fixed inset-0 pointer-events-none z-[45]">
            <AnimatePresence>
               {activeNav === "home" && (
                  <motion.button
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    initial={{ opacity: 0, x: 24, y: -128 }}
                    animate={{ opacity: 1, x: 24, y: -128 }}
                    exit={{ opacity: 0, x: 0, y: -128 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="absolute left-0 bottom-0 p-3 rounded-2xl glass-light border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 group hover:bg-emerald-500 transition-all active-scale ring-1 ring-white/5 pointer-events-auto cursor-grab active:cursor-grabbing"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <ShoppingBag size={16} className="text-emerald-500 group-hover:text-white" />
                    </div>
                    <div className="flex flex-col items-start pr-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white group-hover:text-white">Marketing</span>
                       <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60">Local Stall</span>
                    </div>
                  </motion.button>
               )}
            </AnimatePresence>



            <AnimatePresence>
               {activeNav === "home" && (
                  <motion.button
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    whileDrag={{ scale: 1.1, zIndex: 100 }}
                    initial={{ opacity: 0, x: -24, y: -128 }}
                    animate={{ opacity: 1, x: -24, y: -128 }}
                    exit={{ opacity: 0, x: 0, y: -128 }}
                    style={{ right: 0 }}
                    onClick={() => setIsMapOpen(true)}
                    className="absolute right-0 bottom-0 p-3 rounded-2xl glass-light border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 group hover:bg-brand-primary transition-all active-scale ring-1 ring-white/5 pointer-events-auto cursor-grab active:cursor-grabbing"
                  >
                    <div className="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <MapIcon size={16} className="text-brand-primary group-hover:text-white" />
                    </div>
                    <div className="flex flex-col items-start pr-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white group-hover:text-white">Nearby Map</span>
                       <span className="text-[7px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60">Live Radar</span>
                    </div>
                  </motion.button>
               )}
            </AnimatePresence>
          </div>
        )}
      </motion.nav>

      {/* Create Menu Overlay */}
      <CreateMenu 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onOptionSelect={(type) => {
          setIsCreateOpen(false);
          if (type === 'live') {
            setIsLiveStudioOpen(true);
          } else if (type === 'create_service') {
            setIsServiceCreationOpen(true);
          } else {
            setInitialFlowType(type);
            setIsCreatorFlowOpen(true);
          }
        }}
      />

      {/* Creator Studio Dashboard Overlay */}
      <AnimatePresence>
        {isCreatorStudioOpen && (
          <CreatorStudioDashboard 
            onClose={() => setIsCreatorStudioOpen(false)} 
            onLaunchCreator={(type) => {
               setInitialFlowType(type);
               setIsCreatorFlowOpen(true);
            }}
            onAction={async (action, payload) => {
              if (action === 'chat') {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  const convId = await useChatStore.getState().getOrCreateConversation(user.id, payload.userId);
                  setIsCreatorStudioOpen(false);
                  setActiveConversation({
                    id: convId,
                    name: 'Client',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.userId}`,
                    online: false,
                    otherParticipant: { id: payload.userId }
                  });
                } catch (err) {
                  console.error("Error starting chat from creator studio:", err);
                }
              } else if (action === 'manage_booking') {
                setIsCreatorStudioOpen(false);
                setSelectedBookingForEscrow(payload.booking);
              } else if (action === 'view_booking') {
                setIsCreatorStudioOpen(false);
                setSelectedBooking(payload.booking);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Service Creation Flow */}
      <AnimatePresence>
        {isServiceCreationOpen && (
          <ServiceCreationFlow
            onClose={() => setIsServiceCreationOpen(false)}
            onSuccess={(listing) => {
              setIsServiceCreationOpen(false);
              console.log("Published Service:", listing);
              // Handle success (could open profile tab)
            }}
          />
        )}
      </AnimatePresence>

      {/* Unified Creator Flow */}
      <AnimatePresence>
        {isCreatorFlowOpen && (
          <UnifiedCreatorFlow 
            initialType={initialFlowType}
            onClose={() => setIsCreatorFlowOpen(false)}
            onPublish={async (data) => {
              console.log("Published:", data);
              setIsCreatorFlowOpen(false);
              if (data.type === 'post') {
                let mediaType: 'image' | 'video' | 'none' = 'none';
                if (data.mediaFile) {
                  const type = data.mediaFile.type;
                  if (type.startsWith('image/')) {
                    mediaType = 'image';
                  } else if (type.startsWith('video/')) {
                    mediaType = 'video';
                  }
                }
                const caption = data.description || data.title || '';
                await createPost(caption, data.mediaFile || null, mediaType);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Live Creator Studio Overlay */}
      <AnimatePresence>
        {isLiveStudioOpen && (
          <LiveCreatorStudio onClose={() => setIsLiveStudioOpen(false)} />
        )}
      </AnimatePresence>

      {/* Upload Flow Overlay */}
      <AnimatePresence>
        {isUploadFlowOpen && (
          <UploadFlow 
            onClose={() => setIsUploadFlowOpen(false)}
            onSuccess={() => {
              setIsUploadFlowOpen(false);
              // In a real app, we'd refresh feed or show the post
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Real-time Call Banner */}
      <AnimatePresence>
        {showIncomingBanner && !activeCall && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-6 left-4 right-4 z-[120] bg-blue-500 text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                 <Phone size={18} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5">Incoming Collaboration</p>
                <p className="text-sm font-bold">Alex J. (Brand Strategist)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowIncomingBanner(false)}
                className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40"
              >
                <X size={16} />
              </button>
              <button 
                onClick={handleAcceptCall}
                className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center hover:bg-white/90 shadow-xl"
              >
                <Phone size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMapOpen && (
          <NearbyMap 
            onProfileSelect={(hustler) => { bridgeIntent(hustler); setIsMapOpen(false); }}
            onClose={() => setIsMapOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Profile Page Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <DiscoveryView 
              onProfileSelect={(hustler) => { bridgeIntent(hustler); setIsSearchOpen(false); }} 
              onOpenTrustCenter={() => setIsTrustOpen(true)}
              onScroll={() => {}}
              isNavVisible={true}
              onClose={() => setIsSearchOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHustler && (
          <ProfilePage 
            hustler={selectedHustler} 
            onBack={() => setSelectedHustler(null)} 
            onStartChat={async (targetUser) => {
              try {
                if (!session?.user?.id) return;
                const convId = await useChatStore.getState().getOrCreateConversation(session.user.id, targetUser.id);
                setSelectedHustler(null);
                setActiveConversation({
                  id: convId,
                  name: targetUser.full_name || targetUser.username || targetUser.name || 'Unknown Hustler',
                  avatar: targetUser.avatar_url || targetUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username || convId}`,
                  online: false,
                  otherParticipant: targetUser
                });
              } catch (err) {
                console.error("Error starting chat:", err);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Booking Detail Overlay */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetail 
            booking={selectedBooking} 
            onBack={() => setSelectedBooking(null)} 
            onMessage={async (userId) => {
              try {
                const companionId = userId;
                const convId = await useChatStore.getState().getOrCreateConversation(session?.user?.id || '', companionId);
                setSelectedBooking(null);
                setIsChatOpen(true);
                setActiveConversation({
                  id: convId,
                  name: 'User',
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${companionId}`,
                  online: false,
                  otherParticipant: { id: companionId }
                });
              } catch (chatErr) {
                console.error("Failed to start chat from BookingDetail:", chatErr);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Trust & Safety Center Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <ChatHub 
            onClose={() => { setIsChatOpen(false); setActiveNav("home"); }} 
            onOpenConversation={(chat) => setActiveConversation(chat)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeConversation && (
          <ConversationView 
            chat={activeConversation} 
            onClose={() => setActiveConversation(null)} 
            onManageBooking={(booking) => setSelectedBookingForEscrow(booking)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTrustOpen && (
          <TrustCenter onClose={() => setIsTrustOpen(false)} />
        )}
      </AnimatePresence>

      {/* Brand Foundation Overlay */}
      <AnimatePresence>
        {isFoundationOpen && (
          <HustleFoundation onClose={() => setIsFoundationOpen(false)} />
        )}
      </AnimatePresence>

      {/* Escrow Manager Overlay */}
      <AnimatePresence>
        {selectedBookingForEscrow && (
          <JobEscrowManager 
            booking={selectedBookingForEscrow} 
            isClient={selectedBookingForEscrow?.buyer_id === session?.user?.id}
            onClose={() => setSelectedBookingForEscrow(null)} 
            onViewDetails={(booking) => {
              setSelectedBookingForEscrow(null);
              setSelectedBooking(booking);
            }}
            onAcceptedRedirect={(booking) => {
              console.log("[MockHome] Redirecting user to booking detail page...");
              setSelectedBookingForEscrow(null);
              setSelectedBooking(booking);
            }}
            onMessage={(userId) => {
              // We need to find the profile to start a chat
              // For now, we can just trigger a chat start if we have enough info
              // or just close escrow and open chat list
              setSelectedBookingForEscrow(null);
              setIsChatOpen(true);
            }}
            onCall={(userId) => {
              setSelectedBookingForEscrow(null);
              setActiveCall({
                id: userId,
                name: "Connecting...",
                avatar: "",
                mode: "audio",
                context: { title: "Hustle Consultation" }
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isJobEscrowListOpen && (
           <JobEscrowList 
             onClose={() => setIsJobEscrowListOpen(false)}
             onViewDetails={(booking) => {
               setIsJobEscrowListOpen(false);
               setSelectedBooking(booking);
             }}
           />
        )}
      </AnimatePresence>

      {/* Global Call Overlay */}
      <AnimatePresence>
        {activeCall && (
          <CallScreen 
            call={activeCall} 
            isMinimized={isCallMinimized}
            onMinimize={() => setIsCallMinimized(true)}
            onRestore={() => setIsCallMinimized(false)}
            onEndCall={() => {
              setActiveCall(null);
              setIsCallMinimized(false);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Booking Flow Overlay */}
      <AnimatePresence>
        {isBookingFlowOpen && bookingHustler && (
          <BookingFlow 
            hustler={bookingHustler} 
            onClose={() => setIsBookingFlowOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Financial Checkout Overlay */}
      <AnimatePresence>
        {activePayment && (
          <PaymentFlow 
            bookingData={activePayment}
            onClose={() => setActivePayment(null)}
            onSuccess={() => {
              setActivePayment(null);
              setActiveNav("wallet"); // Navigate to wallet to see the escrow
            }}
          />
        )}
      </AnimatePresence>

      {/* Global Polish & System Glue Overlays */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationCenter 
            onClose={() => setIsNotificationsOpen(false)} 
            onOpenEscrow={async (id) => {
              const bState = useBookingStore.getState();
              let found = bState.buyerOrders.find(b => b.id === id) || bState.sellerOrders.find(b => b.id === id);
              if (!found) {
                const { data } = await supabase.from('bookings').select(`
                  *,
                  milestones(*)
                `).eq('id', id).single();
                if (data) {
                  const bId = data.buyer_id;
                  const sId = data.seller_id;
                  const profilesFetch = await supabase.from('profiles').select('*').in('id', [bId, sId].filter(Boolean));
                  const bProfile = profilesFetch.data?.find(p => p.id === bId) || {
                    full_name: "Client Profile",
                    avatar_url: null,
                    hustle_name: "client"
                  };
                  const sProfile = profilesFetch.data?.find(p => p.id === sId) || {
                    full_name: "Hustler Profile",
                    avatar_url: null,
                    hustle_name: "hustler",
                    primary_skill: null
                  };
                  found = {
                    ...data,
                    buyer: bProfile,
                    seller: sProfile
                  } as any;
                }
              }
              setSelectedBookingForEscrow(found || null);
              setIsNotificationsOpen(false);
            }}
            onOpenBookingDetail={async (id) => {
              const bState = useBookingStore.getState();
              let found = bState.buyerOrders.find(b => b.id === id) || bState.sellerOrders.find(b => b.id === id);
              if (!found) {
                const { data } = await supabase.from('bookings').select(`
                  *,
                  milestones(*)
                `).eq('id', id).single();
                if (data) {
                  const bId = data.buyer_id;
                  const sId = data.seller_id;
                  const profilesFetch = await supabase.from('profiles').select('*').in('id', [bId, sId].filter(Boolean));
                  const bProfile = profilesFetch.data?.find(p => p.id === bId) || {
                    full_name: "Client Profile",
                    avatar_url: null,
                    hustle_name: "client"
                  };
                  const sProfile = profilesFetch.data?.find(p => p.id === sId) || {
                    full_name: "Hustler Profile",
                    avatar_url: null,
                    hustle_name: "hustler",
                    primary_skill: null
                  };
                  found = {
                    ...data,
                    buyer: bProfile,
                    seller: sProfile
                  } as any;
                }
              }
              setSelectedBooking(found || null);
              setIsNotificationsOpen(false);
            }}
            onOpenChat={(userId) => {
              // handle opening chat list or specific chat
              setIsNotificationsOpen(false);
              setIsChatOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAIOpen && (
          <HustleAI 
            onClose={() => setIsAIOpen(false)} 
            currentContext={activeNav as any}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminHubOpen && (
          <AdminGovernanceHub onClose={() => setIsAdminHubOpen(false)} />
        )}
      </AnimatePresence>

      {/* Global Transition Overlay */}
      <AnimatePresence>
        {isGlobalLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm pointer-events-none flex items-center justify-center"
          >
             <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ x: '-100%' }}
                   animate={{ x: '100%' }}
                   transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                   className="w-full h-full bg-brand-primary shadow-[0_0_10px_rgba(255,51,102,0.8)]"
                />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    )}
    </main>
  );
}

