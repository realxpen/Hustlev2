import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  MessageSquare,
  User,
  PlusCircle,
  X,
  Search,
  Calendar,
  Wallet,
  Bell,
  Phone,
  Play,
  ShoppingBag,
  Map as MapIcon,
  Home,
  Radio,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";
import FeedCard from "../../components/FeedCard";
import ProfilePage from "../../components/ProfilePage";
import MyProfileHub from "../../components/MyProfileHub";
import ChatList from "../../components/ChatList";
import ChatRoom from "../../components/ChatRoom";
import BookingsHub from "../../components/BookingsHub";
import BookingDetail from "../../components/BookingDetail";
import WalletHub from "../../components/WalletHub";
import ActivityCenter from "../../components/ActivityCenter";
import NearbyMap from "../../components/NearbyMap";
import DiscoveryView from "../../components/DiscoveryView";
import CreateMenu from "../../components/CreateMenu";
import UploadFlow from "../../components/UploadFlow";
import TrustCenter from "../../components/TrustCenter";
import JourneyTracker from "../../components/JourneyTracker";
import HustleFoundation from "../../components/HustleFoundation";
import JobEscrowManager from "../../components/JobEscrowManager";
import BookingFlow from "../../components/BookingFlow";
import PaymentFlow from "../../components/PaymentFlow";
import MainFeedHub from "../../components/MainFeedHub";
import LiveCreatorStudio from "../../components/LiveCreatorStudio";
import CreatorStudioDashboard from "../../components/CreatorStudioDashboard";
import UnifiedCreatorFlow from "../../components/UnifiedCreatorFlow";
import CallScreen from "../../components/CallScreen";
import ChatHub from "../../components/ChatHub";
import ConversationView from "../../components/ConversationView";
import NotificationCenter from "../../components/NotificationCenter";
import HustleAI from "../../components/HustleAI";
import OnboardingFlow from "../../components/OnboardingFlow";
import { MOCK_CHATS } from "../chat/data/mockChats";
import { MOCK_HUSTLERS } from "./data/mockHustlers";
import { useMockHomeController } from "./hooks/useMockHomeController";

