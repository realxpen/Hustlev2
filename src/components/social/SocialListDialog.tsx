import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search } from "lucide-react";
import { FollowButton } from "./FollowButton";

interface UserItem {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  isVerified?: boolean;
}

interface SocialListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: "Followers" | "Following";
  users: UserItem[];
  isLoading?: boolean;
}

export const SocialListDialog: React.FC<SocialListDialogProps> = ({
  isOpen,
  onClose,
  title,
  users,
  isLoading,
}) => {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.handle.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Dialog Container */}
          <div className="fixed inset-x-0 bottom-0 top-20 z-[110] flex flex-col justify-end pointer-events-none sm:items-center sm:justify-center sm:top-0">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-[#0d0d0f] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative bg-[#0d0d0f]/90 backdrop-blur z-10 shrink-0">
                <div className="flex-1" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">
                  {title}
                </h2>
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-4 shrink-0 bg-[#0d0d0f]/90 relative z-10 border-b border-white/5">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <input
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-sm px-10 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-white/20 transition-shadow !placeholder-white/30"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-10 space-y-4">
                    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-12 opacity-50">
                    <h3 className="text-white font-black uppercase tracking-widest text-lg mb-2">
                      No results
                    </h3>
                    <p className="text-xs text-white/50 tracking-wide leading-relaxed">
                      {search
                        ? `No users found matching "${search}"`
                        : `This user doesn’t have any ${title.toLowerCase()} yet.`}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col divider-y divider-white/5">
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 group"
                      >
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:block transition-all"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-bold truncate">
                              {user.name}
                            </span>
                            {user.isVerified && (
                              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                <span className="text-white text-[8px] font-black">
                                  ✓
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-white/50 text-xs truncate">
                            @{user.handle}
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center">
                          <FollowButton targetUserId={user.id} size="sm" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
