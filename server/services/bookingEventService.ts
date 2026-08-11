import { EventEmitter } from "events";
import { BookingEntity } from "../repositories/bookingRepository";
import { notificationService } from "./notificationService";

// Define the event types of our booking system
export type BookingEventType = 
  | "booking.created"
  | "booking.accepted"
  | "booking.started"
  | "booking.delivered"
  | "booking.completed"
  | "booking.cancelled"
  | "booking.disputed";

export interface BookingEventPayload {
  booking: BookingEntity;
  timestamp: string;
  triggeredBy: string; // "buyer" | "seller" | "system"
  notes?: string;
}

// In-memory Event Log database for audit tracking
export interface EventAuditLog {
  id: string;
  eventType: BookingEventType;
  bookingId: string;
  triggeredBy: string;
  description: string;
  timestamp: string;
  metadata: any;
}

class BookingEventService extends EventEmitter {
  private auditLogs: EventAuditLog[] = [];

  constructor() {
    super();
    this.registerDefaultListeners();
  }

  /**
   * Emit a typed booking transition event
   */
  public dispatch(eventType: BookingEventType, payload: BookingEventPayload): void {
    console.log(`[EventService] Dispatching Event: ${eventType} for Booking: ${payload.booking.id}`);
    this.emit(eventType, payload);
    this.emit("*", { eventType, ...payload }); // Global wildcard listener
  }

  /**
   * Retrieve all logged events for diagnostic tracing or debugging
   */
  public getAuditLogs(bookingId?: string): EventAuditLog[] {
    if (bookingId) {
      return this.auditLogs.filter(log => log.bookingId === bookingId);
    }
    return this.auditLogs;
  }

