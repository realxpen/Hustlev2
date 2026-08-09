import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { supabase } from '../../../lib/supabase';
import type { ChatMessage } from '../../../types/chat';

interface ChatRoomProps {
    roomId: string;
    hustlerProfile: {
        id: string;
        username: string;
        full_name: string;
    };
    onLaunchEscrowWizard: () => void;
    onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
    roomId,
    hustlerProfile,
    onLaunchEscrowWizard,
    onClose
}) => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Initial configuration load and message history state compilation
    useEffect(() => {
        const loadConversationHistory = async () => {
            // Guest demo lookahead bypass settings
            if (!user || user.id.startsWith('guest-')) {
                setMessages([
                    {
                        id: 'msg_001',
                        room_id: roomId,
                        sender_id: hustlerProfile.id,
                        text_content: `Hello! I saw you were looking at my app architecture showcase video clip. Let me know what features you want configured for your project ecosystem!`,
                        created_at: new Date(Date.now() - 3600000).toISOString()
                    }
                ]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                if (data) setMessages(data as ChatMessage[]);
            } catch (err) {
                console.error('[Chat Engine Sync Fail]', err);
            }
        };

        loadConversationHistory();

        // 2. Continuous real-time subscription stream setup using native Supabase broadcast channel channels
        if (user && !user.id.startsWith('guest-')) {
            const chatChannel = supabase.channel(`room:${roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}` // Explicitly type payload to fix 'any' type error
                }, (payload: { new: ChatMessage }) => {
                    setMessages((prev) => [...prev, payload.new as ChatMessage]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(chatChannel);
            };
        }
    }, [roomId, user, hustlerProfile.id]);

    // Handle snapping focus container layout items down to screen footing bounds continuously
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim() || !user) return;

        const temporaryText = newMessageText;
        setNewMessageText('');
        setIsSubmitting(true);

        // Guest fallback processing sequence mockup loop parameters
        if (user.id.startsWith('guest-')) {
            const generatedGuestMsg: ChatMessage = {
                id: `msg_local_${Math.random().toString(36).substr(2, 9)}`,
                room_id: roomId,
                sender_id: user.id,
                text_content: temporaryText,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, generatedGuestMsg]);
            setIsSubmitting(false);

            // Trigger automatic structural mock replies matching client lifecycle milestones requirements
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: `msg_local_reply`,
                    room_id: roomId,
                    sender_id: hustlerProfile.id,
                    text_content: "Sounds fantastic! Tap the 'Set Milestones' button above so we can finalize prices and load them straight into secure escrow contracts instantly.",
                    created_at: new Date().toISOString()
                }]);
            }, 1000);
            return;
        }

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    sender_id: user.id,
                    text_content: temporaryText
                });

            if (error) throw error;
        } catch (err: any) {
            console.error('[Transmission drop]', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-zinc-950 z-40 flex flex-col text-white select-none animate-slide-up">

            {/* Upper Navigation Identity Control Track Bar */}
            <div className="w-full bg-zinc-900/60 backdrop-blur-md px-4 py-3 border-b border-zinc-900 flex items-center justify-between mt-8">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 text-lg font-bold cursor-pointer shrink-0">
                        ←
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h3 className="font-black text-sm text-zinc-100 truncate">{hustlerProfile.full_name}</h3>
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">@{hustlerProfile.username}</p>
                    </div>
                </div>

                {/* Dynamic Context Action Shortcut to lock deal parameters on the spot */}
                <button
                    onClick={onLaunchEscrowWizard}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg transition transform active:scale-95 cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
                >
                    🤝 Set Milestones
                </button>
            </div>

            {/* Main Conversation Thread Viewport Scrolling Track Space */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5 hide-scrollbar">
                {messages.map((msg) => {
                    const isSenderMe = user ? msg.sender_id === user.id : false;
                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col max-w-[80%] ${isSenderMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                            <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-md ${isSenderMe
                                    ? 'bg-amber-500 text-black rounded-tr-none font-semibold'
                                    : 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800/40'
                                }`}>
                                {msg.text_content}
                            </div>
                            <span className="text-[9px] text-zinc-600 mt-1 font-semibold tracking-wide">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Footer Text Message Entry Panel Field Node Form Control */}
            <form
                onSubmit={handleSendMessage}
                className="p-3 bg-zinc-900/40 backdrop-blur-md border-t border-zinc-900 flex gap-2 items-center pb-6"
            >
                <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={isSubmitting}
                    placeholder={`Type message to negotiate contract variables...`}
                    className="flex-1 bg-zinc-900 border border-zinc-800/80 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 font-medium"
                />
                <button
                    type="submit"
                    disabled={!newMessageText.trim() || isSubmitting}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer border border-zinc-800/60"
                >
                    Send
                </button>
            </form>

        </div>
    );
};