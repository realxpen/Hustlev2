import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Plus, MoreVertical, Star, Clock, Filter, 
  MessageSquare, Circle, CheckCheck, Phone, Video, 
  Paperclip, Send, Shield, Info, ChevronRight, X,
  Briefcase, DollarSign, Image as ImageIcon, FileText,
  Mic, Hash, Settings, BellOff, Loader2
} from "lucide-react";
import { useChat } from '../features/chat/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { useChatStore } from '../features/chat/stores/useChatStore';

interface ChatHubProps {
  onClose: () => void;
  onOpenConversation: (chat: any) => void;
}

type ChatCategory = 'all' | 'projects' | 'training' | 'support';

export default function ChatHub({ onClose, onOpenConversation }: ChatHubProps) {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Fetch profiles when New Chat modal is opened
  useEffect(() => {
    if (!isNewChatOpen || !user) return;
    
    const fetchProfiles = async () => {
      setIsSearchingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .neq('id', user.id)
          .limit(30);

        if (!error && data) {
          setAllProfiles(data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    };
    
    fetchProfiles();
  }, [isNewChatOpen, user]);

  const filteredProfiles = useMemo(() => {
    if (!userSearchQuery.trim()) return allProfiles;
    const cleanQuery = userSearchQuery.toLowerCase().trim();
    return allProfiles.filter(p => 
      (p.full_name || '').toLowerCase().includes(cleanQuery) || 
      (p.username || '').toLowerCase().includes(cleanQuery)
    );
  }, [allProfiles, userSearchQuery]);

  const onlineUsers = useChatStore(state => state.onlineUsers);
  const { conversations, isLoading } = useChat();

  const mappedChats = useMemo(() => {
    const uniqueMap = new Map();
    conversations.forEach(c => {
      if (!uniqueMap.has(c.id)) {
        uniqueMap.set(c.id, c);
      }
    });
    return Array.from(uniqueMap.values()).map(c => {
      const other = c.otherParticipant;
      return {
        id: c.id,
        name: other?.full_name || other?.username || 'Unknown Hustler',
        avatar: other?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username || c.id}`,
        lastMessage: c.last_message || 'No messages yet',
        time: c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false }).replace('about ', '') : '',
        unread: c.unreadCount || 0,
        online: other?.id ? Boolean(onlineUsers[other.id]) : false,
        type: 'projects' as ChatCategory,
        projectStatus: 'Active',
        hasEscrow: true,
        otherParticipant: other
      };
    });
  }, [conversations, onlineUsers]);

  const filteredChats = mappedChats.filter(chat => {
    const matchesCategory = activeCategory === 'all' || chat.type === activeCategory;
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="noise-overlay opacity-[0.03]" />

      {/* Header */}
      <header className="relative z-10 px-6 pt-12 pb-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                 <MessageSquare size={20} className="text-brand-primary" />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-tight italic">Work Inbox</h1>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Real-time Coordination</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active-scale">
                 <Settings size={18} className="text-white/40" />
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
           </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-6">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search messages, projects, or files..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/5 group-focus-within:border-brand-primary/40 focus:outline-none text-sm font-medium transition-all"
              />
           </div>

           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {[
                { id: 'all', label: 'Everything' },
                { id: 'projects', label: 'Bookings' },
                { id: 'training', label: 'Cohort' },
                { id: 'support', label: 'Support' }
              ].map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap active-scale ${activeCategory === cat.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {cat.label}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* Chat List */}
      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar py-4">
        {filteredChats.length > 0 ? (
          <div className="px-4 space-y-1">
            {filteredChats.map((chat) => (
              <motion.button 
                key={chat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onOpenConversation(chat)}
                className="w-full flex items-center gap-4 p-4 rounded-[1.75rem] hover:bg-white/5 group transition-all relative active-scale overflow-hidden"
              >
                {/* Status Indicator */}
                <div className="relative shrink-0">
                   <div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden relative grayscale-[0.2] group-hover:grayscale-0 transition-all">
                      <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                   </div>
                   {chat.online && (
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-black" />
                   )}
                </div>

                <div className="flex-1 text-left min-w-0">
                   <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xs font-black uppercase tracking-tight italic line-clamp-1">{chat.name}</h3>
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{chat.time}</span>
                   </div>
                   <p className="text-[11px] font-medium text-white/40 line-clamp-1 group-hover:text-white/60 transition-colors uppercase">
                      {chat.lastMessage}
                   </p>

                   {/* Project Context Tags */}
                   <div className="flex items-center gap-2 mt-2">
                      {chat.projectStatus && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                           <Briefcase size={8} className="text-blue-400" />
                           <span className="text-[7px] font-black text-blue-400 uppercase">{chat.projectStatus}</span>
                        </div>
                      )}
                      {chat.hasEscrow && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                           <DollarSign size={8} className="text-emerald-400" />
                           <span className="text-[7px] font-black text-emerald-400 uppercase">Escrow Active</span>
                        </div>
                      )}
                   </div>
                </div>

                {chat.unread > 0 && (
                  <div className="w-6 h-6 rounded-lg bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                     <span className="text-[10px] font-black">{chat.unread}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-20 gap-4">
             <MessageSquare size={64} strokeWidth={1} />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Conversations Found</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsNewChatOpen(true)}
        className="absolute bottom-10 right-6 w-16 h-16 rounded-[2rem] bg-brand-primary text-white flex items-center justify-center shadow-2xl shadow-brand-primary/40 active-scale group z-50 animate-bounce"
      >
         <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {/* Mini Activity Section */}
      <footer className="px-6 py-8 border-t border-white/5 bg-black/40 backdrop-blur-3xl safe-bottom">
         <div className="flex items-center justify-between mb-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Active Project Teams</h4>
            <ChevronRight size={14} className="text-white/20" />
         </div>
         <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-0.5">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Team${i}`} alt="Team" className="w-full h-full rounded-2xl" />
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Agency {i}</span>
              </div>
            ))}
            <button className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 hover:text-white/40 hover:border-white/20 transition-all">
               <Plus size={20} />
            </button>
         </div>
      </footer>

      {/* New Chat Modal Overlay */}
      <AnimatePresence>
         {isNewChatOpen && (
            <>
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.8 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setIsNewChatOpen(false)}
                 className="fixed inset-0 bg-black z-[120]"
               />
               <motion.div 
                 initial={{ y: '100%' }}
                 animate={{ y: 0 }}
                 exit={{ y: '100%' }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="fixed inset-x-0 bottom-0 z-[130] bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] max-h-[85vh] flex flex-col overflow-hidden pb-safe"
               >
                  <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 shrink-0" />
                  
                  <div className="px-6 pb-4 flex justify-between items-center shrink-0">
                     <div>
                        <h2 className="text-xl font-black uppercase tracking-tight italic">New Message</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Start Conversation</p>
                     </div>
                     <button 
                       onClick={() => setIsNewChatOpen(false)}
                       className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                     >
                       <X size={18} />
                     </button>
                  </div>

                  {/* Search Bar */}
                  <div className="px-6 pb-4 shrink-0">
                     <div className="relative group">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={18} />
                       <input 
                         type="text" 
                         placeholder="Search user by name or @username..." 
                         value={userSearchQuery}
                         onChange={e => setUserSearchQuery(e.target.value)}
                         className="w-full h-12 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/5 group-focus-within:border-brand-primary/40 focus:outline-none text-xs font-medium transition-all"
                       />
                     </div>
                  </div>

                  {/* Users List */}
                  <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-12">
                     {isSearchingUsers ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-60">
                           <Loader2 className="animate-spin text-brand-primary" size={24} />
                           <span className="text-[9px] font-black uppercase tracking-[0.2em]">Searching creators...</span>
                        </div>
                     ) : filteredProfiles.length > 0 ? (
                        <div className="space-y-1">
                           {filteredProfiles.map((p) => (
                              <button 
                                key={p.id}
                                onClick={async () => {
                                   setIsSearchingUsers(true);
                                   try {
                                      if (!user) return;
                                      const convId = await useChatStore.getState().getOrCreateConversation(user.id, p.id);
                                      setIsNewChatOpen(false);
                                      onClose();
                                      onOpenConversation({
                                         id: convId,
                                         name: p.full_name || p.username || 'Unknown Hustler',
                                         avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username || p.id}`,
                                         online: p.id ? Boolean(onlineUsers[p.id]) : false,
                                         otherParticipant: p
                                      });
                                   } catch (err) {
                                      console.error('Error starting conversation:', err);
                                   } finally {
                                      setIsSearchingUsers(false);
                                   }
                                }}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-left transition-all active-scale"
                              >
                                 <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
                                    <img 
                                      src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username || p.id}`} 
                                      alt={p.full_name || p.username}
                                      className="w-full h-full object-cover"
                                    />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black uppercase tracking-tight italic truncate">
                                       {p.full_name || 'Inactive Account'}
                                    </h4>
                                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5 truncate">
                                       @{p.username || 'user'}
                                    </p>
                                 </div>
                                 <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-primary">
                                    <ChevronRight size={16} />
                                 </div>
                              </button>
                           ))}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-16 opacity-30 gap-3">
                           <MessageSquare size={48} />
                           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">
                              No accounts found matching search query
                           </p>
                        </div>
                     )}
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </div>
  );
}
