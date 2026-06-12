import crypto from "crypto";

export interface BookingEntity {
  id: string;
  service_id: string;
  service_title: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  notes: string;
  timeline: string;
  status: "pending" | "accepted" | "in_progress" | "delivered" | "completed" | "cancelled" | "disputed";
  escrow_status: "none" | "held" | "disbursed" | "refunded";
  payment_status: "unpaid" | "held_in_escrow" | "released" | "refunded" | "disputed";
  files: string[];
  created_at: string;
  updated_at: string;
}

export class BookingRepository {
  private bookings: Map<string, BookingEntity> = new Map();

  constructor() {
    this.seedBookings();
  }

  private seedBookings() {
    // Seed standard demo booking
    const now = new Date().toISOString();
    const demoBooking: BookingEntity = {
      id: "booking-demo-1",
      service_id: "service-marcus-1",
      service_title: "Elite Barber & Grooming Session",
      buyer_id: "user-client-1",
      seller_id: "creator-marcus",
      amount: 90,
      notes: "Please sculpt standard classic taper + medium beard volume shape up and finish trim.",
      timeline: "3 Days",
      status: "in_progress",
      escrow_status: "held",
      payment_status: "held_in_escrow",
      files: ["creative-brief-v2.pdf", "moodboard-inspiration.jpg"],
      created_at: now,
      updated_at: now
    };
    this.bookings.set(demoBooking.id, demoBooking);
  }

  public findById(id: string): BookingEntity | null {
    return this.bookings.get(id) || null;
  }

  public findByBuyerId(buyerId: string): BookingEntity[] {
    return Array.from(this.bookings.values()).filter(b => b.buyer_id === buyerId);
  }

  public findBySellerId(sellerId: string): BookingEntity[] {
    return Array.from(this.bookings.values()).filter(b => b.seller_id === sellerId);
  }

  public create(booking: Omit<BookingEntity, "id" | "created_at" | "updated_at"> & { id?: string }): BookingEntity {
    const id = booking.id || `booking-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const fullBooking: BookingEntity = {
      ...booking,
      id,
      created_at: now,
      updated_at: now
    };
    this.bookings.set(id, fullBooking);
    return fullBooking;
  }

  public update(id: string, updates: Partial<Omit<BookingEntity, "id" | "created_at" | "updated_at">>): BookingEntity | null {
    const booking = this.bookings.get(id);
    if (!booking) return null;

    const updated: BookingEntity = {
      ...booking,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.bookings.set(id, updated);
    return updated;
  }

  public findAll(): BookingEntity[] {
    return Array.from(this.bookings.values());
  }
}

export const bookingRepository = new BookingRepository();
