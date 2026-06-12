import { notificationRepository } from '../repositories/notificationRepository';
import { socketService } from './socketService';
import { ServerNotification, NotificationType, EntityType } from '../types/notification';
import { profileRepository } from '../repositories/profileRepository';

export class NotificationService {
  /**
   * Main function to create, prioritize, and deliver notifications securely.
   * Handles priority-based delivery channels and triggers real-time pushes 
   * and email fallbacks.
   */
  public createAndDeliverNotification(params: {
    recipient_id: string;
    actor_id: string | null;
    type: NotificationType;
    entity_id: string | null;
    entity_type: EntityType | null;
    message: string;
    priority?: 'high' | 'normal' | 'low';
  }): ServerNotification {
    const { recipient_id, actor_id, type, entity_id, entity_type, message, priority = 'normal' } = params;

    // Determine target recipient's email address if available (for email fallback)
    let recipientEmail: string | null = null;
    try {
      const recipientProfile = profileRepository.findById(recipient_id);
      if (recipientProfile && (recipientProfile as any).email) {
        recipientEmail = (recipientProfile as any).email;
      } else {
        // Fallback default email mapping for test users
        recipientEmail = recipient_id === 'user-client-1' ? 'realxpens@gmail.com' : `${recipient_id}@hustleapp.io`;
      }
    } catch (e) {
      recipientEmail = "realxpens@gmail.com";
    }

    // Initialize delivery channel structures
    const delivery = {
      push: { sent: false, delivered: false },
      email: { sent: false, recipient_email: recipientEmail, delivered: false }
    };

    // Instantiate and save in-memory model
    const notif = notificationRepository.create({
      recipient_id,
      actor_id,
      type,
      entity_id,
      entity_type,
      message,
      priority,
      delivery_channels: delivery
    });

    console.log(`[NotificationEngine] Event-Driven Notification Created! ID: ${notif.id} | Type: ${type} | Priority: ${priority}`);

    // Real-time WebSocket delivery logic
    // High priority gets sent immediately, normal and low-priority also gets queued/sent if recipient is online
    const isPushedToClient = socketService.sendNotificationToUser(recipient_id, {
      ...notif,
      actor: actor_id ? profileRepository.findById(actor_id) : null
    });

    if (isPushedToClient) {
      notif.delivery_channels.push.sent = true;
      notif.delivery_channels.push.delivered = true;
      console.log(`[NotificationEngine] Real-time WS push successful for user: ${recipient_id}`);
    } else {
      console.log(`[NotificationEngine] Recipient offline or WebSocket inactive. Push queued.`);
    }

    // Email delivery logic (priority-based)
    // Send email immediately if priority is HIGH and user is offline, or high importance (e.g. Booking Request / Cancelled / Money Released / Security Alert)
    const deservesEmailFallback = priority === 'high' || !isPushedToClient;
    
    if (deservesEmailFallback && recipientEmail) {
      notif.delivery_channels.email.sent = true;
      notif.delivery_channels.email.delivered = true; // simulated delivery
      console.log(`[NotificationEngine] [EMAIL FALLBACK TRIGGERED]`);
      console.log(` >> SMTP Pipeline dispatched to: ${recipientEmail}`);
      console.log(` >> Content: "${message}"`);
    }

    return notif;
  }

  /**
   * Retrieves notifications list for a recipient user
   */
  public getNotificationsByUser(userId: string): any[] {
    const raw = notificationRepository.findByRecipientId(userId);
    // Enrich with actor profile info for presentation UI
    return raw.map(notif => {
      let actorProfile = null;
      if (notif.actor_id) {
         try {
           const profile = profileRepository.findById(notif.actor_id);
           if (profile) {
             actorProfile = {
               id: profile.id,
               full_name: profile.fullName,
               username: profile.username,
               avatar_url: profile.avatarUrl
             };
           }
         } catch (e) {
           // Skip failed join
         }
      }
      return {
        ...notif,
        actor: actorProfile
      };
    });
  }

  /**
   * Marks a specific notification as read
   */
  public markNotificationRead(id: string): ServerNotification | null {
    return notificationRepository.markAsRead(id);
  }

  /**
   * Marks all notifications as read for a specific user
   */
  public markAllNotificationsRead(userId: string): void {
    notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
