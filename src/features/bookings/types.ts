export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'refunded' | 'disputed';
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

export enum EscrowPaymentState {
  AWAITING_PAYMENT = 'AWAITING PAYMENT',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

export const getEscrowPaymentState = (booking: Booking): EscrowPaymentState => {
  if (booking.status === 'disputed') return EscrowPaymentState.DISPUTED;
  if (booking.status === 'cancelled' || booking.status === 'rejected' || booking.escrow_status === 'refunded') return EscrowPaymentState.REFUNDED;
  if (booking.status === 'completed' || booking.escrow_status === 'released') return EscrowPaymentState.RELEASED;
  if (['accepted', 'in_progress', 'delivered'].includes(booking.status) || booking.escrow_status === 'held') return EscrowPaymentState.FUNDED;
  return EscrowPaymentState.AWAITING_PAYMENT;
};

export interface Milestone {
  id: string;
  booking_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: MilestoneStatus | string;
  delivered_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
  deadline?: string; // transient
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
  payment_status: PaymentStatus;
  escrow_status: EscrowStatus;
  release_status: ReleaseStatus;
  notes: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  delivery_mode?: string | null;
  created_at: string;
  updated_at: string;
  price_snapshot?: number;
  
  // Joined data
  listing?: any;
  buyer?: any;
  seller?: any;
  milestones?: Milestone[];
  parsedNotes?: any;
  listing_title?: string;
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
