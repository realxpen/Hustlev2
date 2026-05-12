import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Users,
  AlertCircle,
  Calendar,
  Package,
  Lock,
  ShieldAlert,
  Pin,
  BellRing,
  Briefcase,
  Zap,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { MOCK_CHATS, Chat } from "../constants/mockData";

interface ChatListProps {
  onChatSelect: (chat: any) => void;
}

type ChatType = "booking" | "order" | "team" | "dispute" | "apprenticeship";
type ChatPriority = "normal" | "urgent" | "action_needed";

const CATEGORIES = [
  "All Chats",
  "Unread",
  "Bookings",
  "Orders",
  "Teams",
  "Disputes",
];
const TAGS = [
  "VIP Client",
  "Urgent",
  "Fashion Orders",
  "Apprentices",
  "High Priority",
  "Internal",
];

export default function ChatList({ onChatSelect }: ChatListProps) {
  const [activeCategory, setActiveCategory] = useState("All Chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const getFilteredChats = () => {
    let filtered = [...MOCK_CHATS];

    // Filter by Category
    if (activeCategory === "Unread")
      filtered = filtered.filter((c) => c.unread > 0);
    if (activeCategory === "Bookings")
      filtered = filtered.filter((c) => c.type === "booking");
    if (activeCategory === "Orders")
      filtered = filtered.filter((c) => c.type === "order");
    if (activeCategory === "Teams")
      filtered = filtered.filter((c) => c.type === "team");
    if (activeCategory === "Disputes")
      filtered = filtered.filter((c) => c.type === "dispute");

    // Filter by Tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((c) =>
        c.tags.some((t) => selectedTags.includes(t)),
      );
    }

    // Filter by Search
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort: Pinned first, then by unread, then recent (mock: ID reverse)
    return filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.unread > 0 && b.unread === 0) return -1;
      if (b.unread > 0 && a.unread === 0) return 1;
      return a.id - b.id;
    });
  };

  const filteredChats = getFilteredChats();
  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const unpinnedChats = filteredChats.filter((c) => !c.pinned);

  return (
    <div
      className="h-full bg-transparent text-white pb-24 flex flex-col"
      id="chat-list"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header & Search */}
      <header className="px-6 pt-6 pb-2 shrink-0 z-10 sticky top-0 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">
              Inbox
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Lock size={10} className="text-white/30" />
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                End-to-End Encrypted
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-xl shadow-lg hover:bg-white/10 transition-colors">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search messages, clients, or orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-xs font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all font-sans"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors shrink-0 ${showFilters || selectedTags.length > 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/10 text-white/40"}`}
          >
            <Filter size={18} />
            {selectedTags.length > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#050505]" />
            )}
          </button>
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 mt-4 pb-2 overflow-x-auto no-scrollbar scroll-smooth relative">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 h-8 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${
                activeCategory === category
                  ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                  : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/5"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      {/* Advanced Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0a0a0a] border-b border-white/5 px-6 shrink-0"
          >
            <div className="py-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    Custom Tags
                  </h4>
                  <button className="text-[9px] text-blue-400 uppercase font-black tracking-widest">
                    Manage
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-2 px-4 flex flex-col gap-1.5 relative pb-32">
        {pinnedChats.length > 0 && (
          <div className="mt-2 mb-1 px-2 flex items-center gap-2">
            <Pin size={10} className="text-white/30" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
              Pinned
            </span>
          </div>
        )}

        {pinnedChats.map((chat) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            onClick={() => onChatSelect(chat)}
          />
        ))}

        {pinnedChats.length > 0 && unpinnedChats.length > 0 && (
          <div className="h-px bg-white/5 my-2 mx-2" />
        )}

        {unpinnedChats.map((chat) => (
          <ChatCard
            key={chat.id}
            chat={chat}
            onClick={() => onChatSelect(chat)}
          />
        ))}

        {filteredChats.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
              <Search size={24} />
            </div>
            <p className="text-sm font-bold text-white/60 mb-1">
              No conversations found
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              Adjust filters or search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getChatTypeIcon(type: ChatType) {
  switch (type) {
    case "booking":
      return <Calendar size={12} className="text-blue-400" />;
    case "order":
      return <Package size={12} className="text-orange-400" />;
    case "team":
      return <Users size={12} className="text-purple-400" />;
    case "dispute":
      return <ShieldAlert size={12} className="text-red-400" />;
    case "apprenticeship":
      return <Briefcase size={12} className="text-green-400" />;
  }
}

function getPriorityIndicator(priority: ChatPriority) {
  if (priority === "urgent")
    return (
      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
        <AlertCircle size={10} /> Urgent
      </div>
    );
  if (priority === "action_needed")
    return (
      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
        <Zap size={10} /> Action Needed
      </div>
    );
  return null;
}

function ChatCard({
  chat,
  onClick,
}: {
  chat: Chat;
  onClick: () => void;
  key?: number | string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/5 hover:bg-white/[0.04] transition-all text-left group relative"
    >
      <div className="flex gap-4 items-center">
        <div className="relative shrink-0">
          {chat.isGroup ? (
            <div className="w-14 h-14 relative flex gap-0.5 justify-center flex-wrap shrink-0 rounded-full bg-white/5 border border-white/10 p-1 items-center overflow-hidden">
              <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 pointer-events-none" />
              <Users size={20} className="text-white/40 absolute" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-xl font-display font-black text-white p-0.5 relative">
              <div className="w-full h-full bg-[#050505] rounded-full flex items-center justify-center absolute">
                {chat.avatar}
              </div>
            </div>
          )}

          {chat.active && !chat.isGroup && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#050505]" />
          )}

          {chat.pinned && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#050505] rounded-full flex items-center justify-center">
              <Pin size={10} className="text-white/40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-baseline mb-0.5 mt-1">
            <div className="flex items-center gap-1.5 min-w-0 relative">
              <h3 className="font-bold text-sm truncate text-white">
                {chat.name}
              </h3>
              {chat.isGroup && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-300 bg-indigo-500/20 shrink-0">
                  Group
                </span>
              )}
              {chat.verified && (
                <CheckCircle2 size={12} className="text-blue-400 shrink-0" />
              )}
            </div>
            <span
              className={`text-[9px] font-bold uppercase shrink-0 ml-2 ${chat.unread > 0 ? "text-blue-400" : "text-white/20"}`}
            >
              {chat.time}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-white/50 w-max shrink-0">
              {getChatTypeIcon(chat.type)}
              <span className="text-[8px] font-black uppercase tracking-widest">
                {chat.type}
              </span>
            </div>

            {getPriorityIndicator(chat.priority)}

            {chat.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-[8px] font-black uppercase tracking-widest text-[#050505] bg-white/80 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {chat.tags.length > 2 && (
              <span className="text-[8px] font-black text-white/40">
                +{chat.tags.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pr-4 relative">
            {chat.unread > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}
            <p
              className={`text-[11px] truncate leading-relaxed ${chat.unread > 0 ? "text-white font-medium" : "text-white/40 font-normal"}`}
            >
              {chat.lastMessage}
            </p>
          </div>
        </div>

        {chat.unread > 0 && (
          <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shrink-0 relative mt-4">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
            {chat.unread}
          </div>
        )}
      </div>
    </motion.button>
  );
}
