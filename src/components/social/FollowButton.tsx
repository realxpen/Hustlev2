import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, UserCheck, ChevronDown, UserMinus } from 'lucide-react';
import { useSocialGraphStore } from '../../features/social/stores/useSocialGraphStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const FollowButton: React.FC<FollowButtonProps> = ({ 
  targetUserId, 
  className = "", 
  size = 'md' 
}) => {
  const { user } = useAuthStore();
  const { toggleFollow, iFollow, isFollower } = useSocialGraphStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!user || user.id === targetUserId) return null;

  const iFollowThem = iFollow(user.id, targetUserId);
  const theyFollowMe = isFollower(user.id, targetUserId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (iFollowThem) {
      setShowMenu(!showMenu);
    } else {
      await toggleFollow(targetUserId);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await toggleFollow(targetUserId);
  };

  let label = "Follow";
  if (iFollowThem) {
    label = theyFollowMe ? "Mutual Gain" : "Following";
  } else if (theyFollowMe) {
    label = "Follow Back";
  }

  const isSmall = size === 'sm';

  return (
    <div className="relative inline-block" ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleAction}
        className={`flex items-center gap-1.5 font-black uppercase tracking-widest transition-all rounded-full border
          ${isSmall ? 'px-3 py-1 text-[8px]' : 'px-5 py-2 text-[10px]'}
          ${iFollowThem 
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
            : 'bg-white border-transparent text-black hover:bg-white/90 shadow-lg shadow-white/10'}
          ${className}
        `}
      >
        {iFollowThem ? (
          <>
            <UserCheck size={isSmall ? 10 : 12} />
            <span>{label}</span>
            <ChevronDown size={isSmall ? 10 : 12} className={`transition-transform duration-300 ${showMenu ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <>
            <UserPlus size={isSmall ? 10 : 12} />
            <span>{label}</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute left-0 top-full mt-2 w-48 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
          >
            <div className="p-1.5">
              <button
                onClick={handleUnfollow}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <UserMinus size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Unfollow</span>
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-tight mt-1">End mutual connection</span>
                </div>
              </button>
              
              <div className="h-px bg-white/5 my-1.5 mx-2" />
              
              <button
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-white/5 rounded-xl transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                   <ChevronDown size={14} className="rotate-180" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Cancel</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
