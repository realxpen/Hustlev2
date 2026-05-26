import { useStoryBar } from '../features/feed/hooks/useStoryBar';
import { motion } from 'motion/react';
import type { StoryGroup } from '../features/feed/stores/useStoryStore';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { Plus } from 'lucide-react';

export default function StoryBar({ onAddStory }: { onAddStory?: () => void }) {
  const { groupedStories, isLoading, openStory, refreshStories } = useStoryBar();
  const { user, profile } = useAuthStore();

  const ownGroup = groupedStories.find((g) => g.relationship === 'own');
  const hasOwnActiveStory = !!ownGroup && ownGroup.stories.length > 0;

  if (isLoading && groupedStories.length === 0) {
    return (
      <div className="w-full flex items-center gap-3 px-4 py-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
           <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
             <div className="w-16 h-16 rounded-full bg-white/[0.05]" />
             <div className="w-12 h-2 rounded bg-white/[0.05]" />
           </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center gap-4 px-4 overflow-x-auto no-scrollbar pointer-events-auto">
      {/* Own Story Add/View Button */}
      {hasOwnActiveStory && ownGroup ? (
        <>
          {/* Your Story button to view existing stories */}
          <motion.button
            onClick={() => openStory(ownGroup)}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1.5 shrink-0 relative"
          >
            <div className="w-[68px] h-[68px] rounded-full p-[2px] border-2 border-white/50 transition-colors">
               <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                  <img 
                     src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                     alt="You"
                     className="w-full h-full object-cover"
                     loading="lazy"
                  />
               </div>
            </div>
            <span className="text-[10px] font-medium text-white/70 max-w-[68px] truncate">
              Your Story
            </span>
          </motion.button>

          {/* Dedicated trigger to add more stories */}
          <motion.button
            onClick={() => onAddStory?.()}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1.5 shrink-0 relative"
          >
            <div className="w-[68px] h-[68px] rounded-full p-[2px] border border-dashed border-white/30 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] transition-colors">
               <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400">
                  <Plus size={18} />
               </div>
            </div>
            <span className="text-[10px] font-medium text-white/50 max-w-[68px] truncate">
              Add Story
            </span>
          </motion.button>
        </>
      ) : (
        /* Original Add Story button when no active personal story exists */
        <motion.button
          onClick={() => onAddStory?.()}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-1.5 shrink-0 relative"
        >
          <div className="w-[68px] h-[68px] rounded-full p-[2px] border border-white/20 transition-colors">
             <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                <img 
                   src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
                   alt="You"
                   className="w-full h-full object-cover opacity-80"
                   loading="lazy"
                />
             </div>
          </div>
          <div className="absolute bottom-5 right-0 bg-blue-500 rounded-full p-0.5 border-2 border-black">
             <Plus size={12} className="text-white" />
          </div>
          <span className="text-[10px] font-medium text-white/70 max-w-[68px] truncate">
            Add Story
          </span>
        </motion.button>
      )}

      {/* Other Stories */}
      {groupedStories.filter(g => g.relationship !== 'own').map((group) => {
         const avatarUrl = group.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.userId}`;
         const username = group.profile?.username || group.profile?.full_name?.split(' ')[0] || 'User';
         
         // Style ring based on unread and relationship 
         let ringColor = 'border-white/20'; // viewed
         if (group.hasUnread) {
             if (group.relationship === 'mutual') ringColor = 'border-blue-500';
             else if (group.relationship === 'following') ringColor = 'border-green-500';
             else ringColor = 'border-orange-500';
         }

         return (
           <motion.button
             key={group.userId}
             onClick={() => openStory(group)}
             whileTap={{ scale: 0.9 }}
             className="flex flex-col items-center gap-1.5 shrink-0"
           >
             <div className={`w-[68px] h-[68px] rounded-full p-[2px] border-2 transition-colors ${ringColor}`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border-2 border-black">
                   <img 
                      src={avatarUrl} 
                      alt={username}
                      className="w-full h-full object-cover"
                      loading="lazy"
                   />
                </div>
             </div>
             <span className="text-[10px] font-medium text-white/70 max-w-[68px] truncate">
               {username}
             </span>
           </motion.button>
         );
      })}
    </div>
  );
}
