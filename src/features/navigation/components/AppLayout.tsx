import React, { useState } from 'react';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { DiscoveryFeed } from '../../feed/components/DiscoveryFeed';
import { UploadShowcaseForm } from '../../feed/components/UploadShowcaseForm';

// Simple placeholder tabs for other system spaces to keep concerns clean
const PlaceholderView: React.FC<{ name: string }> = ({ name }) => (
    <div className="w-full h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 p-4">
        <p className="text-sm font-semibold tracking-wider uppercase">{name} Layer View</p>
        <p className="text-xs text-zinc-600 mt-1">Unified Progressive Application Context</p>
    </div>
);

export const AppLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'chat' | 'hustler_ledger' | 'agent_dashboard'>('feed');
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Destructure reactive boolean permission layers from your master useAuthStore
    const { isHustlerVerified, isAgentVerified, profile } = useAuthStore();

    const handleUploadSuccess = () => {
        alert('🎉 Proof-of-work video broadcasted successfully to the public stream!');
        setIsUploadOpen(false);
    };

    const renderActiveViewport = () => {
        switch (activeTab) {
            case 'feed':
                return <DiscoveryFeed />;
            case 'explore':
                return <PlaceholderView name="Explore Services" />;
            case 'chat':
                return <PlaceholderView name="Messages Engine" />;

            case 'hustler_ledger':
                // Integrated progressive capability panel workspace
                return (
                    <div className="w-full h-screen bg-zinc-950 p-6 pt-12 flex flex-col gap-6 text-white overflow-y-auto pb-24">
                        <div>
                            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Additive Capability Suite</span>
                            <h2 className="text-xl font-black mt-0.5">Professional Workspace</h2>
                            <p className="text-xs text-zinc-400 mt-0.5">Manage proof showcases and transactional earnings items</p>
                        </div>

                        {/* Quick Summary Performance Counters Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Escrow Balance</span>
                                <span className="text-lg font-black text-emerald-400 mt-1">₦ 380,000</span>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Rating Metric</span>
                                <span className="text-lg font-black text-amber-400 mt-1">4.95 ★</span>
                            </div>
                        </div>

                        {/* Unified Showcase Broadcast Activation Trigger */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-3">
                            <div>
                                <h4 className="font-bold text-sm">Content is your new résumé</h4>
                                <p className="text-xs text-zinc-400 font-light mt-1 leading-relaxed">
                                    Upload a fresh vertical video clip showing off your active skills. Tag an on-demand service pricing tier to allow prospective clients to hire you instantly from their stream feed view.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUploadOpen(true)}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase tracking-wider rounded-xl transition transform active:scale-95 text-center cursor-pointer shadow-lg"
                            >
                                + Broadcast Proof-of-Work
                            </button>
                        </div>
                    </div>
                );

            case 'agent_dashboard':
                return <PlaceholderView name="Agent Dispatch Metrics" />;
            default:
                return <DiscoveryFeed />;
        }
    };

    return (
        <div className="w-full h-screen bg-black relative overflow-hidden flex flex-col select-none">

            {/* Primary Dynamic Main Context Viewport Area */}
            <div className="w-full flex-1 relative overflow-hidden">
                {renderActiveViewport()}
            </div>

            {/* Sticky Bottom Navigation Track Bar */}
            <nav className={`absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-3 backdrop-blur-md transition-colors duration-150 ${activeTab === 'feed'
                    ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent border-t border-transparent'
                    : 'bg-zinc-950 border-t border-zinc-900'
                }`}>

                <button
                    onClick={() => setActiveTab('feed')}
                    className={`flex flex-col items-center gap-1 cursor-pointer min-w-[60px] transition-all ${activeTab === 'feed' ? 'text-amber-400 scale-105 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <span className="text-xl">📺</span>
                    <span className="text-[10px] tracking-wide font-medium">Feed</span>
                </button>

                <button
                    onClick={() => setActiveTab('explore')}
                    className={`flex flex-col items-center gap-1 cursor-pointer min-w-[60px] transition-all ${activeTab === 'explore' ? 'text-amber-400 scale-105 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <span className="text-xl">🔍</span>
                    <span className="text-[10px] tracking-wide font-medium">Search</span>
                </button>

                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex flex-col items-center gap-1 cursor-pointer min-w-[60px] transition-all ${activeTab === 'chat' ? 'text-amber-400 scale-105 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <span className="text-xl">💬</span>
                    <span className="text-[10px] tracking-wide font-medium">Chat</span>
                </button>

                {/* Progressive Expansion Link Item: Workspace */}
                {isHustlerVerified && (
                    <button
                        onClick={() => setActiveTab('hustler_ledger')}
                        className={`flex flex-col items-center gap-1 cursor-pointer min-w-[60px] transition-all animate-fade-in ${activeTab === 'hustler_ledger' ? 'text-amber-400 scale-105 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        <span className="text-xl">💼</span>
                        <span className="text-[10px] tracking-wide font-bold text-amber-500/90">Workspace</span>
                    </button>
                )}

                {/* Progressive Expansion Link Item: Agent Center */}
                {isAgentVerified && (
                    <button
                        onClick={() => setActiveTab('agent_dashboard')}
                        className={`flex flex-col items-center gap-1 cursor-pointer min-w-[60px] transition-all animate-fade-in ${activeTab === 'agent_dashboard' ? 'text-amber-400 scale-105 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        <span className="text-xl">🛡️</span>
                        <span className="text-[10px] tracking-wide font-bold text-teal-400">Agent</span>
                    </button>
                )}
            </nav>

            {/* Slide-Up Video Content Upload Engine Sheet Overlay */}
            {isUploadOpen && (
                <UploadShowcaseForm
                    onClose={() => setIsUploadOpen(false)}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
};