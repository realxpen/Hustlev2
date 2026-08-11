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
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  IN_PROGRESS = "in_progress",
  DELIVERED = "delivered",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
  REQUESTED = "requested", // compatibility
  BOOKED = "booked"        // compatibility
}

export enum EscrowStatus {
  UNPAID = "unpaid",
  HELD = "held",
  RELEASED = "released",
  REFUNDED = "refunded",
  PENDING = "pending",  // compatibility
  FUNDED = "funded",    // compatibility
  LOCKED = "locked",    // compatibility
  PARTIALLY_RELEASED = "partially_released", // compatibility
  DISPUTED = "disputed" // compatibility
}

// Moved to features/bookings/types.ts


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

// Removed redundant Booking interface to avoid conflicts with database types


export enum TransactionType {
  BOOKING_PAYMENT = "booking_payment",
  ESCROW_RELEASE = "escrow_release",
  ESCROW_FUNDED = "escrow_funded",
  AWAITING_APPROVAL = "awaiting_approval",
  WITHDRAWAL = "withdrawal",
  DEPOSIT = "deposit",
  REFUND = "refund",
  PURCHASE = "purchase",
  TRANSFER = "transfer"
}

export enum TransactionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DISPUTED = "disputed",
  REFUNDED = "refunded"
}

export interface Transaction {
  id: string;
  userId: string;
  bookingId?: string;
  milestoneId?: string;
  amount: number;
  currency?: "fiat" | "crypto";
  fee?: number;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  sender?: string;
  receiver?: string;
  meta?: Record<string, any>;
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

/**
 * Immersive Detail Page Types
 */

export type DetailType = "service" | "product" | "training";

export interface Review {
  id: number;
  user: string;
  avatar?: string;
  rating: number;
  text: string;
  time: string;
  isRepeat?: boolean;
  media?: string[];
}

export interface Recommendation {
  id: number;
  title: string;
  subtitle: string;
  price?: number;
  image: string;
  type: DetailType;
}

export interface CreatorSummary {
  id: number | string;
  name: string;
  avatar: string;
  category: string;
  location: string;
  rating: number;
  verified: boolean;
  responseTime?: string;
  is_hustler?: boolean;
}

export interface BaseDetail {
  id: number | string;
  title: string;
  description: string;
  heroMedia: string[];
  creator: CreatorSummary;
  reviews: Review[];
  recommendations: Recommendation[];
  socialStats: {
    likes: number;
    shares: number;
    saves: number;
  };
}

export interface ServiceDetailData extends BaseDetail {
  type: "service";
  priceStructure: {
    startingPrice: number;
    packages: {
      name: string;
      price: number;
      features: string[];
    }[];
  };
  portfolio: {
    type: "image" | "video";
    url: string;
    description?: string;
  }[];
}

export interface ProductDetailData extends BaseDetail {
  type: "product";
  price: number;
  variants?: {
    name: string;
    options: string[];
  }[];
  stockStatus: "in-stock" | "low-stock" | "out-of-stock";
  features: string[];
}

export interface TrainingDetailData extends BaseDetail {
  type: "training";
  mentor: CreatorSummary;
  curriculum: {
    module: string;
    topics: string[];
  }[];
  duration: string;
  format: "online" | "in-person" | "hybrid";
  outcomes: string[];
  requirements: string[];
}

export type DetailData = ServiceDetailData | ProductDetailData | TrainingDetailData;

export interface Service {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  pricing_type: string;
  location?: string;
  media_urls?: string[];
  tags?: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export * from './types/index';
