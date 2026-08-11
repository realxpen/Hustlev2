import { chatRepository } from "../repositories/chatRepository";
import { bookingEventService, BookingEventPayload } from "./bookingEventService";
import { ServerMessage, ServerConversation } from "../types/chat";

export class ChatService {
  constructor() {
    // CRITICAL FIX: Removed the immediate constructor execution block.
    // This stops circular module imports from hitting uninitialized ReferenceErrors.
    console.log("[ChatService] Instantiated backend operational memory layers.");
  }

  /**
   * Safe, deferred hook attachment that guarantees 
   * bookingEventService is completely exported before parsing listeners.
   */
  public initializeBookingListeners(): void {
    console.log("[ChatService] Mounting automatic booking-linked conversation listener...");
    
    bookingEventService.on("booking.created", (payload: BookingEventPayload) => {
      const { booking } = payload;
      try {
        console.log(`[ChatService] Booking trigger captured. Creating dedicated escrow & work chat thread for Booking ID: ${booking.id}`);
        
        // Link conversation of both buyer and seller with the booking ID
        const conversation = chatRepository.getOrCreateDirectConversation(
          booking.buyer_id, 
          booking.seller_id, 
          booking.id
        );

        // Broadcast a system message to indicate thread linked to a proposal
        chatRepository.createMessage({
          conversation_id: conversation.id,
          sender_id: "system",
          content: `⚡ Secure Work Thread started matching project: "${booking.service_title}" valued at $${booking.amount}. Terms are locked and escrow is being prepared.`,
          message_type: "system"
        });

      } catch (err) {
        console.error(`[ChatService] Failed to auto-generate chat thread for booking ${booking.id}:`, err);
      }
    });
  }

  public getConversations(userId: string): any[] {
    return chatRepository.findConversationsByUserId(userId);
  }

  public getOrCreateConversation(userAId: string, userBId: string, bookingId?: string | null): ServerConversation {
    return chatRepository.getOrCreateDirectConversation(userAId, userBId, bookingId);
  }

  public getMessages(conversationId: string, userId: string): ServerMessage[] {
    if (!chatRepository.isParticipant(conversationId, userId)) {
      throw new Error("Refused access. You are not a participant of this conversation.");
    }
    // Automatically mark as read when fetching conversation logs
    chatRepository.markAsRead(conversationId, userId);
    return chatRepository.findMessagesByConversationId(conversationId);
  }

  public sendMessage(conversationId: string, senderId: string, payload: { content?: string, message_type?: any, media_url?: string, media_metadata?: any, reply_to_message_id?: string }): ServerMessage {
    if (!chatRepository.isParticipant(conversationId, senderId)) {
      throw new Error("Refused access. You cannot send messages to this conversation.");
    }

    const message = chatRepository.createMessage({
      conversation_id: conversationId,
      sender_id: senderId,
      content: payload.content || null,
      message_type: payload.message_type || "text",
      media_url: payload.media_url || null,
      media_metadata: payload.media_metadata || null,
      reply_to_message_id: payload.reply_to_message_id || null
    });

    return message;
  }

  public editMessage(userId: string, messageId: string, newContent: string): ServerMessage {
    const message = chatRepository.findMessageById(messageId);
    if (!message) {
      throw new Error("Message not found.");
    }

    if (message.sender_id !== userId) {
      throw new Error("Refused access. You can only edit your own messages.");
    }

    const result = chatRepository.updateMessage(messageId, newContent);
    if (!result.success || !result.message) {
      throw new Error(result.error || "Failed to edit message.");
    }

    return result.message;
  }
}

// Instantiate Singleton export instance
export const chatService = new ChatService();

// Defer the execution to the next loop checkpoint phase so bookingEventService initializes fully first
setImmediate(() => {
  chatService.initializeBookingListeners();
});