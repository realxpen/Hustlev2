import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, Star, Heart, MessageCircle, Zap } from "lucide-react";
import { HustleServiceItem } from "../../../components/discovery/HireFlowModal";

interface FeedVideoCardProps {
    post: {
        id: string;
        media_url: string;
        title: string;
        content: string;
        likes_count: number;
        comments_count: number;
        category?: string;
        service?: HustleServiceItem; // Direct binding link to active service schema
    };
    isActive: boolean;
    onHireClick: (service: HustleServiceItem) => void;
}

export function FeedVideoCard({ post, isActive, onHireClick }: FeedVideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch((err) => console.warn("Autoplay blocked by client interactions:", err));
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
                setIsPlaying(false);
            }
        }
    }, [isActive]);

    const togglePlayState = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    // Fallback structures mapping down to metadata records inside post parameters
    const targetService = post.service || ({
        id: `srv-${post.id}`,
        owner_id: post.id,
        title: post.title,
        base_price: 15000,
        pricing_type: "fixed",
        category: post.category
    } as HustleServiceItem);

    const profile = targetService.profiles || {};
    const providerName = profile.hustle_name || profile.full_name || "Hustle Professional";
    const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`;

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center snap-start snap-always overflow-hidden">
            {/* HTML5 Native Video Stream Element */}
            <video
                ref={videoRef}
                src={post.media_url}
                loop
                muted
                playsInline
                className="w-full h-full object-cover cursor-pointer"
                onClick={togglePlayState}
            />

            {/* Visual Play State Overlay Indicator */}
            {!isPlaying && (
                <div
                    onClick={togglePlayState}
                    className="absolute inset-0 m-auto w-16 h-16 bg-black/40 backdrop-blur-xs rounded-full flex items-center justify-center text-white text-2xl z-10 animate-fade-in pointer-events-none"
                >
                    ▶
                </div>
            )}

            {/* Dark Linear Gradient Overlays for optimal content contrast */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Floating Left Side Metadata Canvas Overlay */}
            <div className="absolute bottom-6 left-4 right-16 z-20 text-white space-y-3 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/20 overflow-hidden shrink-0">
                        <img src={avatarUrl} alt={providerName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-[10px] text-white/60 font-medium flex items-center gap-1">
                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                            {Number(profile.rating_average || 4.9).toFixed(1)} Discovery Rating
                        </p>
                    </div>
                </div>

                <div>
                    <span className="inline-block bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md mb-1">
                        #{post.category || "Skill Showcase"}
                    </span>
                    <h4 className="text-sm font-bold text-gray-100 tracking-tight leading-snug">{post.title}</h4>
                    <p className="text-xs text-white/70 font-light line-clamp-2 mt-1 leading-relaxed">{post.content}</p>
                </div>
            </div>

            {/* Tactical Floating Right Actions Layout Tray */}
            <div className="absolute bottom-8 right-3 z-20 flex flex-col items-center gap-5">
                {/* Interaction Action: Likes */}
                <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1 group">
                    <span className={`text-2xl transition-transform group-active:scale-125 ${isLiked ? 'text-red-500' : 'text-white'}`}>
                        ♥
                    </span>
                    <span className="text-xs text-gray-400">{(post.likes_count || 0) + (isLiked ? 1 : 0)}</span>
                </button>

                {/* Interaction Action: Comments */}
                <button className="flex flex-col items-center gap-1 group">
                    <MessageCircle size={24} className="text-white fill-white/20 group-active:scale-95 transition-all" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">{post.comments_count}</span>
                </button>

                {/* Interaction Action: Hire */}
                {targetService && (
                    <button
                        onClick={() => onHireClick(targetService)}
                        className="flex flex-col items-center gap-1 group"
                    >
                        <Zap size={24} className="text-cyan-400 fill-cyan-400/20 group-active:scale-95 transition-all" />
                        <span className="text-[10px] font-bold text-cyan-400 drop-shadow-md">HIRE</span>
                    </button>
                )}
            </div>
        </div>
    );
}
