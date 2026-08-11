import React, { useEffect, useRef, useState } from 'react';

interface ContentPost {
    id: string;
    video_url: string;
    is_liked_by_user?: boolean;
    provider: {
        id?: string;
        name: string;
        avatar_url?: string;
        trust_score?: number;
    };
    skill_tag?: string;
    description?: string;
    likes_count?: number;
}

interface VideoPlayerCardProps {
    post: ContentPost;
    isActive: boolean;
    onHireTrigger: (post: ContentPost) => void;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({ post, isActive, onHireTrigger }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false);

    useEffect(() => {
        if (videoRef.current) {
            if (isActive) {
                videoRef.current.play().catch((err) => console.log("Autoplay blocked:", err));
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isActive]);

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center snap-start overflow-hidden">
            {/* Video Viewport */}
            <video
                ref={videoRef}
                src={post.video_url}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
            />

            {/* Info Context Floating Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent flex justify-between items-end z-10">
                <div className="flex-1 pr-8 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <img src={post.provider.avatar_url} alt="" className="w-10 h-10 rounded-full border border-cyan-400 object-cover" />
                        <div>
                            <h3 className="font-bold text-sm">{post.provider.name}</h3>
                            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30">
                                <span>★</span> {post.provider.trust_score} Trust Score
                            </div>
                        </div>
                    </div>
                    <span className="inline-block bg-cyan-500/20 border border-cyan-400 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-semibold mb-2">
                        #{post.skill_tag}
                    </span>
                    <p className="text-sm line-clamp-3 text-gray-200">{post.description}</p>
                </div>

                {/* Tactical Right Actions Tray */}
                <div className="flex flex-col items-center gap-6 text-white pb-4">
                    <button onClick={() => setIsLiked(!isLiked)} className="flex flex-col items-center gap-1 group">
                        <span className={`text-2xl transition-transform group-active:scale-125 ${isLiked ? 'text-red-500' : 'text-white'}`}>
                            ♥
                        </span>
                        <span className="text-xs text-gray-400">{(post.likes_count || 0) + (isLiked ? 1 : 0)}</span>
                    </button>

                    <button
                        onClick={() => onHireTrigger(post)}
                        className="w-12 h-12 rounded-full bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/20 text-black hover:scale-105 transition-transform"
                    >
                        ⚡
                    </button>
                    <span className="text-[10px] font-black tracking-wider text-cyan-400">HIRE</span>
                </div>
            </div>
        </div>
    );
};