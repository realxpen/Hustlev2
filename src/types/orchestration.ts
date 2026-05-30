
export type AppEventType = 
  | 'post_created'
  | 'post_liked'
  | 'repost_created'
  | 'comment_created'
  | 'follow_created'
  | 'booking_created'
  | 'booking_completed'
  | 'escrow_released'
  | 'message_sent'
  | 'story_created'
  | 'product_created'
  | 'training_created'
  | 'wallet_deposit'
  | 'wallet_withdrawal';

export interface AppEvent {
  id: string;
  event_type: AppEventType;
  actor_id: string;
  target_id?: string;
  entity_id?: string;
  entity_type?: string;
  payload: any;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  profile_id: string;
  action_type: string;
  description: string;
  metadata: any;
  created_at: string;
}
