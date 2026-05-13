import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Phone, Video, MoreVertical, Send, Paperclip, 
  Mic, Image as ImageIcon, Briefcase, Lock, DollarSign,
  CheckCheck, Clock, Reply, Smile, Shield, ChevronLeft,
  FileText, Download, Play, MessageSquare, AlertCircle
} from "lucide-react";

interface ConversationViewProps {
  chat: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
    projectStatus?: string;
    hasEscrow?: boolean;
  };
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
  type: 'text' | 'file' | 'payment' | 'audio';
  status?: 'sent' | 'delivered' | 'read';
  fileData?: {
    name: string;
    size: string;
    type: string;
  };
  paymentData?: {
    amount: number;
    status: string;
    actionLabel: string;
  };
}

export default function ConversationView({ chat, onClose }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'other', text: 'Hey! I just updated the main dashboard layout.', time: '10:30 AM', type: 'text', status: 'read' },
    { id: '2', sender: 'other', text: 'Attached the Figma export for your review.', time: '10:31 AM', type: 'file', status: 'read', fileData: { name: 'Dashboard_V2_Draft.pdf', size: '2.4 MB', type: 'pdf' } },
    { id: '3', sender: 'me', text: 'Looks clean! The typography update makes a huge difference.', time: '10:35 AM', type: 'text', status: 'read' },
    { 
      id: '4', 
      sender: 'other', 
      text: 'Great. Once you approve this, I can start on the mobile components.', 
      time: '10:40 AM', 
      type: 'payment', 
      status: 'sent',
      paymentData: {
        amount: 450,
        status: 'Escrow Locked',
        actionLabel: 'Release for Milestone 2'
      }
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'sent'
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Thread Header - Project Rooted */}
      <header className="relative z-10 px-6 pt-12 pb-6 border-b border-white/5 bg-black/80 backdrop-blur-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors active-scale">
              <ChevronLeft size={24} />
           </button>
           <div className="relative">
              <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden">
                 <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
              </div>
              {chat.online && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-4 border-black" />
              )}
           </div>
           <div>
              <h2 className="text-sm font-black uppercase tracking-tight italic">{chat.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${chat.online ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                 <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{chat.online ? 'Active Now' : 'Last seen 2h ago'}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-1">
           <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <Phone size={18} className="text-white/40" />
           </button>
           <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <Video size={18} className="text-white/40" />
           </button>
           <button className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
              <MoreVertical size={18} className="text-white/40" />
           </button>
        </div>
      </header>

      {/* Project Status Bar - The HUD for Work */}
      <div className="relative z-10 bg-white/5 border-b border-white/5 px-6 py-3 flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <Briefcase size={12} className="text-blue-400" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{chat.projectStatus || 'Open Project'}</span>
            </div>
            {chat.hasEscrow && (
              <div className="flex items-center gap-2">
                 <Lock size={12} className="text-emerald-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Escrow Locked</span>
              </div>
            )}
         </div>
         <button className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 group active-scale">
            <DollarSign size={10} className="text-brand-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white group-hover:text-brand-primary transition-colors">Request Payment</span>
         </button>
      </div>

      {/* Messages Timeline */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="flex flex-col items-center mb-8 gap-2">
           <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Project Phase 1 Commenced</span>
           </div>
           <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">End-to-End Encryption Enabled</p>
        </div>

        {messages.map((msg, idx) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
          >
            {/* Meta Info */}
            <div className={`flex items-center gap-2 mb-1 px-1 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
               <span className="text-[8px] font-bold text-white/20 uppercase">{msg.time}</span>
               {msg.sender === 'me' && msg.status === 'read' && <CheckCheck size={10} className="text-brand-primary" />}
            </div>

            {/* Content Logic */}
            <div className={`max-w-[85%] rounded-[1.75rem] p-4 relative group ${
              msg.sender === 'me' 
                ? 'bg-brand-primary text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/5 text-white rounded-tl-none'
            }`}>
               {msg.type === 'text' && <p className="text-[13px] font-medium leading-relaxed">{msg.text}</p>}
               
               {msg.type === 'file' && (
                 <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                       <FileText size={20} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h5 className="text-[11px] font-black uppercase tracking-tight italic line-clamp-1">{msg.fileData?.name}</h5>
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{msg.fileData?.size}</span>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                       <Download size={14} />
                    </button>
                 </div>
               )}

               {msg.type === 'payment' && (
                 <div className="flex flex-col gap-4 bg-black/40 p-5 rounded-2xl border border-white/10 outline outline-2 outline-emerald-500/20">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                             <DollarSign size={16} className="text-emerald-500" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Milestone Request</span>
                       </div>
                       <Lock size={14} className="text-white/20" />
                    </div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black italic tracking-tighter">${msg.paymentData?.amount.toLocaleString()}</span>
                       <span className="text-[10px] font-black text-white/40 uppercase">NGN Bridge</span>
                    </div>
                    <button className="w-full py-3 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active-scale group">
                       <span className="group-hover:tracking-widest transition-all">{msg.paymentData?.actionLabel}</span>
                    </button>
                 </div>
               )}

               {/* Quick Reactions Hidden by Default */}
               <div className={`absolute bottom-[-12px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 ${msg.sender === 'me' ? 'right-4' : 'left-4'}`}>
                  <button className="text-xs hover:scale-125 transition-transform">🔥</button>
                  <button className="text-xs hover:scale-125 transition-transform">✅</button>
                  <button className="text-xs hover:scale-125 transition-transform"><Smile size={10} /></button>
               </div>
            </div>
          </motion.div>
        ))}
      </main>

      {/* Actionable Toolbar - Fast interactions */}
      <div className="px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
         {[
           { icon: <Briefcase size={12} />, label: 'Milestone' },
           { icon: <Clock size={12} />, label: 'Schedule' },
           { icon: <ImageIcon size={12} />, label: 'Moodboard' },
           { icon: <AlertCircle size={12} />, label: 'Critical' }
         ].map((tool, i) => (
           <button key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors whitespace-nowrap active-scale">
              <span className="text-white/40">{tool.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{tool.label}</span>
           </button>
         ))}
      </div>

      {/* Input Hub */}
      <footer className="px-6 py-8 safe-bottom bg-black/80 backdrop-blur-3xl border-t border-white/5 relative z-10">
         <div className="flex items-center gap-3 bg-white/5 rounded-[2.5rem] p-2 pr-4 border border-white/5 group focus-within:border-brand-primary/40 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <button className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors group">
               <Paperclip size={20} className="text-white/40 group-hover:text-white" />
            </button>
            <input 
              type="text" 
              placeholder="Design brief, files, or message..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium h-12"
            />
            <div className="flex items-center gap-2">
               <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
                  <Mic size={18} className="text-white/20" />
               </button>
               <button 
                 onClick={handleSendMessage}
                 className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${inputText.trim() ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/40' : 'bg-white/5 text-white/20'}`}
               >
                  <Send size={20} className={inputText.trim() ? 'translate-x-0.5 -translate-y-0.5' : ''} />
               </button>
            </div>
         </div>
      </footer>
    </div>
  );
}
