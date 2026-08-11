import { Request, Response } from "express";
import { bookingRepository, BookingEntity } from "../repositories/bookingRepository";
import { serviceRepository } from "../repositories/serviceRepository";
import { profileRepository } from "../repositories/profileRepository";

export class HireController {

  /**
   * POST /hire/request
   * Creates a new booking record inside escrow custody
   */
  public createHireRequest(req: Request, res: Response): void {
    try {
      const { serviceId, notes, timeline, customAmount } = req.body;
      
      // Attempt safe dynamic extraction of requester user context (default fallback if none is resolved)
      const buyerId = (req as any).user?.id || "user-client-1";

      if (!serviceId) {
        res.status(400).json({ success: false, error: "The parameter serviceId is strictly required" });
        return;
      }

      // Fetch target service catalog listing
      const service = serviceRepository.findById(serviceId);
      if (!service) {
        res.status(404).json({ success: false, error: `Catalog query failed. Service '${serviceId}' not found` });
        return;
      }

      // Calculate checkout values safely
      const rawPrice = customAmount !== undefined ? Number(customAmount) : Number(service.base_price || 0);

      // Construct a new persistent Booking Handshake in Escrow custody
      const bookingRecord = bookingRepository.create({
        service_id: service.id,
        service_title: service.title,
        buyer_id: buyerId,
        seller_id: service.owner_id,
        amount: rawPrice,
        notes: notes || "Standard deliverables request as per catalog specifications.",
        timeline: timeline || service.delivery_time || "Flexible Timeline",
        status: "in_progress", // Automatically locked inside secure holding by default
        escrow_status: "held",
        payment_status: "held_in_escrow",
        files: []
      });

      // Update provider analytics metrics: increase orders_count dynamic indicator
      try {
        serviceRepository.update(service.id, { orders_count: (service.orders_count || 0) + 1 });
      } catch (err) {
        // Safe metrics update failover
      }

      res.status(201).json({
        success: true,
        message: "Escrow funds successfully locked. Hustling contract initiated.",
        data: bookingRecord
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to finalize hire request handshake"
      });
    }
  }

  /**
   * GET /hire/:id
   * Fetch specific active hire contract details
   */
  public getBookingDetails(req: Request, res: Response): void {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (!id) {
        res.status(400).json({ success: false, error: "Contract ID path parameter is required" });
        return;
      }

      const booking = bookingRepository.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, error: `Contract with ID '${id}' was not found` });
        return;
      }

      // Retrieve full seller and buyer profile logs
      const sellerProfile = profileRepository.findById(booking.seller_id);
      const buyerProfile = profileRepository.findById(booking.buyer_id);

      const responsePayload = {
        ...booking,
        seller: sellerProfile ? {
          fullName: sellerProfile.fullName,
          hustleName: sellerProfile.fullName,
          avatarUrl: sellerProfile.avatarUrl,
          verified: sellerProfile.verified
        } : null,
        buyer: buyerProfile ? {
          fullName: buyerProfile.fullName,
          avatarUrl: buyerProfile.avatarUrl
        } : null
      };

      res.status(200).json({
        success: true,
        message: "Hiring contract details loaded successfully",
        data: responsePayload
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to search contract details"
      });
    }
  }

  /**
   * POST /hire/cancel
   * Cancel contract and perform safe escrow hold fund refund operations
   */
  public cancelHireContract(req: Request, res: Response): void {
    try {
      const { bookingId, reason } = req.body;
      if (!bookingId) {
        res.status(400).json({ success: false, error: "The parameter bookingId is strictly required" });
        return;
      }

      const booking = bookingRepository.findById(bookingId);
      if (!booking) {
        res.status(404).json({ success: false, error: `Contract with ID '${bookingId}' was not found` });
        return;
      }

      if (booking.status === "completed") {
        res.status(400).json({ success: false, error: "Contracts that have already been finalized cannot be cancelled" });
        return;
      }

      // Perform state updates representing voided/cancelled holding status
      const updatedBooking = bookingRepository.update(bookingId, {
        status: "cancelled",
        escrow_status: "refunded"
      });

      res.status(200).json({
        success: true,
        message: "Hiring contract cancelled. Escrow hold funds successfully returned to client.",
        data: updatedBooking,
        cancellationReason: reason || "Client initiated instant cancellation"
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Failed to cancel hiring contract"
      });
    }
  }
}

export const hireController = new HireController();
