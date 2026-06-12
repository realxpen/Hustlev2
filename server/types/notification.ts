export type NotificationType = 
  | 'like' | 'comment' | 'reply' | 'mention' | 'repost' | 'follow' | 'message'
  | 'story_reaction' | 'story_reply' | 'internal_share' 
  | 'system' | 'booking' | 'wallet' | 'escrow' | 'work' | 'milestone'
  | 'booking_new' | 'booking_accepted' | 'booking_rejected' | 'booking_completed'
  | 'milestone_delivered' | 'milestone_released' | 'milestone_disputed'
  | 'agent_approved' | 'agent_rejected' | 'agent_request' | 'agent_approved_by_hustler' | 'agent_revoked_by_hustler' 
  | 'commission_paid' | 'commission_payout'
  | 'live_started';

export type EntityType = 'post' | 'comment' | 'story' | 'profile' | 'system' | 'agent_application' | 'hustler_agent' | 'booking' | 'live_session';

export interface ServerNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  entity_id: string | null;
  entity_type: EntityType | null;
  message: string;
  priority: 'high' | 'normal' | 'low';
  is_read: boolean;
  delivery_channels: {
    push: {
      sent: boolean;
      delivered: boolean;
    };
    email: {
      sent: boolean;
      recipient_email: string | null;
      delivered: boolean;
    };
  };
  created_at: string;
}
