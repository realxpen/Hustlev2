import { Request, Response } from "express";
import { bookingRepository, BookingEntity } from "../repositories/bookingRepository";
import { serviceRepository } from "../repositories/serviceRepository";
import { profileRepository } from "../repositories/profileRepository";
import { bookingEventService } from "../services/bookingEventService";

export class BookingController {
  
  /**
   * POST /booking
   * Creates a new booking proposal/request
   */
  public createBooking(req: Request, res: Response): void {
    try {
      const { serviceId, notes, timeline, customAmount, files } = req.body;
      const buyerId = (req as any).user?.id || "user-client-1";

      if (!serviceId) {
        res.status(400).json({ success: false, error: "The parameter serviceId is strictly required." });
        return;
      }

      const service = serviceRepository.findById(serviceId);
      if (!service) {
        res.status(404).json({ success: false, error: `Service with ID '${serviceId}' not found` });
        return;
      }

      const rawAmount = customAmount !== undefined ? Number(customAmount) : Number(service.base_price || 100);
      const bookingFiles = Array.isArray(files) ? files : [];

      const booking = bookingRepository.create({
        service_id: service.id,
        service_title: service.title,
        buyer_id: buyerId,
        seller_id: service.owner_id,
        amount: rawAmount,
        notes: notes || "Terms as specified under service description.",
        timeline: timeline || service.delivery_time || "7 Days",
        status: "pending",
        escrow_status: "none",
        payment_status: "unpaid",
        files: bookingFiles
      });

      // Dispatch event
      bookingEventService.dispatch("booking.created", {
        booking,
        timestamp: new Date().toISOString(),
        triggeredBy: "buyer"
      });

      res.status(201).json({
        success: true,
        message: "Booking proposal registered successfully. Awaiting provider accept.",
        data: this.enrichBookingPayload(booking)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to create booking" });
    }
  }

  /**
   * POST /booking/accept
   * Confirms proposal and transfers payment holdings inside secure escrow custody
   */
  public acceptBooking(req: Request, res: Response): void {
    try {
      const { bookingId } = req.body;
      const userId = (req as any).user?.id || "creator-marcus";

      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId is strictly required" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: "Booking contract was not found" });
        return;
      }

      if (booking.status !== "pending") {
        res.status(400).json({ success: false, error: `Cannot accept booking. Current status is '${booking.status}'` });
        return;
      }

      const updated = bookingRepository.update(bookingId, {
        status: "accepted",
        escrow_status: "held",
        payment_status: "held_in_escrow"
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "Failed to update booking ledger" });
        return;
      }

      // Dispatch event
      bookingEventService.dispatch("booking.accepted", {
        booking: updated,
        timestamp: new Date().toISOString(),
        triggeredBy: "seller"
      });

      res.status(200).json({
        success: true,
        message: "Hiring request accepted and payment successfully held in escrow custody.",
        data: this.enrichBookingPayload(updated)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to accept booking" });
    }
  }

  /**
   * POST /booking/start
   * Signal commencing of contract work
   */
  public startBooking(req: Request, res: Response): void {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId belongs strictly to required arguments" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: "Booking contract was not found" });
        return;
      }

      if (booking.status !== "accepted") {
        res.status(400).json({ success: false, error: `Invalid operation. Work can only start on 'accepted' bookings. Current status is '${booking.status}'` });
        return;
      }

      const updated = bookingRepository.update(bookingId, {
        status: "in_progress"
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "Database lock update failed" });
        return;
      }

      // Dispatch event
      bookingEventService.dispatch("booking.started", {
        booking: updated,
        timestamp: new Date().toISOString(),
        triggeredBy: "seller"
      });

      res.status(200).json({
        success: true,
        message: "Contract status turned to Active Work Commenced.",
        data: this.enrichBookingPayload(updated)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to start booking" });
    }
  }

  /**
   * POST /booking/deliver
   * Registers milestone assets, files and deliverables
   */
  public deliverBooking(req: Request, res: Response): void {
    try {
      const { bookingId, files } = req.body;
      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId is strictly required" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: "Booking contract was not found" });
        return;
      }

      if (booking.status !== "in_progress") {
        res.status(400).json({ success: false, error: `Deliverables can only be submitted for 'in_progress' active bookings. Current: '${booking.status}'` });
        return;
      }

      const incomingFiles = Array.isArray(files) ? files : [];
      const updatedFiles = Array.from(new Set([...booking.files, ...incomingFiles]));

      const updated = bookingRepository.update(bookingId, {
        status: "delivered",
        files: updatedFiles
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "Failed to persist delivery details" });
        return;
      }

      // Dispatch event
      bookingEventService.dispatch("booking.delivered", {
        booking: updated,
        timestamp: new Date().toISOString(),
        triggeredBy: "seller"
      });

      res.status(200).json({
        success: true,
        message: "Service deliverables successfully submitted. Client has been notified to inspect assets.",
        data: this.enrichBookingPayload(updated)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to deliver booking" });
    }
  }

  /**
   * POST /booking/complete
   * Release locked escrow custody funds to seller
   */
  public completeBooking(req: Request, res: Response): void {
    try {
      const { bookingId } = req.body;
      const userId = (req as any).user?.id || "user-client-1";

      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId is strictly required" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: "Booking contract was not found" });
        return;
      }

      if (booking.status === "completed") {
        res.status(400).json({ success: false, error: "Booking is already finalized and completed" });
        return;
      }

      const updated = bookingRepository.update(bookingId, {
        status: "completed",
        escrow_status: "disbursed",
        payment_status: "released"
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "Failed to save final authorization state" });
        return;
      }

      // Dispatch event
      bookingEventService.dispatch("booking.completed", {
        booking: updated,
        timestamp: new Date().toISOString(),
        triggeredBy: booking.buyer_id === userId ? "buyer" : "seller"
      });

      res.status(200).json({
        success: true,
        message: "Hustle contract successfully finalized. Locked balances released to specialist ledger.",
        data: this.enrichBookingPayload(updated)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to complete booking" });
    }
  }

  /**
   * POST /booking/cancel
   * Returns security hold or cancel the contract
   */
  public cancelBooking(req: Request, res: Response): void {
    try {
      const { bookingId, reason } = req.body;
      const userId = (req as any).user?.id || "user-client-1";

      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId is strictly required" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: "Booking contract was not found" });
        return;
      }

      if (booking.status === "completed" || booking.status === "cancelled") {
        res.status(400).json({ success: false, error: `Invalid release operation. Current status is already '${booking.status}'` });
        return;
      }

      const updated = bookingRepository.update(bookingId, {
        status: "cancelled",
        escrow_status: "refunded",
        payment_status: "refunded"
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "Failed to process refund cancellation" });
        return;
      }

      // Dispatch event
      bookingEventService.dispatch("booking.cancelled", {
        booking: updated,
        timestamp: new Date().toISOString(),
        triggeredBy: booking.buyer_id === userId ? "buyer" : "seller",
        notes: reason || "Voided agreement"
      });

      res.status(200).json({
        success: true,
        message: "Hustle booking successfully cancelled and voided. Held funds returned safely to client.",
        data: this.enrichBookingPayload(updated)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to cancel booking" });
    }
  }

  /**
   * POST /booking/dispute
   * Trigger formal dispute/arbitration state
   */
  public disputeBooking(req: Request, res: Response): void {
    try {
      const { bookingId, reason } = req.body;
      const userId = (req as any).user?.id || "user-client-1";

      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId is strictly required" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: "Booking contract was not found" });
        return;
      }

      if (booking.status === "completed" || booking.status === "cancelled") {
        res.status(400).json({ success: false, error: "Cannot file dispute on fully finalized or cancelled contracts" });
        return;
      }

      const updated = bookingRepository.update(bookingId, {
        status: "disputed",
        payment_status: "disputed"
      });

      if (!updated) {
        res.status(500).json({ success: false, error: "Failed to persist disputed status" });
        return;
      }

      // Dispatch event
      bookingEventService.dispatch("booking.disputed", {
        booking: updated,
        timestamp: new Date().toISOString(),
        triggeredBy: booking.buyer_id === userId ? "buyer" : "seller",
        notes: reason || "Disciplinary arbitration initiated"
      });

      res.status(200).json({
        success: true,
        message: "Contract flagged for dispute resolution. Escrow locked temporarily.",
        data: this.enrichBookingPayload(updated)
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to dispute booking" });
    }
  }

  /**
   * Helper to retrieve all event audit tracker logs for a booking
   */
  public getBookingLogs(req: Request, res: Response): void {
    try {
      const rawBookingId = req.params.bookingId;
      const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
      if (!bookingId) {
        res.status(400).json({ success: false, error: "Booking ID path parameter is required" });
        return;
      }
      const logs = bookingEventService.getAuditLogs(bookingId);
      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to load audit logs" });
    }
  }

  /**
   * Helper payload enricher to yield provider, client, timeline, and files in a clean response format
   */
  private enrichBookingPayload(booking: BookingEntity): any {
    const sellerProfile = profileRepository.findById(booking.seller_id);
    const buyerProfile = profileRepository.findById(booking.buyer_id);

    return {
      id: booking.id,
      service_id: booking.service_id,
      service_title: booking.service_title,
      timeline: booking.timeline,
      notes: booking.notes,
      amount: booking.amount,
      status: booking.status,
      escrow_status: booking.escrow_status,
      payment_status: booking.payment_status,
      files: booking.files,
      provider: sellerProfile ? {
        id: sellerProfile.id,
        fullName: sellerProfile.fullName,
        avatarUrl: sellerProfile.avatarUrl,
        role: "Hustler"
      } : { id: booking.seller_id, fullName: "Marcus V.", role: "Hustler" },
      client: buyerProfile ? {
        id: buyerProfile.id,
        fullName: buyerProfile.fullName,
        avatarUrl: buyerProfile.avatarUrl,
        role: "Client"
      } : { id: booking.buyer_id, fullName: "Elena S.", role: "Client" },
      created_at: booking.created_at,
      updated_at: booking.updated_at
    };
  }
}

export const bookingController = new BookingController();
