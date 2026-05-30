import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Users, CheckCircle2 } from 'lucide-react';
import { LiveSession } from '../../types/live';

interface LiveStreamCardProps {
  session: LiveSession;
  onClick: () => void;
  key?: string | number;
}

export function LiveStreamCard({ session, onClick }: LiveStreamCardProps) {
  const hostName = session.host_profiles?.hustle_name || session.host_profiles?.full_name || 'Hustler';
  const hostAvatar = session.host_profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.host_id}`;

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative w-40 min-w-[160px] aspect-[9/16] rounded-3xl overflow-hidden cursor-pointer group bg-zinc-900 border border-white/5"
    >
      {/* Thumbnail or Host Avatar fallback */}
      <div className="absolute inset-0">
        {session.thumbnail_url ? (
          <img src={session.thumbnail_url} className="w-full h-full object-cover" alt={session.title} />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center opacity-40">
             <Video size={40} className="text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
        <div className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg flex items-center gap-1">
          <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Live
        </div>
        <div className="bg-black/40 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
           <Users size={8} /> {session.current_viewers || 0}
        </div>
      </div>

      {/* Info */}
      <div className="absolute bottom-2 left-2 right-2">
         <h4 className="text-[10px] font-bold text-white line-clamp-2 leading-tight mb-2 drop-shadow-md">
            {session.title}
         </h4>
         <div className="flex items-center gap-1.5">
            <img src={hostAvatar} className="w-5 h-5 rounded-full border border-white/20" alt={hostName} />
            <div className="min-w-0">
               <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-bold text-white/90 truncate">{hostName}</span>
                  {session.host_profiles?.is_verified && <CheckCircle2 size={8} className="text-blue-400" />}
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

export default LiveStreamCard;
