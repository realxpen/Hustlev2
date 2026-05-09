import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, MoreHorizontal, Star, MapPin, Send, Plus, Calendar, Camera, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatRoomProps {
  chat: any;
  onBack: () => void;
  onOpenBooking?: () => void;
}

const QUICK_ACTIONS = [
  "Are you available?",
  "How much for this?",
  "Can you come today?",
  "Send portfolio"
];

export default function ChatRoom({ chat, onBack, onOpenBooking }: ChatRoomProps) {
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#050505] flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Chat Header - Trust + Context Layer */}
      <header className="px-6 pb-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 -ml-3 text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black shrink-0 relative">
               {chat.avatar}
               {chat.active && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#050505]" />}
            </div>
            <div className="min-w-0">
               <h3 className="font-bold text-sm truncate leading-tight">{chat.name}</h3>
               <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5">
                    <Star size={8} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[8px] font-black">{chat.rating}</span>
                  </div>
                  <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest truncate">{chat.skill}</span>
               </div>
            </div>
          </div>
        </div>

        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
           <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 no-scrollbar"
      >
        <div className="flex flex-col items-center mb-4">
           <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Today</span>
           </div>
        </div>

        {/* Example Bubbles */}
        <div className="flex flex-col gap-1 max-w-[80%] self-start">
           <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/5 rounded-tl-none">
              <p className="text-sm font-light leading-relaxed">
                 Hey! I saw your work on the feed. Really loved the visual intent of your last design.
              </p>
           </div>
           <span className="text-[8px] text-white/20 font-bold uppercase ml-1">11:32 AM</span>
        </div>

        <div className="flex flex-col gap-1 max-w-[80%] self-end items-end">
           <div className="p-4 rounded-2xl bg-white text-black rounded-tr-none shadow-xl shadow-white/5">
              <p className="text-sm font-medium leading-relaxed">
                 Thanks! I appreciate that. What kind of project are you working on?
              </p>
           </div>
           <span className="text-[8px] text-white/30 font-bold uppercase mr-1">11:34 AM</span>
        </div>

        {/* Service Card Integration in Chat */}
        <div className="flex flex-col gap-2 p-4 rounded-[24px] bg-blue-500/10 border border-blue-500/20 max-w-[85%] self-start">
           <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Marcus's Availability</span>
           </div>
           <p className="text-xs text-white/60 font-light leading-relaxed">
              I'm open for design consultations starting tomorrow. We can do a deep dive into your product.
           </p>
           <button 
             onClick={onOpenBooking}
             className="w-full h-10 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl mt-2 active:scale-[0.98] transition-transform"
           >
              Book Consultation
           </button>
        </div>

        <div className="flex flex-col gap-1 max-w-[80%] self-start">
           <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/5 rounded-tl-none">
              <p className="text-sm font-light leading-relaxed">
                 {chat.lastMessage}
              </p>
           </div>
           <span className="text-[8px] text-white/20 font-bold uppercase ml-1">11:45 AM</span>
        </div>
      </div>

      {/* Quick Actions Scroll */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
         {QUICK_ACTIONS.map(action => (
            <button 
               key={action}
               onClick={() => setMessage(action)}
               className="px-4 h-9 bg-white/5 border border-white/10 rounded-full whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
               {action}
            </button>
         ))}
      </div>

      {/* Chat Input */}
      <footer className="px-6 pt-2 pb-10 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center gap-3 h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-4 focus-within:border-white/30 transition-all">
           <button className="text-white/30 hover:text-white transition-colors">
              <Plus size={20} />
           </button>
           <input 
             type="text" 
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             placeholder="Message..."
             className="flex-1 bg-transparent border-none outline-none text-sm font-light placeholder:text-white/20"
           />
           <div className="flex gap-4">
              <button className="text-white/30 hover:text-white">
                 <Mic size={20} />
              </button>
              <button 
                 disabled={!message}
                 className={`transition-all ${message ? 'text-white' : 'text-white/10'}`}
              >
                 <Send size={20} />
              </button>
           </div>
        </div>
      </footer>
    </motion.div>
  );
}
