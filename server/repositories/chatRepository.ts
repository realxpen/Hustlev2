import crypto from "crypto";
import { ServerConversation, ServerConversationParticipant, ServerMessage } from "../types/chat";
import { profileRepository } from "./profileRepository";
import { bookingRepository } from "./bookingRepository";

export class ChatRepository {
  private conversations: Map<string, ServerConversation> = new Map();
  private participants: ServerConversationParticipant[] = [];
  private messages: Map<string, ServerMessage> = new Map();

  constructor() {
    this.seedConversations();
  }

  private seedConversations() {
    // Seed some initial chat data for demo users
    const now = new Date().toISOString();

    // Conversation 1: client (user-client-1) with barber Marcus (creator-marcus)
    const convId1 = "conversation-demo-1";
    this.conversations.set(convId1, {
      id: convId1,
      booking_id: "booking-demo-1",
      created_at: now,
      last_message: "Terms agreed. Let's schedule the booking.",
      last_message_at: now
    });

    this.participants.push(
      { conversation_id: convId1, user_id: "user-client-1", joined_at: now },
      { conversation_id: convId1, user_id: "creator-marcus", joined_at: now }
    );

    // Initial messages for Conversation 1
    const msgId1 = `msg-${crypto.randomUUID()}`;
    const msgId2 = `msg-${crypto.randomUUID()}`;

    this.messages.set(msgId1, {
      id: msgId1,
      conversation_id: convId1,
      sender_id: "user-client-1",
      content: "HeyMarcus! Excited for the Elite Barber session.",
      message_type: "text",
      created_at: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
      updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
      is_read: true,
      delivered_at: new Date(Date.now() - 30 * 60000).toISOString(),
      read_at: new Date(Date.now() - 28 * 60000).toISOString()
    });

    this.messages.set(msgId2, {
      id: msgId2,
      conversation_id: convId1,
      sender_id: "creator-marcus",
      content: "Terms agreed. Let's schedule the booking.",
      message_type: "text",
      created_at: now,
      updated_at: now,
      is_read: false,
      delivered_at: now
    });
  }

  // Find conversations where the user is a participant
  public findConversationsByUserId(userId: string): any[] {
    const userConvIds = this.participants
      .filter(p => p.user_id === userId)
      .map(p => p.conversation_id);

    return userConvIds.map(cid => {
      const conv = this.conversations.get(cid);
      if (!conv) return null;

      // Find other participant ids
      const otherPartUserIds = this.participants
        .filter(p => p.conversation_id === cid && p.user_id !== userId)
        .map(p => p.user_id);

      const otherParticipants = otherPartUserIds.map(opid => {
        const profile = profileRepository.findById(opid);
        if (profile) {
          return {
            id: profile.id,
            fullName: profile.fullName,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            verified: profile.verified,
            isHustler: profile.isHustler
          };
        }
        return { id: opid, fullName: "Creative Hustler", username: "hustler", avatarUrl: "" };
      });

      // Get unread message count
      const unreadCount = Array.from(this.messages.values())
        .filter(m => m.conversation_id === cid && m.sender_id !== userId && !m.is_read)
        .length;

      // Enrich with booking context if applicable
      let bookingContext = null;
      if (conv.booking_id) {
        const booking = bookingRepository.findById(conv.booking_id);
        if (booking) {
          bookingContext = {
            id: booking.id,
            title: booking.service_title,
            amount: booking.amount,
            status: booking.status,
            escrowStatus: booking.escrow_status
          };
        }
      }

      return {
        ...conv,
        otherParticipant: otherParticipants[0] || null,
        otherParticipants,
        unreadCount,
        booking: bookingContext
      };
    }).filter(Boolean);
  }

  // Create conversation or return existing direct conversation between two users
  public getOrCreateDirectConversation(userAId: string, userBId: string, bookingId?: string | null): ServerConversation {
    // Check if there is already a direct conversation (without a separate booking or with this exact booking)
    const listA = this.participants.filter(p => p.user_id === userAId).map(p => p.conversation_id);
    const listB = this.participants.filter(p => p.user_id === userBId).map(p => p.conversation_id);
    const commonIds = listA.filter(cid => listB.includes(cid));

    for (const cid of commonIds) {
      const conv = this.conversations.get(cid);
      if (conv) {
        if (bookingId) {
          // If a high-fidelity booking id is supplied, check if matched
          if (conv.booking_id === bookingId) {
            return conv;
          }
        } else if (!conv.booking_id) {
          // General direct chat without booking
          return conv;
        }
      }
    }

    // Otherwise create a new one
    const id = `conversation-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newConv: ServerConversation = {
      id,
      booking_id: bookingId || null,
      created_at: now,
      last_message_at: now
    };

    this.conversations.set(id, newConv);
    this.participants.push(
      { conversation_id: id, user_id: userAId, joined_at: now },
      { conversation_id: id, user_id: userBId, joined_at: now }
    );

    return newConv;
  }

  // Find messages in conversation
  public findMessagesByConversationId(conversationId: string): ServerMessage[] {
    return Array.from(this.messages.values())
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Save message
  public createMessage(message: Omit<ServerMessage, "id" | "created_at" | "updated_at" | "is_read">): ServerMessage {
    const id = `msg-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const fullMessage: ServerMessage = {
      ...message,
      id,
      created_at: now,
      updated_at: now,
      is_read: false
    };

    this.messages.set(id, fullMessage);

    // Update conversation last message timestamp and preview
    const conv = this.conversations.get(message.conversation_id);
    if (conv) {
      this.conversations.set(message.conversation_id, {
        ...conv,
        last_message: message.content || `[${message.message_type}]`,
        last_message_at: now
      });
    }

    return fullMessage;
  }

  // Find message by ID
  public findMessageById(id: string): ServerMessage | null {
    return this.messages.get(id) || null;
  }

  // Edit message (enforces edit window logic)
  public updateMessage(messageId: string, newContent: string, editWindowMinutes: number = 5): { success: boolean, error?: string, message?: ServerMessage } {
    const msg = this.messages.get(messageId);
    if (!msg) {
      return { success: false, error: "Message not found" };
    }

    const createdAtTime = new Date(msg.created_at).getTime();
    const nowTime = Date.now();
    const differenceInMinutes = (nowTime - createdAtTime) / (60000);

    if (differenceInMinutes > editWindowMinutes) {
      return { 
        success: false, 
        error: `Messages are immutable after the ${editWindowMinutes}-minute edit window.` 
      };
    }

    const updated: ServerMessage = {
      ...msg,
      content: newContent,
      updated_at: new Date().toISOString()
    };

    this.messages.set(messageId, updated);
    return { success: true, message: updated };
  }

  // Mark all messages in conversation as read for a recipient
  public markAsRead(conversationId: string, recipientId: string): void {
    const now = new Date().toISOString();
    Array.from(this.messages.values()).forEach(m => {
      if (m.conversation_id === conversationId && m.sender_id !== recipientId && !m.is_read) {
        m.is_read = true;
        m.read_at = now;
      }
    });
  }

  // Verify membership of conversation
  public isParticipant(conversationId: string, userId: string): boolean {
    return this.participants.some(p => p.conversation_id === conversationId && p.user_id === userId);
  }
}

export const chatRepository = new ChatRepository();
