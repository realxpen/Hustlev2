import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, MoreHorizontal, Star, MapPin, Send, Plus, Calendar, Camera, Mic, ShieldCheck, AlertCircle, FileText, LayoutGrid, Info, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import BookingContextCard from "./BookingContextCard";
import TransactionMessage from "./TransactionMessage";
import ChatAttachment from "./ChatAttachment";
import { TransactionType, MilestoneStatus } from "../types";

interface ChatRoomProps {
  chat: any;
  onBack: () => void;
  onOpenBooking?: () => void;
  onOpenEscrow?: (booking: any) => void;
}

const QUICK_ACTIONS = [
  "Are you available?",
  "How much for this?",
  "Can you come today?",
  "Send portfolio"
];

function VoiceMessagePlayer({ msg }: { msg: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      const handleTimeUpdate = () => {
        setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      };
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  return (
    <div className="flex items-center gap-3 w-48">
      {msg.audioUrl && <audio ref={audioRef} src={msg.audioUrl} className="hidden" />}
      <button 
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 hover:bg-black/10 transition-colors"
      >
        {isPlaying ? (
          <div className="w-3 h-3 bg-black rounded-sm" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        )}
      </button>
      <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden relative">
        <div 
          className="absolute inset-y-0 left-0 bg-black/40 transition-all duration-75" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <span className="text-[10px] font-black shrink-0">{msg.duration}</span>
    </div>
  );
}

export default function ChatRoom({ chat, onBack, onOpenBooking, onOpenEscrow }: ChatRoomProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock active booking for demonstration
  const activeBooking = (chat.id === 1 || chat.id === "1") ? {
    id: "BK-PRO-1029",
    price: 150000,
    status: "in_progress",
    milestones: [
      { id: "m1", title: "Visual Identity", amount: 50000, status: MilestoneStatus.RELEASED },
      { id: "m2", title: "UX Wireframes", amount: 50000, status: MilestoneStatus.AWAITING_APPROVAL },
      { id: "m3", title: "Prototypes", amount: 50000, status: MilestoneStatus.PENDING },
    ]
  } : (chat.id === 3 || chat.id === "3") ? {
    id: "BK-TRA-4052",
    price: 45000,
    status: "in_progress",
    milestones: [
      { id: "t1", title: "Curriculum Access", amount: 20000, status: MilestoneStatus.RELEASED },
      { id: "t2", title: "Week 1 Review", amount: 25000, status: MilestoneStatus.PENDING },
    ]
  } : null;

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: message,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  const handleStartRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const voiceMessage = {
          id: Date.now(),
          type: 'voice',
          audioUrl,
          duration: formatDuration(durationRef.current) || '0:01',
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, voiceMessage]);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      durationRef.current = 0;
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          durationRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // fallback if microphone fails
      alert("Microphone access is needed to record voice notes.");
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#050505] flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Recording Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[80] bg-red-500 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-red-500/40"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Recording Voice Note...</span>
            <span className="text-xs font-bold text-white/60 ml-2">{formatDuration(recordingDuration)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Header - Trust + Context Layer */}
      <header className="px-6 pt-4 pb-4 border-b border-white/5 flex items-center justify-between bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 -ml-3 text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black shrink-0 relative overflow-hidden">
               {chat.isGroup ? (
                 <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center">
                    <span className="text-white/40 text-xs text-center leading-none">GRP</span>
                 </div>
               ) : chat.avatar?.toString().startsWith('http') ? (
                 <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-white/20">{chat.avatar}</span>
               )}
               {chat.active && !chat.isGroup && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#050505]" />}
            </div>
            <div className="min-w-0">
               <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm truncate leading-tight">{chat.name}</h3>
                  {chat.isGroup && <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase text-indigo-300 bg-indigo-500/20">Group</span>}
               </div>
               {chat.isGroup ? (
                 <div className="text-[10px] text-white/40 truncate mt-0.5">
                   You, {chat.participants?.[0] || 'Alex'}, {chat.participants?.[1] || 'Jordan'}, and 3 others
                 </div>
               ) : (
                 <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap">
                   <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5">
                     <Star size={8} className="text-yellow-500 fill-yellow-500" />
                     <span className="text-[8px] font-black">{chat.rating || "4.9"}</span>
                   </div>
                   <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest truncate">{chat.skill || "Specialist"}</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center text-white/40 hover:text-white transition-colors">
             <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Booking Context Bar integration */}
      {activeBooking && (
        <BookingContextCard 
          booking={activeBooking as any} 
          onOpenBooking={() => onOpenEscrow && onOpenEscrow(activeBooking)} 
        />
      )}

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

        {/* Example Financial Timeline Event */}
        {activeBooking && (
           <TransactionMessage 
             payload={{
               type: TransactionType.ESCROW_FUNDED,
               title: "Escrow Funded Successfully",
               amount: activeBooking.price,
               description: "Project funds are secured in Hustle Escrow. Payouts will trigger per milestone approval.",
               onAction: () => onOpenEscrow && onOpenEscrow(activeBooking)
             }}
           />
        )}

        {/* Attachment Integration */}
        <ChatAttachment 
          attachment={{
            id: "att-1",
            type: "service",
            title: "Advanced Component Library Design",
            price: 45000,
            image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=60",
            creator: "Marcus V."
          }}
          onAction={() => {}}
        />

        <div className="flex flex-col gap-1 max-w-[80%] self-end items-end">
           <div className="p-4 rounded-2xl bg-white text-black rounded-tr-none shadow-xl shadow-white/5">
              <p className="text-sm font-medium leading-relaxed">
                 Thanks! I appreciate that. What kind of project are you working on?
              </p>
           </div>
           <span className="text-[8px] text-white/30 font-bold uppercase mr-1">11:34 AM</span>
        </div>

        {activeBooking && (
          <TransactionMessage 
            payload={{
              type: TransactionType.AWAITING_APPROVAL,
              title: "Milestone 2: Review Required",
              amount: 50000,
              description: "Marcus has submitted 'UX Wireframes' for approval. Please review the deliverables.",
              actionLabel: "Approve & Release",
              onAction: () => onOpenEscrow && onOpenEscrow(activeBooking)
            }}
          />
        )}

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

        {/* Dynamic Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-1 max-w-[80%] self-end items-end">
            <div className="p-4 rounded-2xl bg-white text-black rounded-tr-none shadow-xl shadow-white/5">
              {msg.type === 'voice' ? (
                <VoiceMessagePlayer msg={msg} />
              ) : (
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              )}
            </div>
            <span className="text-[8px] text-white/30 font-bold uppercase mr-1">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Contextual Action Menu */}
      <AnimatePresence>
        {isActionMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 mb-2 pointer-events-auto flex flex-col gap-4"
          >
            {/* Media & Files attachments */}
            <div>
              <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-2">Attach Files</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: <Camera size={18} />, label: "Camera", color: "text-blue-400" },
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, label: "Photos", color: "text-purple-400" },
                  { icon: <FileText size={18} />, label: "Document", color: "text-orange-400" },
                  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>, label: "Link", color: "text-green-400" },
                ].map((action, i) => (
                  <button 
                    key={i}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors"
                    onClick={() => setIsActionMenuOpen(false)}
                  >
                    <div className={action.color}>{action.icon}</div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hustle Tools */}
            <div>
              <h4 className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-2">Hustle Tools</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: <ShieldCheck size={18} />, label: "Escrow", color: "text-blue-400", onClick: () => onOpenEscrow && onOpenEscrow(activeBooking) },
                  { icon: <Calendar size={18} />, label: "Book", color: "text-white", onClick: onOpenBooking },
                  { icon: <CheckCircle2 size={18} />, label: "Send Tip", color: "text-green-400", onClick: () => {} },
                  { icon: <AlertCircle size={18} />, label: "Dispute", color: "text-red-400", onClick: () => onOpenEscrow && onOpenEscrow(activeBooking) },
                ].map((action, i) => (
                  <button 
                    key={i}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors"
                    onClick={() => {
                      action.onClick?.();
                      setIsActionMenuOpen(false);
                    }}
                  >
                    <div className={action.color}>{action.icon}</div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Scroll */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
         {activeBooking ? (
           <button 
             onClick={() => onOpenEscrow && onOpenEscrow(activeBooking)}
             className="px-4 h-9 bg-blue-500 rounded-full flex items-center gap-2 shrink-0 border border-blue-400 shadow-lg shadow-blue-500/20"
           >
             <ShieldCheck size={14} className="text-white" />
             <span className="text-[10px] font-black uppercase text-white tracking-widest">Manage Escrow</span>
           </button>
         ) : (
           <button 
             onClick={onOpenBooking}
             className="px-4 h-9 bg-white/5 rounded-full flex items-center gap-2 shrink-0 border border-white/5"
           >
             <Calendar size={14} className="text-white/40" />
             <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Book Session</span>
           </button>
         )}
         {QUICK_ACTIONS.map(action => (
            <button 
               key={action}
               onClick={() => {
                 const newMessage = {
                   id: Date.now(),
                   text: action,
                   sender: "me",
                   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 };
                 setMessages(prev => [...prev, newMessage]);
               }}
               className="px-4 h-9 bg-white/5 border border-white/10 rounded-full whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
               {action}
            </button>
         ))}
      </div>

      {/* Chat Input */}
      <footer className="px-6 pt-2 pb-10 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center gap-3 h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-4 focus-within:border-white/30 transition-all">
           <button 
             onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
             className={`transition-colors ${isActionMenuOpen ? 'text-white' : 'text-white/30'}`}
           >
              <Plus size={20} className={isActionMenuOpen ? 'rotate-45' : ''} style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
           </button>
           <input 
             type="text" 
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
             placeholder="Message..."
             className="flex-1 bg-transparent border-none outline-none text-sm font-light placeholder:text-white/20"
           />
           <div className="flex gap-4">
              <button 
                onClick={handleStartRecording}
                className={`transition-colors flex items-center justify-center p-1 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'text-white/30 hover:text-white'}`}
              >
                 {isRecording ? <div className="w-3.5 h-3.5 bg-white rounded-sm m-1" /> : <Mic size={20} />}
              </button>
              <button 
                 onClick={handleSendMessage}
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
