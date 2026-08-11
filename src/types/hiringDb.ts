/**
 * Compile-time Type Specifications for the Hiring & Escrow Database Schema
 * Tables: hire_requests, project_requirements, attachments
 */

export type HireRequestStatus = "pending" | "in_escrow" | "completed" | "cancelled" | "disputed";
export type EscrowHoldingStatus = "none" | "held" | "disbursed" | "refunded" | "arbitrated";

/**
 * 1. Table: hire_requests
 * Core transaction details containing the contract balance, participants, and escrow statuses.
 */
export interface HireRequest {
  id: string; // UUID primary key
  service_id: string; // FK to services.id
  buyer_id: string; // FK to profiles.id (Client/Buyer)
  seller_id: string; // FK to profiles.id (Specialist/Hustler)
  base_amount: number; // Raw cost of design/feature project scope as decimal
  processing_fee: number; // 5% flat fee for escrow holding custody
  total_locked_amount: number; // base_amount + processing_fee
  currency: string; // e.g. "USD", "EUR"
  status: HireRequestStatus; // Booking transaction state
  escrow_status: EscrowHoldingStatus; // Ledger custody state
  created_at: string;
  updated_at: string;
}

/**
 * 2. Table: project_requirements
 * Holds instructions, descriptions, and active timeline parameters of the hired gig.
 * Separated to support structured revisions or standalone specification sheets.
 */
export interface ProjectRequirement {
  id: string; // UUID primary key
  hire_request_id: string; // FK to hire_requests.id (One-to-One / One-to-Many revision logs)
  description: string; // Full markdown requirements/specifications text
  preferred_timeline: string; // Chosen term estimate, e.g., "3 Days", "1 Week"
  target_delivery_date: string | null; // Epoc/timestamp delivery deadline
  milestones_count: number; // Support complex payouts or unified release
  created_at: string;
  updated_at: string;
}

/**
 * 3. Table: attachments
 * Associated file specifications, guidelines, visual mockups, or source files.
 * Linked to a hire request to assist specialists during execution.
 */
export interface Attachment {
  id: string; // UUID primary key
  hire_request_id: string; // FK to hire_requests.id (One-to-Many attachments mapping)
  file_name: string; // e.g., "brief_v2.pdf", "mockup.png"
  file_size_bytes: number; // Used for metric verification (max 10MB)
  mime_type: string; // e.g., "application/pdf"
  storage_path: string; // Cloud Storage bucket URI or path
  uploader_id: string; // FK to profiles.id
  created_at: string;
}