  /**
   * Core reactive event-driven listeners
   */
  private registerDefaultListeners(): void {
    // 1. Unified Audit Trail Logger
    this.on("*", (payload: { eventType: BookingEventType } & BookingEventPayload) => {
      const description = this.generateDescription(payload.eventType, payload);
      const logEntry: EventAuditLog = {
        id: `evt-${Math.random().toString(36).substring(2, 11)}`,
        eventType: payload.eventType,
        bookingId: payload.booking.id,
        triggeredBy: payload.triggeredBy,
        description,
        timestamp: payload.timestamp,
        metadata: {
          amount: payload.booking.amount,
          paymentStatus: payload.booking.payment_status,
          filesCount: payload.booking.files.length,
          extraNotes: payload.notes
        }
      };
      
      this.auditLogs.unshift(logEntry);
      console.log(`[Audit Trail] (${payload.eventType}): ${description}`);
    });

    // 2. Real-time Escrow Custody Ledger updates listener + Event-driven Notifications
    this.on("booking.created", (payload: BookingEventPayload) => {
      console.log(`[Escrow Ledger] Initialized account holding record. Target Amount: $${payload.booking.amount}`);
      
      // Send priority notification to service provider
      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.seller_id,
        actor_id: payload.booking.buyer_id,
        type: "booking_new",
        entity_id: payload.booking.id,
        entity_type: "booking",
        message: `New booking request from Client for service "${payload.booking.service_title}" (₦${payload.booking.amount * 1000})`,
        priority: "high"
      });
    });

    this.on("booking.accepted", (payload: BookingEventPayload) => {
      console.log(`[Escrow Ledger] Secured and locked client funds in holding. Locked custody amount: $${payload.booking.amount}`);
      
      // Notify client immediately
      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.buyer_id,
        actor_id: payload.booking.seller_id,
        type: "booking_accepted",
        entity_id: payload.booking.id,
        entity_type: "booking",
        message: `Your booking for "${payload.booking.service_title}" has been accepted. Professional is now active!`,
        priority: "high"
      });
    });

    this.on("booking.delivered", (payload: BookingEventPayload) => {
      console.log(`[Escrow Ledger] Service delivered. Lock status remains held in custody. Files uploaded: [${payload.booking.files.join(", ")}]`);
      
      // Notify client to verify & release milestone funds
      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.buyer_id,
        actor_id: payload.booking.seller_id,
        type: "milestone_delivered",
         entity_id: payload.booking.id,
        entity_type: "booking",
        message: `Specialist has submitted files & completed the work. Please review and release escrow funds.`,
        priority: "high"
      });
    });

    this.on("booking.completed", (payload: BookingEventPayload) => {
      console.log(`[Escrow Ledger] Escrow Released! Disbursed $${payload.booking.amount} to specialist account: ${payload.booking.seller_id}`);
      
      // Notify professional that payout has landed safely
      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.seller_id,
        actor_id: payload.booking.buyer_id,
        type: "milestone_released",
         entity_id: payload.booking.id,
        entity_type: "booking",
        message: `Funds (₦${payload.booking.amount * 1000}) released! Payout has settled into your wallet.`,
        priority: "high"
      });

      // Notify client
      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.buyer_id,
        actor_id: payload.booking.seller_id,
        type: "booking_completed",
         entity_id: payload.booking.id,
        entity_type: "booking",
        message: `Perfect! Milestone finalized and payment released. Thank you for using Hustle.`,
        priority: "normal"
      });
    });

    this.on("booking.cancelled", (payload: BookingEventPayload) => {
      console.log(`[Escrow Ledger] Escrow Refunded. Returned custody balance of $${payload.booking.amount} back to client: ${payload.booking.buyer_id}`);
      
      const isBuyerCancelled = payload.triggeredBy === 'buyer';
      const targetUser = isBuyerCancelled ? payload.booking.seller_id : payload.booking.buyer_id;
      const initiator = isBuyerCancelled ? "Client" : "Professional";
      
      notificationService.createAndDeliverNotification({
        recipient_id: targetUser,
        actor_id: isBuyerCancelled ? payload.booking.buyer_id : payload.booking.seller_id,
        type: "booking_rejected",
        entity_id: payload.booking.id,
        entity_type: "booking",
        message: `The booking request was cancelled by the ${initiator}. Any held escrow funds have been refunded.`,
        priority: "high"
      });
    });

    this.on("booking.disputed", (payload: BookingEventPayload) => {
      console.log(`[Escrow Ledger] Escrow Suspended. Disputed state activated. locked funds ($${payload.booking.amount}) moved to quarantine awaiting arbitration.`);
      
      // Notify both parties of the formal dispute flag
      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.buyer_id,
        actor_id: null,
        type: "milestone_disputed",
        entity_id: payload.booking.id,
        entity_type: "booking",
        message: `Dispute activated. Locked funds moved to quarantine awaiting official support arbitration.`,
        priority: "high"
      });

      notificationService.createAndDeliverNotification({
        recipient_id: payload.booking.seller_id,
        actor_id: null,
        type: "milestone_disputed",
        entity_id: payload.booking.id,
        entity_type: "booking",
        message: `Dispute activated. Locked funds moved to quarantine awaiting official support arbitration.`,
        priority: "high"
      });
    });
  }

  private generateDescription(type: BookingEventType, payload: BookingEventPayload): string {
    const { booking, triggeredBy } = payload;
    switch (type) {
      case "booking.created":
        return `Booking scope request created for service "${booking.service_title}" with amount $${booking.amount}`;
      case "booking.accepted":
        return `Provider approved the contract terms. Escrow locked securely.`;
      case "booking.started":
        return `Work has officially commenced on this contract.`;
      case "booking.delivered":
        return `Hustler uploaded work artifacts and pending deliverables for verification.`;
      case "booking.completed":
        return `Client verified the work quality and authorized release of escrow funds.`;
      case "booking.cancelled":
        return `Booking was cancelled by the ${triggeredBy}. Held escrow bounds returned to the client.`;
      case "booking.disputed":
        return `Contract flagged for official dispute resolution by ${triggeredBy}. Arbitration pending.`;
      default:
        return `Status transitioned to ${booking.status}`;
    }
  }
}

export const bookingEventService = new BookingEventService();
