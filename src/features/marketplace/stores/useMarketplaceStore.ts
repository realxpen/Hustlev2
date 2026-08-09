import { create } from "zustand";
import { BookingService } from "../services/bookingService";
import { HustleServiceItem } from "../../../components/discovery/HireFlowModal";

interface MarketplaceState {
  isSubmittingBooking: boolean;
  bookingError: string | null;
  activeBookingId: string | null;
  
  executeEscrowBooking: (
    service: HustleServiceItem,
    notes: string,
    timeline: string,
    attachments: File[]
  ) => Promise<boolean>;
  
  clearBookingState: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  isSubmittingBooking: false,
  bookingError: null,
  activeBookingId: null,

  executeEscrowBooking: async (service, notes, timeline, attachments) => {
    set({ isSubmittingBooking: true, bookingError: null, activeBookingId: null });
    
    const outcome = await BookingService.createEscrowBooking(service, notes, timeline, attachments);
    
    if (outcome.success) {
      set({ 
        isSubmittingBooking: false, 
        activeBookingId: outcome.bookingId || "generated-fallback-id" 
      });
      return true;
    } else {
      set({ 
        isSubmittingBooking: false, 
        bookingError: outcome.error || "An unknown marketplace transaction error occurred." 
      });
      return false;
    }
  },

  clearBookingState: () => set({ bookingError: null, activeBookingId: null, isSubmittingBooking: false })
}));