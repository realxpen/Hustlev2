import { motion, AnimatePresence } from "motion/react";
import { Compass, MessageSquare, User, PlusCircle, X, Search, Calendar, Wallet, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import FeedCard from "./FeedCard";
import ProfilePage from "./ProfilePage";
import MyProfileHub from "./MyProfileHub";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import BookingsHub from "./BookingsHub";
import BookingDetail from "./BookingDetail";
import WalletHub from "./WalletHub";
import ActivityCenter from "./ActivityCenter";
import DiscoveryView from "./DiscoveryView";
import CreateMenu from "./CreateMenu";
import UploadFlow from "./UploadFlow";
import TrustCenter from "./TrustCenter";
import JourneyTracker from "./JourneyTracker";

const MOCK_HUSTLERS = [
  {
    id: 1,
    creator: {
      id: 1,
      name: "Marcus V.",
      avatar: "",
      category: "UI/UX Specialist",
      location: "2.4 miles away",
      rating: 4.9,
      jobs: 142,
      verified: true,
      active: true,
    },
    content: {
      type: "video" as const,
      thumbnail: "",
      caption: "Crafting a high-conversion landing page for a local startup. Speed and intent are everything. #DesignHustle #ProductDesign",
      hasMusic: true,
      musicTrack: "Grind Mindset - Lofi Trap Beats"
    },
    embedCTA: { type: "book" as const, label: "Book Sprint", price: 500 },
    recommendationReason: "Because you viewed Product Design"
  },
  {
    id: 2,
    creator: {
      id: 2,
      name: "Elena S.",
      avatar: "",
      category: "Streetwear Tailor",
      location: "0.8 miles away",
      rating: 5.0,
      jobs: 89,
      verified: true,
      active: false,
    },
    content: {
      type: "audio" as const,
      thumbnail: "",
      caption: "Talking through my process of upcycling vintage jackets into modern streetwear. Drop a comment if you want a custom piece.",
      hasMusic: true,
      musicTrack: "Elena's Voice Memo - Upcycling Process"
    },
    embedCTA: { type: "buy" as const, label: "Buy Custom Jacket", price: 120 },
    recommendationReason: "Trending in your area"
  },
  {
    id: 3,
    creator: {
      id: 3,
      name: "Jordan K.",
      avatar: "",
      category: "Motion Director",
      location: "5.1 miles away",
      rating: 4.8,
      jobs: 215,
      verified: true,
      active: true,
    },
    content: {
      type: "text" as const,
      thumbnail: "",
      caption: "The most underrated skill right now isn't coding, it's taste. Taste acts a filter for AI.",
    },
    repost: {
      by: "@design_junkie",
      thought: "Fact. Taste scales.",
    },
    embedCTA: { type: "apply" as const, label: "Join Mentorship" },
  },
  {
    id: 4,
    creator: {
      id: 4,
      name: "Solace Academy",
      avatar: "",
      category: "Bootcamp",
      location: "Online",
      rating: 0,
      jobs: 0,
      verified: true,
      active: false,
    },
    content: {
      type: "image" as const,
      thumbnail: "",
      caption: "Learn how to build full-stack marketplaces in 4 weeks. Next cohort starts Monday.",
      hasMusic: false,
    },
    isAd: true,
    embedCTA: { type: "apply" as const, label: "Enroll Now" },
  }
];

export default function MockHome() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedHustler, setSelectedHustler] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<"feed" | "profile" | "chat" | "bookings" | "search" | "wallet">("feed");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isHustler, setIsHustler] = useState(false);
  
  // Journey Lifecycle State
  const [activeMission, setActiveMission] = useState<{
    id: string;
    step: "DISCOVERY" | "TRUST" | "INTENT" | "TRANSACTION" | "OUTCOME";
    context: any;
  } | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadFlowOpen, setIsUploadFlowOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
      setActiveNav("chat");
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

  const handleFeedScroll = (e: any) => {
    const scrollPos = (e.currentTarget as HTMLDivElement).scrollTop;
    const height = (e.currentTarget as HTMLDivElement).offsetHeight;
    const index = Math.round(scrollPos / height);
    
    // Adaptive visibility: Hide nav bar when scrolling down, show when scrolling up
    if (scrollPos > lastScrollY && scrollPos > 100) {
      if (activeNav === "feed") setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
    setLastScrollY(scrollPos);

    setActiveIndex(index);
    if (showHint && index > 0) setShowHint(false);
  };

  return (
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
      <header className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 pt-12 pb-6 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-500 ${activeNav === "profile" || activeNav === "search" ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
        <h2 className="text-xl font-display font-black tracking-[0.2em] pointer-events-auto">HUSTLE</h2>
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={() => setActiveNav("search")}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <Search size={18} />
          </button>
          <button 
            onClick={() => setIsActivityOpen(true)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors relative"
          >
            <motion.div 
               animate={{ scale: [1, 1.3, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" 
            />
            <Bell size={18} />
          </button>
          <button 
            onClick={() => setActiveNav("profile")}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <User size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Areas */}
      <div className="h-full w-full">
        <AnimatePresence mode="wait">
          {activeNav === "feed" && (
            <motion.div 
               key="feed-view"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full w-full"
            >
              {/* Vertical Feed Container */}
              <div 
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                onScroll={handleFeedScroll}
              >
                {MOCK_HUSTLERS.map((hustler, idx) => (
                  <div key={idx} className="h-full w-full snap-start snap-always">
                    <FeedCard 
                      {...hustler} 
                      onProfileClick={() => bridgeIntent(hustler)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeNav === "search" && (
            <motion.div 
               key="search-view"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full w-full"
            >
              <DiscoveryView 
                onProfileSelect={(hustler) => bridgeIntent(hustler)} 
                onOpenTrustCenter={() => setIsTrustOpen(true)}
              />
            </motion.div>
          )}          {activeNav === "profile" && (
            <motion.div 
              key="profile-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full"
            >
               <MyProfileHub isHustler={isHustler} />
            </motion.div>
          )}

          {activeNav === "chat" && (
            <motion.div 
               key="chat-view"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full w-full"
            >
              <ChatList onChatSelect={(chat) => setSelectedChat(chat)} />
            </motion.div>
          )}

          {activeNav === "bookings" && (
            <motion.div 
               key="bookings-view"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="h-full w-full"
            >
              <BookingsHub onBookingSelect={(booking) => setSelectedBooking(booking)} />
            </motion.div>
          )}

          {activeNav === "wallet" && (
            <motion.div 
               key="wallet-view"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="h-full w-full"
            >
              <WalletHub />
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
              const hustler = MOCK_HUSTLERS.find(h => h.id === selectedChat.id);
              if (hustler) {
                setSelectedHustler(hustler);
                setSelectedChat(null);
                // We'll need to trigger the booking flow in the profile page
                // or move booking flow to a more global state.
                // For now, opening the profile is the first step.
              }
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

      {/* Bottom Nav */}
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ y: isNavVisible ? 0 : 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-6 right-6 h-16 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-around px-4 z-50"
      >
        <button 
          onClick={() => setActiveNav("feed")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeNav === "feed" ? 'text-white' : 'text-white/40'}`}
        >
          <Compass size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Home</span>
        </button>
        <button 
          onClick={() => setActiveNav("search")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeNav === "search" ? 'text-white' : 'text-white/40'}`}
        >
          <Search size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Search</span>
        </button>
        
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center -mt-10 shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transition-transform cursor-pointer relative z-10"
        >
          <PlusCircle size={24} />
        </button>

        <button 
          onClick={() => setActiveNav("bookings")}
          className={`flex flex-col items-center gap-1 transition-colors relative ${activeNav === "bookings" ? 'text-white' : 'text-white/40'}`}
        >
          {activeNav !== "bookings" && (
             <div className="w-2 h-2 rounded-full bg-blue-500 absolute -top-1" />
          )}
          <Calendar size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Jobs</span>
        </button>

        <button 
          onClick={() => setActiveNav("wallet")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeNav === "wallet" ? 'text-white' : 'text-white/40'}`}
        >
          <Wallet size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Wallet</span>
        </button>

        <button 
          onClick={() => setActiveNav("chat")}
          className={`flex flex-col items-center gap-1 transition-colors relative ${activeNav === "chat" ? 'text-white' : 'text-white/40'}`}
        >
          <motion.div 
             animate={{ scale: [1, 1.3, 1] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" 
          />
          <MessageSquare size={20} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Chat</span>
        </button>
      </motion.nav>

      {/* Create Menu Overlay */}
      <CreateMenu 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onOptionSelect={(type) => {
          setIsCreateOpen(false);
          setIsUploadFlowOpen(true);
        }}
      />

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

      {/* Profile Page Overlay */}
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
          <ActivityCenter onClose={() => setIsActivityOpen(false)} />
        )}
      </AnimatePresence>

      {/* Trust & Safety Center Overlay */}
      <AnimatePresence>
        {isTrustOpen && (
          <TrustCenter onClose={() => setIsTrustOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

