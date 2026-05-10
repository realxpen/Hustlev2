import { motion } from "motion/react";
import { Search, MoreHorizontal, CheckCircle2 } from "lucide-react";

interface ChatListProps {
  onChatSelect: (chat: any) => void;
}

const MOCK_CHATS = [
  {
    id: 1,
    name: "Marcus V.",
    avatar: "M",
    skill: "UI/UX Specialist",
    lastMessage: "I can definitely help with that landing page. Are you available for a quick call?",
    time: "2m ago",
    unread: 2,
    active: true,
    verified: true,
    rating: 4.9
  },
  {
    id: 2,
    name: "Elena S.",
    avatar: "E",
    skill: "Street Photographer",
    lastMessage: "The photos from the shoot are ready! Sent them to your gallery link.",
    time: "1h ago",
    unread: 0,
    active: false,
    verified: true,
    rating: 5.0
  },
  {
    id: 3,
    name: "Jordan K.",
    avatar: "J",
    skill: "Motion Director",
    lastMessage: "Booking confirmed for Friday. Looking forward to it!",
    time: "3h ago",
    unread: 0,
    active: true,
    verified: true,
    rating: 4.8
  }
];

export default function ChatList({ onChatSelect }: ChatListProps) {
  return (
    <div className="min-h-screen bg-transparent text-white p-6 pb-24 overflow-y-auto no-scrollbar" id="chat-list">
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-10 pt-4">
        <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">Conversations</h2>
        <div className="flex gap-4">
           <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* Active Threads */}
      <div className="flex flex-col gap-2">
        {MOCK_CHATS.map((chat) => (
          <motion.button
            key={chat.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChatSelect(chat)}
            className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 hover:bg-white/[0.06] transition-all text-left active:scale-[0.98]"
          >
            <div className="relative shrink-0">
               <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-display font-black text-white/20">
                  {chat.avatar}
               </div>
               {chat.active && (
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#050505]" />
               )}
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-1.5">
                     <h3 className="font-bold text-sm truncate">{chat.name}</h3>
                     {chat.verified && <CheckCircle2 size={10} className="text-blue-400" />}
                  </div>
                  <span className="text-[10px] text-white/20 font-bold uppercase">{chat.time}</span>
               </div>
               <p className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest mb-1">{chat.skill}</p>
               <p className="text-xs text-white/40 font-light truncate leading-relaxed">
                  {chat.lastMessage}
               </p>
            </div>

            {chat.unread > 0 && (
               <div className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-white/10">
                  {chat.unread}
               </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Trust Signal Hub */}
      <section className="mt-12 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 text-center relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
         <h4 className="text-sm font-display font-black tracking-widest uppercase text-white/40 mb-2">Verified Direct Connect</h4>
         <p className="text-white/20 text-[10px] font-light leading-relaxed max-w-[200px] mx-auto uppercase tracking-wide">
            Your conversations are private and secured. Always communicate within Hustle to stay protected.
         </p>
      </section>
    </div>
  );
}
