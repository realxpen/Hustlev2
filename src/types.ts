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
