import React, { useState } from "react";
import { FeedVideoCard } from "./FeedVideoCard";
import { HireFlowModal, HustleServiceItem } from "../../../components/discovery/HireFlowModal";
import { useMarketplaceStore } from "../../marketplace/stores/useMarketplaceStore";
import { AnimatePresence } from "framer-motion";

// Seeding standard video objects using vertical format video sample streams
const SEEDED_DISCOVERY_VIDEOS = [
    {
        id: "v-1",
        media_url: "https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-close-up-41618-large.mp4",
        title: "Fresh low fade drop texture cut",
        content: "Slots opening up for the weekend rush in Lekki Phase 1. Guarantee pristine detailing. Book blueprint parameters via terminal instantly.",
        category: "Grooming & Styles",
        likes_count: 1420,
        comments_count: 88,
    },
    {
        id: "v-2",
        media_url: "https://assets.mixkit.co/videos/preview/mixkit-woman-welding-metal-in-a-workshop-42242-large.mp4",
        title: "Custom geometric security steel casing construction",
        content: "Structural reinforcements arc welding testing. Fabricating customized parameters for domestic compounds directly across mainland lagos.",
        category: "Welding & Metallurgy",
        likes_count: 945,
        comments_count: 42,
    }
];

export function MainFeedDiscovery() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedService, setSelectedService] = useState<HustleServiceItem | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Extract Option B data pipeline controls from global Zustand store
    const { executeEscrowBooking, isSubmittingBooking } = useMarketplaceStore();

    const handleScrollEvent = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollPosition = container.scrollTop;
        const viewHeight = container.clientHeight;

        // Mathematically deduce active swipe pagination item index context
        const currentComputedIndex = Math.round(scrollPosition / viewHeight);
        if (currentComputedIndex !== activeIndex) {
            setActiveIndex(currentComputedIndex);
        }
    };

    const handleConfirmBookingDispatch = async (payload: {
        service: HustleServiceItem;
        notes: string;
        timeline: string;
        attachments: File[];
    }) => {
        // Prevent double execution faults while backend network transit is resolving
        if (isSubmittingBooking) return;

        const wasSecured = await executeEscrowBooking(
            payload.service,
            payload.notes,
            payload.timeline,
            payload.attachments
        );

        if (wasSecured) {
            alert("🔒 Escrow Hold Active! The payment routing agreement has been initialized on the backend ledger.");
            setSelectedService(null); // Collapse hiring workflow modal container upon absolute validation confirmation
        } else {
            const errorMsg = useMarketplaceStore.getState().bookingError;
            alert(`⚠️ Escrow Transaction Halted: ${errorMsg || "Unknown verification fault."}`);
        }
    };

    return (
        <div className="relative w-full h-[100vh] bg-black overflow-hidden">
            {/* Scroll Viewport Loop Room */}
            <div
                ref={containerRef}
                onScroll={handleScrollEvent}
                className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {SEEDED_DISCOVERY_VIDEOS.map((videoPost, idx) => (
                    <FeedVideoCard
                        key={videoPost.id}
                        post={videoPost}
                        isActive={idx === activeIndex}
                        onHireClick={(service) => setSelectedService(service)}
                    />
                ))}
            </div>

            {/* Mounting Secure Escrow Hiring Wizard Overlay on Trigger Click */}
            <AnimatePresence>
                {selectedService && (
                    <HireFlowModal
                        service={selectedService}
                        displayCurrency="USD"
                        onClose={() => !isSubmittingBooking && setSelectedService(null)}
                        onConfirmHire={handleConfirmBookingDispatch}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}