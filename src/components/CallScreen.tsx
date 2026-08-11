import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Phone, Video, Mic, MicOff, VideoOff, PhoneOff, 
  MessageSquare, Users, ShieldCheck, ChevronDown, 
  Maximize2, Share, FileText, Settings, X, Disc, Hand
} from "lucide-react";

export type CallMode = "voice" | "video" | "conference";
export type CallState = "outgoing" | "connecting" | "active" | "ended";

export interface CallInfo {
  id: string;
  name: string;
  avatar?: string;
  isGroup?: boolean;
  participants?: any[];
  mode: CallMode;
  context?: {
    title: string;
    stage: string;
    price?: string;
  };
}

interface CallScreenProps {
  call: CallInfo;
  onEndCall: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  onRestore: () => void;
}

export default function CallScreen({ call, onEndCall, onMinimize, isMinimized, onRestore }: CallScreenProps) {
  const [callState, setCallState] = useState<CallState>("outgoing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.mode === "voice");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (callState === "outgoing") {
      const timer = setTimeout(() => {
        setCallState("connecting");
        setTimeout(() => setCallState("active"), 1500);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === "active") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    setCallState("ended");
    setTimeout(onEndCall, 1000);
  };

  if (isMinimized) {
    return (
      <motion.div 
        layoutId={`call-${call.id}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute bottom-20 right-4 left-4 z-[90] bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between cursor-pointer backdrop-blur-xl"
        onClick={onRestore}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
             {call.isGroup ? (
               <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Users size={16} className="text-indigo-400" />
               </div>
             ) : (
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                 {call.avatar ? <img src={call.avatar || undefined} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : call.name[0]}
               </div>
             )}
             {callState === "active" && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#111]" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-tight">{call.name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
               {callState === "active" ? (
                 <>
                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                   <span className="text-[10px] uppercase font-black tracking-widest text-red-500">{formatDuration(callDuration)}</span>
                 </>
               ) : (
                 <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                   {callState === "outgoing" ? "Ringing..." : "Connecting..."}
                 </span>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
           <button 
             onClick={() => setIsMuted(!isMuted)} 
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
           >
             {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
           </button>
           <button 
             onClick={endCall} 
             className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
           >
             <PhoneOff size={16} />
           </button>
        </div>
      </motion.div>
    );
  }

  // Full Screen Mode
  return (
    <motion.div 
      layoutId={`call-${call.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col"
    >
      {/* Background (Video or Gradient) */}
      <div className="absolute inset-0 overflow-hidden">
        {call.mode === "video" && !isVideoOff && callState === "active" ? (
          <div className="w-full h-full bg-[#111] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-500/5" />
            <img 
               src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&h=800&auto=format&fit=crop" 
               alt="Remote Video"
               className="w-full h-full object-cover opacity-80"
            />
            {/* Self PIP */}
            <div className="absolute bottom-32 right-6 w-24 h-36 bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=400&auto=format&fit=crop"
                alt="Self Video"
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] to-[#111] flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
             
             {/* Central Avatar Focus */}
             <div className="relative mb-8">
                {callState === "outgoing" || callState === "connecting" ? (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-white/20"
                  />
                ) : (
                  <motion.div 
                     animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     className="absolute -inset-4 rounded-full bg-blue-500/20 blur-xl"
                  />
                )}
                
                <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
                  {call.isGroup ? (
                    <Users size={48} className="text-white/40" />
                  ) : call.avatar ? (
                    <img src={call.avatar || undefined} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-white/20 font-black">{call.name[0]}</span>
                  )}
                </div>
             </div>

             <h2 className="text-3xl font-display font-black text-white mb-2">{call.name}</h2>
             <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
               {callState === "outgoing" && "Ringing..."}
               {callState === "connecting" && "Connecting..."}
               {callState === "active" && <span className="text-white">{formatDuration(callDuration)}</span>}
               {callState === "ended" && "Call Ended"}
             </p>
          </div>
        )}
      </div>

      {/* Header Overlay */}
      <header className="relative z-20 flex justify-between items-start p-6 pt-12 bg-gradient-to-b from-black/80 to-transparent pb-10 pointer-events-auto">
         <button onClick={onMinimize} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md hover:bg-white/20 transition-colors">
            <ChevronDown size={24} />
         </button>

         <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-md">
             <ShieldCheck size={12} />
             <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
           </div>
           
           {call.context && (
              <div className="bg-black/60 border border-white/10 rounded-xl p-3 backdrop-blur-xl text-left min-w-[200px] mt-2 shadow-2xl">
                 <p className="text-[9px] uppercase font-black tracking-widest text-white/40 mb-1">Active Booking Context</p>
                 <p className="text-sm font-bold text-white truncate">{call.context.title}</p>
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-white/60">{call.context.stage}</span>
                    <span className="text-xs font-black text-blue-400">{call.context.price}</span>
                 </div>
              </div>
           )}
         </div>
      </header>

      {/* Main Controls Overlay */}
      <footer className="relative z-20 mt-auto bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-10 px-6 pointer-events-auto">
         {/* Collaboration Deck */}
         {callState === "active" && (
           <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`flex flex-col items-center gap-2 ${showChat ? 'text-blue-400' : 'text-white/60 hover:text-white'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showChat ? 'bg-blue-500/20' : 'bg-white/10'}`}>
                  <MessageSquare size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
              </button>
              <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-colors">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Files</span>
              </button>
              {call.isGroup && (
                <button 
                  onClick={() => setShowParticipants(!showParticipants)}
                  className={`flex flex-col items-center gap-2 ${showParticipants ? 'text-indigo-400' : 'text-white/60 hover:text-white'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showParticipants ? 'bg-indigo-500/20' : 'bg-white/10'}`}>
                    <Users size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">People</span>
                </button>
              )}
              {call.mode === "conference" && (
                <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-colors">
                    <Hand size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Raise</span>
                </button>
              )}
           </div>
         )}

         {/* Core Call Controls */}
         <div className="flex items-center justify-center gap-6">
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-white/20 text-white' : 'bg-white/10 text-white backdrop-blur-md'}`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white/20 text-white' : 'bg-white/10 text-white backdrop-blur-md'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button 
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-[0_0_24px_rgba(239,68,68,0.4)] ml-2"
            >
              <PhoneOff size={28} />
            </button>
         </div>
      </footer>

      {/* Side Chat Drawer Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="absolute top-0 right-0 w-3/4 max-w-sm h-full bg-[#050505]/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col"
          >
             <div className="p-4 border-b border-white/10 flex justify-between items-center mt-12">
               <h3 className="font-display font-black text-sm uppercase tracking-widest">In-Call Chat</h3>
               <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white">
                 <X size={20} />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
               {/* Example Messages */}
               <div className="bg-white/5 p-3 rounded-xl max-w-[80%] rounded-tl-none self-start">
                 <p className="text-[10px] text-white/40 font-bold mb-1">Alex</p>
                 <p className="text-xs">Here is the link we discussed: project.figma.com/hustle</p>
               </div>
               <div className="bg-blue-500 p-3 rounded-xl max-w-[80%] rounded-tr-none self-end">
                 <p className="text-xs">Got it, reviewing now on the call.</p>
               </div>
             </div>
             <div className="p-4 border-t border-white/10">
               <div className="bg-white/5 rounded-full flex items-center px-4 h-10 border border-white/10">
                 <input type="text" placeholder="Type a message..." className="bg-transparent border-none text-xs flex-1 outline-none text-white placeholder:text-white/30" />
                 <button className="text-blue-400 font-bold text-xs">Send</button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Meeting Note */}
      {call.mode === "conference" && callState === "connecting" && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 text-center">
           <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
             <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
               <Disc size={20} />
             </div>
             <h4 className="text-sm font-bold text-white mb-1">Scheduled Review</h4>
             <p className="text-xs text-white/50">Waiting for other participants to join the conference...</p>
           </div>
        </div>
      )}
    </motion.div>
  );
}
