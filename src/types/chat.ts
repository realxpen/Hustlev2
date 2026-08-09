export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  text_content: string;
  created_at: string;
  
  // Dynamic contextual system attachment types to handle direct contract actions
  system_metadata?: {
    type: 'milestone_proposed' | 'escrow_locked' | 'payment_released';
    reference_id?: string;
    amount?: number;
    currency?: string;
  };
}

export interface ChatRoomContext {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  updated_at: string;
}