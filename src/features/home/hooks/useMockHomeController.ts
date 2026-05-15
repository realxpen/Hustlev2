import { useEffect, useState } from "react";
import type { CallInfo } from "../../../components/CallScreen";
import { PRIMARY_HOME_TABS, type ActiveMission, type HomeFeedTab, type HomeNav, type HomeNavigationDirection } from "../types";
import { useAppSession } from "./useAppSession";

export function useMockHomeController() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedHustler, setSelectedHustler] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<HomeNav>("home");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [isHustler, setIsHustler] = useState(false);
  const [selectedBookingForEscrow, setSelectedBookingForEscrow] = useState<any>(null);
  const [tabStore, setTabStore] = useState<Record<string, any>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadFlowOpen, setIsUploadFlowOpen] = useState(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [isFoundationOpen, setIsFoundationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<HomeFeedTab>("for-you");
  const [isCreatorStudioOpen, setIsCreatorStudioOpen] = useState(false);
  const [isCreatorFlowOpen, setIsCreatorFlowOpen] = useState(false);
  const [initialFlowType, setInitialFlowType] = useState<string | undefined>(undefined);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [activeCall, setActiveCall] = useState<CallInfo | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [showIncomingBanner, setShowIncomingBanner] = useState(false);
  const [activePayment, setActivePayment] = useState<any>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [bookingHustler, setBookingHustler] = useState<any>(null);

  const {
  user,
  login,
  logout,
  isAuthenticated,
} = useAppSession();

const isLoggedIn = isAuthenticated;
const hasCompletedOnboarding = true;

const handleSignUp = () => {
  setIsGlobalLoading(true);

  setTimeout(() => {
    login(
      {
        id: "1",
        name: "Ayomide",
        email: "test@hustle.com",
      },
      "demo-token"
    );

    setIsGlobalLoading(false);
  }, 1000);
};

 const handleOnboardingComplete = (data: any) => {
  console.log("Onboarding data:", data);

  setIsGlobalLoading(true);

  setTimeout(() => {
    setIsGlobalLoading(false);
    setActiveNav("home");
  }, 2000);
};

  const handleResetApp = () => {
    logout();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const signOut = () => {
    logout();
    setActiveNav("home");
    setIsChatOpen(false);
    setActiveConversation(null);
    setSelectedChat(null);
    setSelectedHustler(null);
  };

  useEffect(() => {
    if (!isLoggedIn || !hasCompletedOnboarding || activeCall) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowIncomingBanner(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [activeCall, hasCompletedOnboarding, isLoggedIn]);

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
        price: "TBD",
      },
    });
    setIsCallMinimized(false);
  };

  const bridgeIntent = (hustler: any) => {
    setSelectedHustler(hustler);
    setActiveMission({
      id: `hustle-${hustler.id}`,
      step: "TRUST",
      context: hustler,
    });
  };

  const advanceMission = () => {
    if (!activeMission) {
      return;
    }

    setIsGlobalLoading(true);
    setTimeout(() => {
      setIsGlobalLoading(false);

      if (activeMission.step === "TRUST") {
        setSelectedChat({
          id: activeMission.context.id,
          name: activeMission.context.creator.name,
          lastMessage: "Let's talk about your project",
          time: "Now",
          unread: false,
          online: true,
        });
        setIsChatOpen(true);
        setActiveMission({ ...activeMission, step: "INTENT" });
        setSelectedHustler(null);
        return;
      }

      if (activeMission.step === "INTENT") {
        setActiveNav("bookings");
        setActiveMission({ ...activeMission, step: "TRANSACTION" });
        return;
      }

      if (activeMission.step === "TRANSACTION") {
        setActiveNav("profile");
        setActiveMission({ ...activeMission, step: "OUTCOME" });
        return;
      }

      setActiveMission(null);
      setShowHint(true);
    }, 800);
  };

  useEffect(() => {
    const promptTimer = setTimeout(() => setShowPrompt(true), 1500);
    const hintTimer = setTimeout(() => setShowHint(true), 3000);

    return () => {
      clearTimeout(promptTimer);
      clearTimeout(hintTimer);
    };
  }, []);

  useEffect(() => {
    setIsNavVisible(true);
    setLastScrollY(0);
    setIsGlobalLoading(true);

    const timer = setTimeout(() => setIsGlobalLoading(false), 600);

    if (activeNav === "home") {
      setIsChatOpen(false);
    }

    return () => clearTimeout(timer);
  }, [activeNav]);

  const handleGlobalScroll = (event: any) => {
    const scrollPos = (event.currentTarget as HTMLDivElement).scrollTop;

    if (scrollPos > lastScrollY && scrollPos > 80) {
      if (isNavVisible) {
        setIsNavVisible(false);
      }
    } else if (scrollPos < lastScrollY - 5) {
      if (!isNavVisible) {
        setIsNavVisible(true);
      }
    }

    setLastScrollY(scrollPos);

    if (activeNav === "home") {
      const height = (event.currentTarget as HTMLDivElement).offsetHeight;
      const index = Math.round(scrollPos / height);
      setActiveIndex(index);
      if (showHint && index > 0) {
        setShowHint(false);
      }
    }
  };

  const handleTabChange = (direction: HomeNavigationDirection) => {
    const currentPrimaryNav = PRIMARY_HOME_TABS.find((tab) => tab === activeNav) ?? "home";
    const currentIndex = PRIMARY_HOME_TABS.indexOf(currentPrimaryNav);
    const nextIndex = currentIndex + (direction === "left" ? 1 : -1);

    if (nextIndex >= 0 && nextIndex < PRIMARY_HOME_TABS.length) {
      setActiveNav(PRIMARY_HOME_TABS[nextIndex]);
    }
  };

  return {
    isLoggedIn: isAuthenticated,
    activeCall,
    activeConversation,
    activeFeedTab,
    activeIndex,
    activeMission,
    activeNav,
    activePayment,
    advanceMission,
    bookingHustler,
    bridgeIntent,
    handleAcceptCall,
    handleGlobalScroll,
    handleOnboardingComplete,
    handleResetApp,
    handleSignUp,
    handleTabChange,
    hasCompletedOnboarding,
    initialFlowType,
    isAIOpen,
    isActivityOpen,
    isBookingFlowOpen,
    isCallMinimized,
    isChatOpen,
    isCreateOpen,
    isCreatorFlowOpen,
    isCreatorStudioOpen,
    isFoundationOpen,
    isGlobalLoading,
    isHustler,
    isLiveStudioOpen,
    isMapOpen,
    isNavVisible,
    isNotificationsOpen,
    isSearchOpen,
    isTrustOpen,
    isUploadFlowOpen,
    selectedBooking,
    selectedBookingForEscrow,
    selectedChat,
    selectedHustler,
    setActiveCall,
    setActiveConversation,
    setActiveFeedTab,
    setActiveNav,
    setActivePayment,
    setBookingHustler,
    setInitialFlowType,
    setIsAIOpen,
    setIsActivityOpen,
    setIsBookingFlowOpen,
    setIsCallMinimized,
    setIsChatOpen,
    setIsCreateOpen,
    setIsCreatorFlowOpen,
    setIsCreatorStudioOpen,
    setIsFoundationOpen,
    setIsHustler,
    setIsLiveStudioOpen,
    setIsMapOpen,
    setIsNotificationsOpen,
    setIsSearchOpen,
    setIsTrustOpen,
    setIsUploadFlowOpen,
    setSelectedBooking,
    setSelectedBookingForEscrow,
    setSelectedChat,
    setSelectedHustler,
    setActiveMission,
    setShowIncomingBanner,
    setTabStore,
    signOut,
    showHint,
    showIncomingBanner,
    showPrompt,
    tabStore,
  };
}
