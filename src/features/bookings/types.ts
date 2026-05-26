export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
export type ListingType = 'service' | 'product' | 'training';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type EscrowStatus = 'none' | 'held' | 'released' | 'refunded';
export type ReleaseStatus = 'pending' | 'released' | 'disputed';

export enum MilestoneStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  AWAITING_APPROVAL = "awaiting_approval",
  RELEASED = "released",
  DISPUTED = "disputed"
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: MilestoneStatus;
  deadline?: string;
  description?: string;
  approvedAt?: string;
  booking_id: string;
  created_at: string;
}

export interface Booking {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  listing_type: ListingType;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: BookingStatus;
  payment_status?: PaymentStatus;
  escrow_status?: EscrowStatus;
  release_status?: ReleaseStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  listing?: any;
  buyer?: any;
  seller?: any;
  milestones?: Milestone[];
}

export interface Enrollment {
  id: string;
  user_id: string;
  training_id: string;
  booking_id: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
  last_accessed_at: string;
}
