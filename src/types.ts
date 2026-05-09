/**
 * Hustle: The Economy of You
 * Production-Ready System Types & Entities
 */

export enum UserRole {
  CLIENT = "client",
  HUSTLER = "hustler",
  AGENT = "agent",
  ADMIN = "admin"
}

export enum BookingStatus {
  REQUESTED = "requested",
  BOOKED = "booked",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum EscrowStatus {
  PENDING = "pending",
  FUNDED = "funded",
  RELEASED = "released",
  REFUNDED = "refunded"
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  location: string;
  rating: number;
  jobsCompleted: number;
  trustScore: number;
  isVerified: boolean;
  createdAt: string;
}

export interface HustlerProfile {
  userId: string;
  bio: string;
  services: ServiceCategory[];
  portfolio: Post[];
  availability: string;
  earningsTotal: number;
  repeatRate: number;
  verifiedPro: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  popularityScore: number;
}

export interface Post {
  id: string;
  creatorId: string;
  type: "video" | "image";
  url: string;
  thumbnail: string;
  caption: string;
  likes: number;
  recommendationReason?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  hustlerId: string;
  serviceId: string;
  status: BookingStatus;
  price: number;
  escrowStatus: EscrowStatus;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  bookingId?: string;
  amount: number;
  type: "payment" | "withdrawal" | "refund";
  status: "pending" | "success" | "failed";
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  bookingId?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "booking_update" | "message" | "payment" | "system";
  title: string;
  message: string;
  read: boolean;
  priority: "low" | "high";
  timestamp: string;
}
