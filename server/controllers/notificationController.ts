import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { notificationService } from '../services/notificationService';

export class NotificationController {
  /**
   * GET /notifications
   */
  public getNotifications(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || 'user-client-1';
      const notifications = notificationService.getNotificationsByUser(userId);
      res.status(200).json({
        success: true,
        notifications
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch notifications' });
    }
  }

  /**
   * POST /notifications/create
   * Supports custom manual trigger (e.g. support panel, admin alerts)
   */
  public createNotification(req: AuthenticatedRequest, res: Response): void {
    try {
      const { recipient_id, actor_id, type, entity_id, entity_type, message, priority } = req.body;

      if (!recipient_id || !type || !message) {
        res.status(400).json({ 
          success: false, 
          error: 'Missing required parameters. recipient_id, type, and message are required.' 
        });
        return;
      }

      const notif = notificationService.createAndDeliverNotification({
        recipient_id,
        actor_id: actor_id || null,
        type,
        entity_id: entity_id || null,
        entity_type: entity_type || null,
        message,
        priority: priority || 'normal'
      });

      res.status(201).json({
        success: true,
        notification: notif
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to create notification' });
    }
  }

  /**
   * POST /notifications/read
   * Parameters:
   *  - notificationId (string, optional - if omitted, marks all as read)
   */
  public markAsRead(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || 'user-client-1';
      const { notificationId } = req.body;

      if (notificationId) {
        const updated = notificationService.markNotificationRead(notificationId);
        if (!updated) {
          res.status(404).json({ success: false, error: 'Notification not found' });
          return;
        }
        res.status(200).json({
          success: true,
          notification: updated
        });
      } else {
        notificationService.markAllNotificationsRead(userId);
        res.status(200).json({
          success: true,
          message: 'All notifications successfully marked as read.'
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to mark notification read' });
    }
  }
}

export const notificationController = new NotificationController();
