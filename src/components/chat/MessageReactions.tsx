import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { useChatStore } from '../../features/chat/stores/useChatStore';
import { motion, AnimatePresence } from 'motion/react';

interface MessageReactionsProps {
  messageId: string;
  isMe: boolean;
}

const COMMON_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

export function MessageReactions({ messageId, isMe }: MessageReactionsProps) {
  const reactions = useChatStore(state => state.messageReactions[messageId]);
  const safeReactions = reactions || [];
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = safeReactions.reduce((acc, curr) => {
    if (!acc[curr.emoji]) acc[curr.emoji] = [];
    acc[curr.emoji].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  const handleToggle = (emoji: string) => {
    useChatStore.getState().toggleReaction(messageId, emoji);
    setShowPicker(false);
  };

  return (
    <div className={`relative flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      
      {/* Existing Reactions */}
      <div className="flex flex-wrap gap-1">
        {(Object.entries(groupedReactions) as [string, any[]][]).map(([emoji, reacts]) => (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/5 transition-colors"
          >
            <span className="text-[10px]">{emoji}</span>
            {reacts.length > 1 && <span className="text-[8px] font-bold text-white/80">{reacts.length}</span>}
          </button>
        ))}
      </div>

      {/* Add Reaction Button (visible on hover via group in parent or always thin) */}
      <div className="relative">
        <button 
          onClick={() => setShowPicker(!showPicker)}
          className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white"
        >
          <Smile size={12} />
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              className={`absolute bottom-full mb-2 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full shadow-xl z-50`}
            >
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleToggle(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-transform hover:scale-110 active:scale-95 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
