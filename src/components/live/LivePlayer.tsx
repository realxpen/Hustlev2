import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveStore } from '../../stores/useLiveStore';
import LiveOverlay from './LiveOverlay';

interface LivePlayerProps {
  sessionId: string;
  onClose: () => void;
}

export default function LivePlayer({ sessionId, onClose }: LivePlayerProps) {
  const { currentSession, joinSession, leaveSession, isLoading } = useLiveStore();

  useEffect(() => {
    joinSession(sessionId);
    return () => {
      leaveSession(sessionId);
    };
  }, [sessionId, joinSession, leaveSession]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Background Stream Layer (Mock Video) */}
      <div className="absolute inset-0 bg-zinc-900">
        {currentSession?.thumbnail_url ? (
          <img 
            src={currentSession.thumbnail_url} 
            className="w-full h-full object-cover opacity-60 blur-sm scale-110" 
            alt="stream background" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10">
             <div className="w-40 h-40 rounded-full border-2 border-white/20 animate-ping" />
          </div>
        )}
        
        {/* Main Video View (Mock) */}
        {!isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Overlay Interaction Layer */}
      <AnimatePresence>
        {currentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <LiveOverlay sessionId={sessionId} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black flex flex-col items-center justify-center gap-4"
          >
             <div className="w-12 h-12 border-2 border-white/10 border-t-brand-primary rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Entering Stream...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
