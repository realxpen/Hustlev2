import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users } from 'lucide-react';
import { useStoryViewerStore } from '../features/feed/stores/useStoryViewerStore';
import { useStoryStore } from '../features/feed/stores/useStoryStore';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { useLiveStoryStore } from '../features/feed/stores/useLiveStoryStore';

export default function StoryViewer() {
  const { 
    isOpen, storiesQueue, activeStoryIndex, progressMap, isPaused, activeUserId,
    closeStoryViewer, nextStory, prevStory, updateProgress, setPaused, nextUser, prevUser
  } = useStoryViewerStore();
  
  const { markViewed, groupedStories } = useStoryStore();
  const { user, profile: authProfile } = useAuthStore();

  const touchStartX = useRef<number | null>(null);

  const currentStory = storiesQueue[activeStoryIndex];
  const boostedStories = useStoryStore(state => state.boostedStories);
  const isBoosted = currentStory ? boostedStories.includes(currentStory.id) : false;
  const activeGroup = groupedStories.find(g => g.userId === activeUserId);
  const profile = activeGroup?.profile;

  const {
    activeViewers,
    viewerCount,
    liveReactions,
    joinStoryPresence,
    leaveStoryPresence,
    reactToStory,
    sendStoryReply,
    subscribeToReplies,
    cleanupAllSubscriptions
  } = useLiveStoryStore();

  const [replyMessage, setReplyMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showViewersPopup, setShowViewersPopup] = useState(false);

  const duration = 5000;
  const currentProgress = currentStory ? (progressMap[currentStory.id] || 0) : 0;
  const remainingSeconds = Math.max(0, Math.ceil((duration * (100 - currentProgress)) / 1000));

  // Derive active items
  const currentViewers = currentStory ? (activeViewers[currentStory.id] || []) : [];
  const currentViewerCount = currentStory ? (viewerCount[currentStory.id] || 0) : 0;
  const activeStoryReactions = currentStory ? (liveReactions[currentStory.id] || []) : [];


  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || !user) return;

    markViewed(currentStory.id, user.id);
    
    // Track story impression
    useStoryStore.getState().trackStoryEvent(currentStory.id, 'impression');

    const intervalTime = 50; 
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      const localProgress = useStoryViewerStore.getState().progressMap[currentStory.id] || 0;
      if (localProgress + step >= 100) {
         updateProgress(currentStory.id, 100);
         clearInterval(timer);
         useStoryStore.getState().trackStoryEvent(currentStory.id, 'completion');
         nextStory();
      } else {
         const newProgress = localProgress + step;
         updateProgress(currentStory.id, newProgress);

         // Track views once progress crosses 50%
         if (localProgress < 50 && newProgress >= 50) {
           useStoryStore.getState().trackStoryEvent(currentStory.id, 'view');
         }
      }
    }, intervalTime);
    
    // Preload next story media
    if (activeStoryIndex < storiesQueue.length - 1) {
       const nextStoryData = storiesQueue[activeStoryIndex + 1];
       if (nextStoryData?.media_url) {
          if (nextStoryData.media_type === 'image') {
             const img = new Image();
             img.src = nextStoryData.media_url;
          } else if (nextStoryData.media_type === 'video') {
             const link = document.createElement('link');
             link.rel = 'preload';
             link.as = 'video';
             link.href = nextStoryData.media_url;
             document.head.appendChild(link);
          }
       }
    }

    return () => clearInterval(timer);
  }, [isOpen, currentStory?.id, isPaused, user?.id]); // exclude changing deps like progressMap

  // Handle live presence & cleanup dynamic subscriptions
  useEffect(() => {
    if (!isOpen || !currentStory || !user) return;

    // Join stories live presence stream
    joinStoryPresence(currentStory.id, user.id, (authProfile || {}) as any);

    // Dynamic subscription to comments / replies addressing the viewing user
    subscribeToReplies(user.id);

    return () => {
      // Leave old story presence on change/close
      leaveStoryPresence(currentStory.id);
    };
  }, [isOpen, currentStory?.id, user?.id, authProfile]);

  // Handle closing entire subscriptions on unmount
  useEffect(() => {
    if (!isOpen) {
      cleanupAllSubscriptions();
    }
  }, [isOpen]);

  const handleSendReaction = async (emoji: '❤️' | '🔥' | '😂' | '😮' | '👏') => {
    if (!user || !currentStory) return;
    await reactToStory(currentStory.id, emoji, user.id);
  };

  const handleSendReply = async () => {
    if (!user || !currentStory || !replyMessage.trim()) return;
    const receiverId = currentStory.user_id;
    const reply = await sendStoryReply(currentStory.id, user.id, receiverId, replyMessage);
    if (reply) {
      setReplyMessage('');
      setToastMessage('Reply sent to inbox!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent | React.PointerEvent) => {
    touchStartX.current = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.PointerEvent) => {
    setPaused(false);
    if (touchStartX.current === null) return;
    
    const touchEndX = ('changedTouches' in e) ? e.changedTouches[0].clientX : e.clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      nextUser();
    } else if (diff < -50) {
      prevUser();
    } else {
      // Tap is handled by the left/right div pointers
    }
    touchStartX.current = null;
  };

  const handleTouchCancel = () => {
    setPaused(false);
    touchStartX.current = null;
  };

  if (!isOpen || !currentStory || !profile) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center pointer-events-auto"
        onPointerDown={handleTouchStart}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchCancel}
        onPointerLeave={handleTouchCancel}
      >
         {/* Progress Bars */}
         <div className="absolute top-0 left-0 w-full pt-12 px-4 z-10 flex gap-1.5 pointer-events-none">
           {storiesQueue.map((story, i) => (
             <div key={story.id} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-white transition-all duration-75 ease-linear flex-1"
                 style={{ 
                   width: i === activeStoryIndex ? `${progressMap[story.id] || 0}%` : i < activeStoryIndex ? '100%' : '0%' 
                 }}
               />
             </div>
           ))}
         </div>

         {/* Header */}
         <div className="absolute top-14 left-4 right-4 flex justify-between items-center z-10 pointer-events-auto">
            <div className="flex items-center gap-2">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} className="w-8 h-8 rounded-full border border-white/20" alt="avatar" />
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-sm font-bold text-white shadow-sm">{profile.username || profile.full_name}</span>
                {isBoosted && (
                   <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded font-mono leading-none">
                     ⚡ Boosted
                   </span>
                )}
                <span className="text-[10px] text-white/60 font-medium">Expires in 24h</span>
              </div>
              <span className="text-xs font-semibold bg-black/50 text-blue-400 font-mono px-2 py-0.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {remainingSeconds}s
              </span>
            </div>
            <div className="flex items-center gap-2 pointer-events-auto">
               {/* Live Viewers Indicator */}
               {currentViewerCount > 0 && (
                 <div className="relative">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setShowViewersPopup(prev => !prev); }}
                     className="text-xs font-semibold bg-black/50 text-emerald-400 font-mono px-2.5 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1 cursor-pointer transition-all hover:bg-neutral-900 pointer-events-auto leading-none"
                   >
                      <Users size={12} className="animate-pulse" />
                      <span>{currentViewerCount} Watchers</span>
                   </button>

                   {/* Viewers Dropdown Popup */}
                   {showViewersPopup && currentViewers.length > 0 && (
                     <div className="absolute top-10 right-0 w-48 bg-black/95 border border-white/10 rounded-xl p-2 z-50 shadow-2xl backdrop-blur-lg flex flex-col gap-1.5 pointer-events-auto">
                       <div className="text-[10px] font-bold text-neutral-400 font-mono px-1">WATCHERS:</div>
                       <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                         {currentViewers.map((viewer) => (
                           <div key={viewer.user_id} className="flex items-center gap-1.5 hover:bg-white/5 p-1 rounded transition-colors text-white text-left">
                             <img src={viewer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.user_id}`} className="w-4 h-4 rounded-full border border-white/10" alt="" />
                             <span className="text-[10px] font-medium truncate flex-1 leading-none">{viewer.username}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}

               <button onClick={closeStoryViewer} className="p-2 bg-black/40 rounded-full backdrop-blur-md">
                  <X size={20} className="text-white" />
               </button>
            </div>
         </div>

         {/* Content Render (Placeholder logic for media) */}
         <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative select-none">
            {currentStory.media_type === 'image' && currentStory.media_url ? (
               <img src={currentStory.media_url} className="w-full h-full object-cover" alt="story" />
            ) : currentStory.media_type === 'video' && currentStory.media_url ? (
               <video src={currentStory.media_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
               <div className="p-6 text-center text-white bg-gradient-to-br from-zinc-800 to-black w-full h-full flex flex-col items-center justify-center">
                  <h1 className="text-2xl font-bold italic">{currentStory.caption || 'Story'}</h1>
               </div>
            )}
            
            {/* Floating Live Reactions Stream Overlay */}
            <div className="absolute inset-x-0 bottom-40 h-64 pointer-events-none z-30 overflow-hidden flex justify-center">
               <AnimatePresence>
                 {activeStoryReactions.map((react) => (
                   <motion.div
                     key={react.id}
                     initial={{ y: 220, x: (Math.random() - 0.5) * 120, scale: 0.6, opacity: 0 }}
                     animate={{ y: 0, x: (Math.random() - 0.5) * 180, scale: [1, 1.5, 1.3], opacity: [0, 1, 1, 0] }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 2.2, ease: "easeOut" }}
                     className="absolute text-3xl select-none"
                   >
                     {react.reaction_type}
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>

            {/* Subtle Real-time Social Toast Banner */}
            <AnimatePresence>
               {showToast && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.8, y: -10 }}
                   className="absolute bottom-20 z-[60] bg-emerald-500/95 border border-emerald-400 text-white font-semibold text-xs py-2 px-4 rounded-full shadow-lg backdrop-blur-md"
                 >
                   {toastMessage}
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Context/Caption */}
            {(currentStory.caption || currentStory.story_type !== 'general') && (
               <div className="absolute bottom-24 left-4 right-4 p-4 bg-black/60 backdrop-blur-md rounded-xl text-left pointer-events-auto">
                 {currentStory.story_type !== 'general' && (
                    <div className="text-[10px] uppercase font-bold text-[#FFD700] mb-1 tracking-wider">
                       {currentStory.story_type}
                    </div>
                 )}
                 <p className="text-sm text-white line-clamp-3">{currentStory.caption}</p>
                 {currentStory.linked_id && (
                    <button onClick={(e) => { e.stopPropagation(); useStoryStore.getState().trackConversion(currentStory.id, 'link_click'); }} className="mt-2 w-full py-2 bg-white text-black font-semibold rounded-lg text-xs">
                       View Details
                    </button>
                 )}
               </div>
            )}

            {/* Real-time Interaction Footbar */}
            <div className="absolute bottom-4 inset-x-4 flex items-center gap-2 z-40 pointer-events-auto">
               <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Send private reply..."
                    className="w-full bg-black/40 text-white text-xs px-4 py-2.5 rounded-full border border-white/10 outline-none focus:border-white/30 backdrop-blur-md placeholder-white/50"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                          handleSendReply();
                       }
                    }}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                  />
               </div>

               <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  {(['❤️', '🔥', '😂', '😮', '👏'] as const).map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendReaction(emoji)}
                      className="p-1 text-sm hover:scale-130 transition-transform active:scale-90 text-white/90 focus:outline-none"
                    >
                      {emoji}
                    </button>
                  ))}
               </div>
            </div>
            
            {/* Gesture Areas */}
            <div 
              className="absolute inset-y-20 left-0 w-1/3 z-20 pointer-events-auto" 
              onPointerUp={(e) => {
                e.stopPropagation();
                if (Math.abs(touchStartX.current! - (('changedTouches' in e) ? e.changedTouches[0].clientX : e.clientX)) < 10) {
                   prevStory();
                }
              }} 
            />
            <div 
              className="absolute inset-y-20 right-0 w-2/3 z-20 pointer-events-auto" 
              onPointerUp={(e) => {
                e.stopPropagation();
                if (Math.abs(touchStartX.current! - (('changedTouches' in e) ? e.changedTouches[0].clientX : e.clientX)) < 10) {
                   nextStory();
                }
              }} 
            />
         </div>
      </motion.div>
    </AnimatePresence>
  );
}
