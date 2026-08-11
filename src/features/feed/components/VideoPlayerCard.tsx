import React, { useEffect, useRef, useState } from 'react';
import type { FeedPost } from '../../../types/feed';
import { useFeedStore } from '../stores/useFeedStore';
import { BookingWizard } from '../../bookings/components/BookingWizard';
import { ProfileOverlaySheet } from '../../profile/components/ProfileOverlaySheet'; // Imported context element

interface VideoPlayerCardProps {
    post: FeedPost;
    isActive: boolean;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({ post, isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // New modal tracking visibility variable state parameters
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const { incrementLikes, incrementViews } = useFeedStore();

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Freeze canvas element if any top layer drawer layout overlay assumes visual precedence
                if (entry.isIntersecting && isActive && !isWizardOpen && !isProfileOpen) {
                    videoElement.play()
                        .then(() => {
                            setIsPlaying(true);
                            incrementViews(post.id);
                        })
                        .catch((err) => console.log('[Autoplay muted browser safeguard]', err));
                } else {
                    videoElement.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.6 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [isActive, post.id, incrementViews, isWizardOpen, isProfileOpen]);

    // Handle cross-modal video playback synchronization patterns
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive && !isWizardOpen && !isProfileOpen) {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, [isActive, isWizardOpen, isProfileOpen]);

    const togglePlayback = () => {
        if (isWizardOpen || isProfileOpen) return;
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    };

    return (
        <div
            ref={containerRef}
            className="snap-start snap-always w-full h-screen bg-black relative flex flex-col items-center justify-center overflow-hidden"
        >
            <video
                ref={videoRef}
                src={post.video_url}
                className="w-full h-full object-cover cursor-pointer"
                loop
                playsInline
                muted={isMuted}
                onClick={togglePlayback}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none z-10" />

            {/* Action Engagement Controls */}
            <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-20 text-white">

                {/* Clickable Avatar Anchor Node — Updates context parameters instantaneously */}
                <div
                    onClick={() => setIsProfileOpen(true)}
                    className="flex flex-col items-center cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-zinc-800 flex items-center justify-center font-bold text-amber-400 shadow-xl overflow-hidden transition-transform transform group-hover:scale-105">
                        {post.hustler.full_name ? post.hustler.full_name.charAt(0) : 'H'}
                    </div>
                </div>

                <button
                    onClick={() => incrementLikes(post.id)}
                    className="flex flex-col items-center justify-center p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition group border border-white/10 cursor-pointer"
                >
                    <span className="text-xl transition-transform transform group-hover:scale-110">❤️</span>
                    <span className="text-xs font-bold mt-1">{post.likes_count}</span>
                </button>

                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex flex-col items-center justify-center p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition border border-white/10 cursor-pointer"
                >
                    <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
                </button>
            </div>

            {/* Metadata Panel strip */}
            <div className="absolute left-4 right-20 bottom-8 z-20 text-white flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    {/* Subtitle Username Handle Anchor trigger link */}
                    <h3
                        onClick={() => setIsProfileOpen(true)}
                        className="font-bold text-base tracking-wide cursor-pointer hover:underline"
                    >
                        @{post.hustler.username}
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-md uppercase tracking-wider">
                        Verified Proof
                    </span>
                </div>

                <p className="font-semibold text-sm text-zinc-100">{post.title}</p>
                <p className="text-xs text-zinc-300 line-clamp-2 max-w-md font-light leading-relaxed">{post.description}</p>

                {post.service_id && (
                    <div className="mt-3 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 p-3 rounded-xl flex items-center justify-between shadow-2xl max-w-sm w-full">
                        <div className="flex flex-col pr-2">
                            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Available Service</span>
                            <span className="text-xs font-bold text-zinc-200 line-clamp-1">{post.service_title}</span>
                            <span className="text-sm font-black text-amber-400 mt-0.5">
                                {post.currency || 'NGN'} {post.service_starting_price?.toLocaleString()}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-lg uppercase tracking-wider transition-all transform active:scale-95 shrink-0 shadow-lg"
                        >
                            Hire Me
                        </button>
                    </div>
                )}
            </div>

            {/* Escrow Booking Wizard Overlay Layer */}
            {isWizardOpen && (
                <BookingWizard
                    post={post}
                    onClose={() => setIsWizardOpen(false)}
                    onSuccess={(id) => {
                        alert(`🎉 Escrow contract live! Token ID: ${id}`);
                        setIsWizardOpen(false);
                    }}
                />
            )}

            {/* Slide-Up Profile Overlay Reputations Sheet layer */}
            {isProfileOpen && (
                <ProfileOverlaySheet
                    hustlerId={post.hustler_id}
                    onClose={() => setIsProfileOpen(false)}
                    onDirectHireTrigger={() => {
                        setIsProfileOpen(false); // Close profile sheet
                        setIsWizardOpen(true); // Transmit context immediately into payment stream seamlessly
                    }}
                />
            )}
        </div>
    );
};