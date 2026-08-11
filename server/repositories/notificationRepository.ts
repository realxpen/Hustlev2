import crypto from 'crypto';
import { ServerNotification, NotificationType, EntityType } from '../types/notification';

export class NotificationRepository {
  private notifications: Map<string, ServerNotification> = new Map();

  constructor() {
    this.seedNotifications();
  }

  private seedNotifications() {
    const now = new Date();
    // Default system seed alerts for beautiful showcase on startup
    const seed1: ServerNotification = {
      id: "seed-booking-accepted",
      recipient_id: "user-client-1",
      actor_id: "creator-alex",
      type: "booking_accepted" as NotificationType,
      entity_id: "booking-demo-1",
      entity_type: "booking" as EntityType,
      message: "Your booking has been accepted! Escrow payment has been securely initialized.",
      priority: "high",
      is_read: false,
      delivery_channels: {
        push: { sent: true, delivered: true },
        email: { sent: true, recipient_email: "realxpens@gmail.com", delivered: true }
      },
      created_at: new Date(now.getTime() - 2 * 60000).toISOString()
    };

    const seed2: ServerNotification = {
      id: "seed-message-alerts",
      recipient_id: "user-client-1",
      actor_id: "creator-marcus",
      type: "message" as NotificationType,
      entity_id: "conversation-demo-1",
      entity_type: "comment" as EntityType,
      message: "New message from Marcus: 'Ready to proceed for the grooming appointment of 2pm.'",
      priority: "high",
      is_read: false,
      delivery_channels: {
        push: { sent: true, delivered: true },
        email: { sent: false, recipient_email: "realxpens@gmail.com", delivered: false }
      },
      created_at: new Date(now.getTime() - 8 * 60000).toISOString()
    };

    const seed3: ServerNotification = {
      id: "seed-payment-released",
      recipient_id: "user-client-1",
      actor_id: null,
      type: "milestone_released" as NotificationType,
      entity_id: "booking-demo-1",
      entity_type: "system" as EntityType,
      message: "Payment released successfully! Escrow transferred ₦45,000 to Barber wallet.",
      priority: "high",
      is_read: false,
      delivery_channels: {
        push: { sent: true, delivered: true },
        email: { sent: true, recipient_email: "realxpens@gmail.com", delivered: true }
      },
      created_at: new Date(now.getTime() - 20 * 60000).toISOString()
    };

    const seed4: ServerNotification = {
      id: "seed-trust-updates",
      recipient_id: "user-client-1",
      actor_id: null,
      type: "system" as NotificationType,
      entity_id: null,
      entity_type: "system" as EntityType,
      message: "Trust level verified. Identity verified with perfect 95 points. Gold Trust badge active.",
      priority: "normal",
      is_read: false,
      delivery_channels: {
        push: { sent: true, delivered: true },
        email: { sent: false, recipient_email: null, delivered: false }
      },
      created_at: new Date(now.getTime() - 60 * 60000).toISOString()
    };

    this.notifications.set(seed1.id, seed1);
    this.notifications.set(seed2.id, seed2);
    this.notifications.set(seed3.id, seed3);
    this.notifications.set(seed4.id, seed4);
  }

  public findByRecipientId(recipientId: string): ServerNotification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.recipient_id === recipientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public findById(id: string): ServerNotification | null {
    return this.notifications.get(id) || null;
  }

  public create(notification: Omit<ServerNotification, "id" | "created_at" | "is_read">): ServerNotification {
    const id = `notif-${crypto.randomUUID()}`;
    const fullNotification: ServerNotification = {
      ...notification,
      id,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.notifications.set(id, fullNotification);
    return fullNotification;
  }

  public markAsRead(id: string): ServerNotification | null {
    const notif = this.notifications.get(id);
    if (!notif) return null;
    const updated = { ...notif, is_read: true };
    this.notifications.set(id, updated);
    return updated;
  }

  public markAllAsRead(recipientId: string): void {
    Array.from(this.notifications.values()).forEach(n => {
      if (n.recipient_id === recipientId) {
        n.is_read = true;
      }
    });
  }

  public delete(id: string): boolean {
    return this.notifications.delete(id);
  }

  public getCount(): number {
    return this.notifications.size;
  }
}

export const notificationRepository = new NotificationRepository();
