import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { chatService } from "../services/chatService";
import { socketService } from "../services/socketService";

export class ChatController {
  /**
   * GET /conversations
   * Retrieves all threads for the active user
   */
  public getConversations(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || "user-client-1";
      const list = chatService.getConversations(userId);
      res.status(200).json({
        success: true,
        conversations: list
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to load conversations" });
    }
  }

  /**
   * GET /messages/:conversationId
   * Retrieves messages of a specific thread
   */
  public getMessages(req: AuthenticatedRequest, res: Response): void {
    try {
      const { conversationId } = req.params;
      const userId = req.user?.userId || "user-client-1";

      if (!conversationId) {
        res.status(400).json({ success: false, error: "The parameter conversationId is required." });
        return;
      }

      const list = chatService.getMessages(conversationId as string, userId);
      res.status(200).json({
        success: true,
        messages: list
      });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message || "Failed to retrieve conversation logs" });
    }
  }

  /**
   * POST /messages/send
   * Sends a message into a conversation. Initiates dynamic thread if needed.
   */
  public sendMessage(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || "user-client-1";
      let { conversationId, recipientId, content, message_type, media_url, media_metadata, reply_to_message_id } = req.body;

      if (!conversationId && recipientId) {
        // Resolve or create direct thread
        const conversation = chatService.getOrCreateConversation(userId, recipientId);
        conversationId = conversation.id;
      }

      if (!conversationId) {
        res.status(400).json({ success: false, error: "Either conversationId or recipientId must be provided." });
        return;
      }

      const message = chatService.sendMessage(conversationId as string, userId, {
        content,
        message_type,
        media_url,
        media_metadata,
        reply_to_message_id
      });

      // Broadcast via socket connection
      try {
        socketService.broadcastNewMessage(conversationId as string, userId, message);
      } catch (wsErr) {
        console.warn("[ChatController] WS Broadcast failed or inactive clients:", wsErr);
      }

      res.status(201).json({
        success: true,
        message: "Message processed successfully",
        data: message
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to deliver message" });
    }
  }

  /**
   * POST /messages/edit
   * Edits an immutable message within edit window guidelines
   */
  public editMessage(req: AuthenticatedRequest, res: Response): void {
    try {
      const userId = req.user?.userId || "user-client-1";
      const { messageId, content } = req.body;

      if (!messageId || !content) {
        res.status(400).json({ success: false, error: "Parameters messageId and content are strictly required." });
        return;
      }

      const updatedMessage = chatService.editMessage(userId, messageId, content);

      // Broadcast edit update on active sockets
      try {
        socketService.broadcastToConversation(updatedMessage.conversation_id, userId, {
          type: "message_edited",
          data: { message: updatedMessage }
        });
      } catch (wsErr) {
        console.warn("[ChatController] WS Edit Broadcast failed:", wsErr);
      }

      res.status(200).json({
        success: true,
        message: "Message updated successfully",
        data: updatedMessage
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Failed to edit message" });
    }
  }
}

export const chatController = new ChatController();
