import { create } from "zustand";
import { BookingService } from "../services/bookingService";
import { HustleServiceItem } from "../../../components/discovery/HireFlowModal";

interface MarketplaceState {
  isSubmittingBooking: boolean;
  bookingError: string | null;
  activeBookingId: string | null;
  services: any[];
  isLoading: boolean;
  error: string | null;

  executeEscrowBooking: (
    service: HustleServiceItem,
    notes: string,
    timeline: string,
    attachments: File[]
  ) => Promise<boolean>;
  fetchMarketplaceListings: () => Promise<any[]>;
  createService: (payload: any) => Promise<any>;
  createProduct: (payload: any) => Promise<any>;
  createTraining: (payload: any) => Promise<any>;
  clearBookingState: () => void;
}

const createMockServices = () => [
  {
    id: "service-demo-1",
    owner_id: "guest-wqtg1i7",
    title: "Signature Clean Fade & Beard Grooming",
    description: "Premium precision barbershop experience with a tailored cut and beard finish.",
    category: "Barbers",
    pricing_type: "fixed",
    base_price: 45,
    delivery_time: "1 Hour",
    media: [{ url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop", type: "image" }],
    tags: ["Barber", "Fade", "Shave"],
    is_active: true,
    is_archived: false,
    rating_average: 4.9,
    reviews_count: 42,
    completion_rate: 100,
    location_mode: "local",
    distance_km: 0.4,
    verified: true,
    available_now: true,
    profiles: {
      id: "guest-wqtg1i7",
      full_name: "Ade Benson",
      hustle_name: "Ade's Cuts",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=AdeCuts",
      verified: true,
      primary_skill: "Master Barber",
      rating_average: 4.9,
      review_count: 42
    }
  },
  {
    id: "service-demo-2",
    owner_id: "guest-wqtg1i7",
    title: "Custom Traditional Ankara & Lace Gowns",
    description: "Bespoke high-fashion tailoring for premium events and traditional functions.",
    category: "Tailors",
    pricing_type: "custom",
    base_price: 320,
    delivery_time: "7 Days",
    media: [{ url: "https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=600&auto=format&fit=crop", type: "image" }],
    tags: ["Tailoring", "Traditional", "Ankara"],
    is_active: true,
    is_archived: false,
    rating_average: 5.0,
    reviews_count: 67,
    completion_rate: 98,
    location_mode: "local",
    distance_km: 1.2,
    verified: true,
    available_now: true,
    profiles: {
      id: "guest-wqtg1i7",
      full_name: "Maya S.",
      hustle_name: "Maya Tailor",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=MayaTailor",
      verified: true,
      primary_skill: "Traditional Tailor",
      rating_average: 5.0,
      review_count: 67
    }
  }
];

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  isSubmittingBooking: false,
  bookingError: null,
  activeBookingId: null,
  services: createMockServices(),
  isLoading: false,
  error: null,

  executeEscrowBooking: async (service, notes, timeline, attachments) => {
    set({ isSubmittingBooking: true, bookingError: null, activeBookingId: null, error: null });

    const outcome = await BookingService.createEscrowBooking(service, notes, timeline, attachments);

    if (outcome.success) {
      set({
        isSubmittingBooking: false,
        activeBookingId: outcome.bookingId || "generated-fallback-id"
      });
      return true;
    }

    set({
      isSubmittingBooking: false,
      bookingError: outcome.error || "An unknown marketplace transaction error occurred.",
      error: outcome.error || "An unknown marketplace transaction error occurred."
    });
    return false;
  },

  fetchMarketplaceListings: async () => {
    set({ isLoading: true, error: null });
    const nextServices = createMockServices();
    set({ services: nextServices, isLoading: false });
    return nextServices;
  },

  createService: async (payload) => {
    const listing = {
      id: `service-${Date.now()}`,
      owner_id: "guest-wqtg1i7",
      title: payload.title,
      description: payload.description,
      category: payload.category || "Freelance & Digital",
      pricing_type: payload.pricing_type || "fixed",
      base_price: payload.base_price || 0,
      delivery_time: payload.delivery_time || "3 Days",
      media: payload.media || [],
      tags: payload.tags || [],
      is_active: true,
      is_archived: false,
      rating_average: 4.8,
      reviews_count: 0,
      completion_rate: 100,
      location_mode: "local",
      verified: true,
      available_now: true,
      profiles: {
        id: "guest-wqtg1i7",
        full_name: "Guest Hustler",
        hustle_name: "Guest Hustler",
        avatar_url: null,
        verified: true,
        primary_skill: payload.category || "Hustler"
      }
    };

    set((state) => ({ services: [listing, ...state.services] }));
    return listing;
  },

  createProduct: async (payload) => {
    const listing = {
      id: `product-${Date.now()}`,
      owner_id: "guest-wqtg1i7",
      title: payload.title,
      description: payload.description,
      category: payload.category || "Products",
      pricing_type: "fixed",
      base_price: payload.price || 0,
      media: payload.media || [],
      product_type: payload.product_type || "physical",
      inventory_count: payload.inventory_count || 1,
      is_active: true,
      is_archived: false,
      verified: true,
      profiles: {
        id: "guest-wqtg1i7",
        full_name: "Guest Hustler",
        avatar_url: null,
        verified: true
      }
    };

    set((state) => ({ services: [listing, ...state.services] }));
    return listing;
  },

  createTraining: async (payload) => {
    const listing = {
      id: `training-${Date.now()}`,
      owner_id: "guest-wqtg1i7",
      title: payload.title,
      description: payload.description,
      category: payload.category || "Training",
      pricing_type: "fixed",
      base_price: payload.price || 0,
      media: payload.media || [],
      training_type: payload.training_type || "recorded",
      is_active: true,
      is_archived: false,
      verified: true,
      profiles: {
        id: "guest-wqtg1i7",
        full_name: "Guest Hustler",
        avatar_url: null,
        verified: true
      }
    };

    set((state) => ({ services: [listing, ...state.services] }));
    return listing;
  },

  clearBookingState: () => set({ bookingError: null, activeBookingId: null, isSubmittingBooking: false, error: null })
}));