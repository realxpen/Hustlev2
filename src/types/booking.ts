export type EscrowStatus = 'awaiting_deposit' | 'funds_held' | 'milestone_released' | 'completed' | 'disputed' | 'refunded';

export interface BookingMilestone {
  id: string;
  title: string;
  amount: number;
  is_released: boolean;
}

export interface EscrowBooking {
  id: string;
  client_id: string;
  hustler_id: string;
  service_id: string;
  total_amount: number;
  currency: string;
  status: EscrowStatus;
  milestones: BookingMilestone[];
  created_at: string;
}