export default function MockHome() {
  const {
    showPrompt,
    showHint,
    activeIndex,
    selectedHustler,
    setSelectedHustler,
    selectedBooking,
    setSelectedBooking,
    activeNav,
    setActiveNav,
    selectedChat,
    setSelectedChat,
    isChatOpen,
    setIsChatOpen,
    activeConversation,
    setActiveConversation,
    isHustler,
    setIsHustler,
    selectedBookingForEscrow,
    setSelectedBookingForEscrow,
    tabStore,
    setTabStore,
    isCreateOpen,
    setIsCreateOpen,
    isUploadFlowOpen,
    setIsUploadFlowOpen,
    isLiveStudioOpen,
    setIsLiveStudioOpen,
    isActivityOpen,
    setIsActivityOpen,
    isTrustOpen,
    setIsTrustOpen,
    isFoundationOpen,
    setIsFoundationOpen,
    isSearchOpen,
    setIsSearchOpen,
    isMapOpen,
    setIsMapOpen,
    activeFeedTab,
    setActiveFeedTab,
    isCreatorStudioOpen,
    setIsCreatorStudioOpen,
    isCreatorFlowOpen,
    setIsCreatorFlowOpen,
    initialFlowType,
    setInitialFlowType,
    isNavVisible,
    activeMission,
    advanceMission,
    activeCall,
    setActiveCall,
    isCallMinimized,
    setIsCallMinimized,
    showIncomingBanner,
    setShowIncomingBanner,
    activePayment,
    setActivePayment,
    isAIOpen,
    setIsAIOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isLoggedIn,
    hasCompletedOnboarding,
    isGlobalLoading,
    handleSignUp,
    handleOnboardingComplete,
    handleResetApp,
    handleAcceptCall,
    isBookingFlowOpen,
    setIsBookingFlowOpen,
    bookingHustler,
    setBookingHustler,
    bridgeIntent,
    handleGlobalScroll,
    setActiveMission,
    signOut,
  } = useMockHomeController();

  return (
    <main className="fixed inset-0 bg-black text-white font-sans overflow-hidden selection:bg-brand-primary/30">
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

        {/* ONBOARDING FLOW */}
        {isLoggedIn && !hasCompletedOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
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
            className="text-xl font-display font-black tracking-[0.2em] pointer-events-auto cursor-pointer hover:text-brand-primary transition-colors"
          >
            HUSTLE
          </h2>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Bell size={22} className="text-white/80" />
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-black ${activeNav === 'live' ? 'bg-red-500 animate-pulse' : 'bg-brand-primary'}`} />
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
                MOCK_HUSTLERS={MOCK_HUSTLERS} 
                bridgeIntent={bridgeIntent} 
                onOpenBookings={() => setActiveNav("profile")} 
                onOpenActivity={() => setIsActivityOpen(true)}
                onOpenChat={() => setIsChatOpen(true)} 
                onOpenSearch={() => setIsSearchOpen(true)}
                onScroll={handleGlobalScroll}
                isNavVisible={isNavVisible}
                initialTab={activeFeedTab}
                onQuickBook={(hustler) => {
                  setActivePayment({
                    title: hustler.detailData?.title || "Custom Service",
                    hustler: hustler.creator.name,
                    amount: hustler.embedCTA.price || 500,
                    escrowDays: 7
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
                MOCK_HUSTLERS={MOCK_HUSTLERS} 
                bridgeIntent={bridgeIntent} 
                onScroll={handleGlobalScroll}
                isNavVisible={isNavVisible}
                initialTab="live"
              />
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
                onSignOut={signOut}
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
              const hustlerId = selectedChat?.id;
              const hustler = hustlerId ? MOCK_HUSTLERS.find(h => h.id === hustlerId) : undefined;
              if (hustler) {
                setBookingHustler(hustler);
                setIsBookingFlowOpen(true);
              }
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
        {showHint && activeNav === "home" && (
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
        animate={{ y: isNavVisible ? 0 : 120 }}
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
            <PlusCircle size={24} className="group-hover:scale-110 transition-transform mb-0.5" />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={activeNav}
              className="text-[7px] font-black uppercase tracking-tighter"
            >
              {activeNav === 'home' ? 'Post' : 
               activeNav === 'live' ? 'Studio' :
               activeNav === 'wallet' ? 'Add' :
               'Hustle'}
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

            {/* Smart Contextual AI Button - Draggable */}
            <motion.button
              drag
              dragConstraints={{ left: -150, right: 150, top: -400, bottom: 50 }}
              dragElastic={0.05}
              whileDrag={{ scale: 1.1, rotate: 5 }}
              initial={{ scale: 0, x: -7, y: -128 }}
              animate={{ scale: 1, x: -7, y: -128 }}
              style={{ left: '50%', transform: 'translateX(-50%)' }}
              onClick={() => setIsAIOpen(true)}
              className="absolute bottom-0 w-14 h-14 rounded-[1.25rem] bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-brand-primary/40 active-scale border border-white/10 pointer-events-auto group overflow-hidden cursor-grab active:cursor-grabbing"
            >
               <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
               <Sparkles size={24} />
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center border-2 border-brand-primary">
                  <div className="w-1 h-1 bg-brand-primary rounded-full animate-ping" />
               </div>
            </motion.button>

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
          />
        )}
      </AnimatePresence>

      {/* Unified Creator Flow */}
      <AnimatePresence>
        {isCreatorFlowOpen && (
          <UnifiedCreatorFlow 
            initialType={initialFlowType}
            onClose={() => setIsCreatorFlowOpen(false)}
            onPublish={(data) => {
              console.log("Published:", data);
              setIsCreatorFlowOpen(false);
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
          />
        )}
      </AnimatePresence>

      {/* Booking Detail Overlay */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetail 
            booking={selectedBooking} 
            onBack={() => setSelectedBooking(null)} 
          />
        )}
      </AnimatePresence>

      {/* Activity / Notification Center Overlay */}
      <AnimatePresence>
        {isActivityOpen && (
          <ActivityCenter 
            onClose={() => setIsActivityOpen(false)} 
            onAction={(action, payload) => {
              if (action === 'wallet') setActiveNav('wallet');
              if (action === 'bookings') setActiveNav('bookings');
              if (action === 'chat') {
                setIsChatOpen(true);
                if (payload?.chatId) {
                  const targetChat = MOCK_CHATS.find(c => c.id === payload.chatId);
                  if (targetChat) setSelectedChat(targetChat);
                }
              }
              if (action === 'call_incoming') {
                handleAcceptCall();
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
            onClose={() => setSelectedBookingForEscrow(null)} 
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
          <NotificationCenter onClose={() => setIsNotificationsOpen(false)} />
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

