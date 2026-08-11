import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ExtendedHustlerProfile } from '../../../types/profileView';

// Define a local type that extends ExtendedHustlerProfile with the missing username property
// Define a local type for review items
interface Review {
    id: string;
    client_name: string;
    service_title: string;
    score_rating: number;
    review_text: string;
    completed_at: string;
    total_payout_amount: number;
    currency: string;
}

type ProfileWithUsername = ExtendedHustlerProfile & { username: string; bio: string | null; location?: string; completed_jobs_count: number; verified_credentials: string[]; reviews: Review[]; };
interface ProfileOverlaySheetProps {
    hustlerId: string;
    onClose: () => void;
    onDirectHireTrigger: () => void;
}

export const ProfileOverlaySheet: React.FC<ProfileOverlaySheetProps> = ({ // Changed type of profileData to include username
    hustlerId,
    onClose,
    onDirectHireTrigger
}) => {
    const [profileData, setProfileData] = useState<ProfileWithUsername | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetailedHustlerMetrics = async () => {
            setIsLoading(true);

            // Guest local dev fallback configuration bypass
            if (hustlerId.startsWith('guest') || hustlerId === 'usr_lagos_9081') {
                await new Promise((resolve) => setTimeout(resolve, 800));
                setProfileData({ // Fix: Assert the type of the mock data to ExtendedHustlerProfile
                    id: 'usr_lagos_9081', // Changed from hustler_id to id to match ExtendedHustlerProfile type
                    username: 'ayomide_dev',
                    full_name: 'Ayomide Oladeji',
                    avatar_url: null,
                    bio: 'Full Stack Native Platform Engineer specializing in high-performance marketplace mechanics.',
                    location: 'Lagos, Nigeria',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    hustler_title: 'Expert App Architect',
                    rating_average: 4.95,
                    completed_jobs_count: 34,
                    verified_credentials: ['Identity Verified', 'Lagos Tech Hub Certified Member'],
                    reviews: [
                        {
                            id: 'rev_001',
                            client_name: 'Chidi K.',
                            service_title: 'Full Stack Native App Development',
                            score_rating: 5,
                            review_text: 'Incredible speed. Optimized our image loading latency limits down completely over unstable mobile networks.',
                            completed_at: '2026-06-14',
                            total_payout_amount: 250000,
                            currency: 'NGN'
                        },
                        {
                            id: 'rev_002',
                            client_name: 'Funmi O.',
                            service_title: 'Database Pipeline Optimization',
                            score_rating: 4.9,
                            review_text: 'Clean code refactoring. Highly transparent milestone execution mapping throughout.',
                            completed_at: '2026-05-28',
                            total_payout_amount: 180000,
                            currency: 'NGN'
                        }
                    ]
                } as ProfileWithUsername); // Cast to the new type
                setIsLoading(false);
                return;
            }

            try {
                // Query server tables alongside mock data parameters
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', hustlerId)
                    .single();

                if (error) throw error;

                // Populate standard default primitives dynamically if table records have no extended reviews attached yet
                setProfileData({ // Cast to the new type
                    ...data,
                    completed_jobs_count: 0,
                    verified_credentials: ['Identity Verified'],
                    reviews: []
                } as ProfileWithUsername);
            } catch (err) {
                console.error('[Profile Engine Sync Fail]', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetailedHustlerMetrics();
    }, [hustlerId]);

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center select-none">
            <div className="w-full max-w-md bg-zinc-950 border-t border-zinc-900 rounded-t-2xl p-6 text-white max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up flex flex-col gap-5">

                {/* Pull Drawer Header Utility Bar */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Hustler Digital Résumé</h4>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white font-bold text-sm p-1 cursor-pointer">
                        ✕
                    </button>
                </div>

                {isLoading || !profileData ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Parsing reputation data...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 text-xs font-semibold">

                        {/* Top Identity Block Card */}
                        <div className="flex gap-4 items-center bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
                            <div className="w-14 h-14 bg-zinc-800 border-2 border-amber-500/60 rounded-full flex items-center justify-center font-black text-xl text-amber-400 shrink-0">
                                {profileData.full_name?.charAt(0) || 'H'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h3 className="font-black text-base text-zinc-100 truncate">{profileData.full_name}</h3>
                                <p className="text-zinc-400 font-medium text-xs mt-0.5">@{profileData.username}</p>
                                <p className="text-zinc-500 font-light text-[11px] mt-1">📍 {profileData.location || 'Lagos, Nigeria'}</p>
                            </div>
                        </div>

                        {/* Core Competency Metrics Scorecard Strip */}
                        <div className="grid grid-cols-3 bg-zinc-900/20 border border-zinc-900 rounded-xl py-3 text-center">
                            <div className="flex flex-col border-r border-zinc-900">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Historical Score</span>
                                <span className="text-sm font-black text-amber-400 mt-1">{profileData.rating_average ? `${profileData.rating_average} ★` : '—'}</span>
                            </div>
                            <div className="flex flex-col border-r border-zinc-900">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Jobs Done</span>
                                <span className="text-sm font-black text-zinc-200 mt-1">{profileData.completed_jobs_count} Jobs</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Status</span>
                                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 rounded-md py-0.5 px-1.5 self-center mt-1">Verified</span>
                            </div>
                        </div>

                        {/* Profile Bio Context Summary */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Bio Statement</label>
                            <p className="text-zinc-300 font-light leading-relaxed bg-zinc-900/20 p-3 rounded-xl border border-zinc-900/60">
                                {profileData.bio || 'This professional hasn’t configured a custom resume statement context yet.'}
                            </p>
                        </div>

                        {/* Verified Trust Credentials Badges List */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Trust Badges</label>
                            <div className="flex flex-wrap gap-2">
                                {profileData.verified_credentials.map((cred, index) => (
                                    <span key={index} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5">
                                        🛡️ {cred}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Client Reviews Ledger History Space */}
                        <div className="flex flex-col gap-2">
                            <label className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Verified Job Ledger History ({profileData.reviews.length})</label>
                            <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                                {profileData.reviews.length === 0 ? (
                                    <p className="text-zinc-600 font-light italic p-2">No historical escrow items logged for this provider profile yet.</p>
                                ) : (
                                    profileData.reviews.map((rev) => (
                                        <div key={rev.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800/40 flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-zinc-200 font-bold">{rev.client_name} — <strong className="text-zinc-400 font-light">{rev.service_title}</strong></span>
                                                <span className="text-amber-400 font-black shrink-0">{rev.score_rating} ★</span>
                                            </div>
                                            <p className="text-zinc-400 font-light text-[11px] leading-relaxed italic">
                                                "{rev.review_text}"
                                            </p>
                                            <div className="text-[9px] text-zinc-500 text-right uppercase tracking-wider font-bold">
                                                Released {rev.currency} {rev.total_payout_amount.toLocaleString()} • {rev.completed_at}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Dynamic Footing Direct Marketplace Call to Action */}
                        <button
                            onClick={onDirectHireTrigger}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-xl transition transform active:scale-95 shadow-xl mt-1 cursor-pointer"
                        >
                            Hire From Showcase Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};