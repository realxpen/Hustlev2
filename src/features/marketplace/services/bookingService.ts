import { useAuthStore } from "../../auth/stores/useAuthStore";
import { HustleServiceItem } from "../../../components/discovery/HireFlowModal";

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
}

export class BookingService {
  /**
   * Dispatches the transactional booking configuration to the Express backend proxy.
   * Maps components down to match HUSTLE_BOOKING_SYSTEM_DATABASE_SCHEMA definitions.
   */
  static async createEscrowBooking(
    service: HustleServiceItem,
    notes: string,
    timeline: string,
    attachments: File[]
  ): Promise<BookingResponse> {
    
    // 1. Fetch current runtime bearer credentials from the global Auth Zustand state
    const { session } = useAuthStore.getState();
    const token = session?.access_token || localStorage.getItem("hustle_access_token") || "default-guest-hustler";

    // 2. Because attachments are raw binary files, we must compile a standard multi-part FormData payload
    const formData = new FormData();
    
    formData.append("serviceId", service.id);
    formData.append("providerId", service.owner_id);
    formData.append("notes", notes);
    formData.append("timeline", timeline);
    formData.append("basePrice", String(service.base_price));

    // Append files array sequentially for Multer array processing on the backend routing layer
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          // Note: Leave Content-Type header empty here so the browser can automatically set 
          // the boundary identifier for multi-part forms accurately
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || "Gateway verification failure: Escrow terms rejected by backend trigger logic."
        };
      }

      return {
        success: true,
        bookingId: result.bookingId
      };
    } catch (err: any) {
      console.error("Critical fault inside booking service integration network tier:", err);
      return {
        success: false,
        error: "Network validation timeout. Could not establish proxy handshakes with server controllers."
      };
    }
  }
}