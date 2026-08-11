import React, { useEffect } from 'react';
import { useFeedStore } from '../stores/useFeedStore';
import { VideoPlayerCard } from './VideoPlayerCard';

export const DiscoveryFeed: React.FC = () => {
    const { posts, currentPostIndex, setCurrentPostIndex, fetchDiscoveryFeed, isLoading } = useFeedStore();

    useEffect(() => {
        // Initial data fetch configuration layer mounting parameters
        fetchDiscoveryFeed(true);
    }, [fetchDiscoveryFeed]);

    const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;

        // Evaluate active viewport slice index calculations matching scroll height physics
        const nextIndex = Math.round(scrollTop / viewportHeight);

        if (nextIndex !== currentPostIndex && nextIndex >= 0 && nextIndex < posts.length) {
            setCurrentPostIndex(nextIndex);

            // Trigger prospective loadahead paging request rules if user approaches stack termination bounds
            if (nextIndex >= posts.length - 2) {
                fetchDiscoveryFeed();
            }
        }
    };

    if (isLoading && posts.length === 0) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-zinc-400 gap-3">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Compiling Discovery Streams...</p>
            </div>
        );
    }

    return (
        <div
            className="w-full h-screen bg-black snap-y snap-mandatory overflow-y-scroll scroll-smooth hide-scrollbar"
            onScroll={handleContainerScroll}
            style={{ WebkitOverflowScrolling: 'touch' }} // Smooth momentum scrolling on mobile safari devices
        >
            {posts.map((post, idx) => (
                <VideoPlayerCard
                    key={post.id}
                    post={post}
                    isActive={idx === currentPostIndex}
                />
            ))}
        </div>
    );
};