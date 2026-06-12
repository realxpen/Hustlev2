import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { chatService } from "./chatService";
import { chatRepository } from "../repositories/chatRepository";

interface ActiveClient {
  userId: string;
  ws: WebSocket;
}

export class SocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map(); // userId -> WebSocket

  public initialize(server: HttpServer): void {
    console.log("[SocketService] Initializing WebSocket Server...");
    
    this.wss = new WebSocketServer({ noServer: true });

    // Handle the HTTP upgrade handshake manually with server integration
    server.on("upgrade", (request, socket, head) => {
      const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
      if (pathname === "/ws" || pathname === "/ws/") {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit("connection", ws, request);
        });
      }
    });

    this.wss.on("connection", (ws: WebSocket) => {
      let clientUserId: string | null = null;

      console.log("[SocketService] Unidentified client connected via WebSocket.");

      ws.on("message", (rawMessage: string) => {
        try {
          const payload = JSON.parse(rawMessage);
          const { type, data } = payload;

          if (!type) {
            ws.send(JSON.stringify({ error: "Missing 'type' property in payload structure." }));
            return;
          }

          switch (type) {
            // 1. Identify Client Connection to associate userId with Socket
            case "register": {
              const { userId } = data;
              if (userId) {
                clientUserId = userId;
                this.clients.set(userId, ws);
                console.log(`[SocketService] WebSocket identified for User ID: ${userId}`);
                ws.send(JSON.stringify({ type: "registered", data: { success: true } }));
              }
              break;
            }

            // 2. Typing Indicators
            case "typing_start": {
              const { conversationId } = data;
              if (conversationId && clientUserId) {
                this.broadcastToConversation(conversationId, clientUserId, {
                  type: "typing_state",
                  data: { conversationId, userId: clientUserId, isTyping: true }
                });
              }
              break;
            }

            case "typing_stop": {
              const { conversationId } = data;
              if (conversationId && clientUserId) {
                this.broadcastToConversation(conversationId, clientUserId, {
                  type: "typing_state",
                  data: { conversationId, userId: clientUserId, isTyping: false }
                });
              }
              break;
            }

            // 3. Read Receipts
            case "read_receipt": {
              const { conversationId, messageId } = data;
              if (conversationId && clientUserId) {
                // If messageId is provided, mark that single message as read
                // Otherwise mark whole conversation as read for this user
                if (messageId) {
                  const msg = chatRepository.findMessageById(messageId);
                  if (msg) {
                    msg.is_read = true;
                    msg.read_at = new Date().toISOString();
                  }
                } else {
                  chatRepository.markAsRead(conversationId, clientUserId);
                }

                // Broadcast read confirmation to other participants in the room
                this.broadcastToConversation(conversationId, clientUserId, {
                  type: "read_receipt",
                  data: { conversationId, messageId, readerId: clientUserId }
                });
              }
              break;
            }

            // 4. Real-time message delivery (optional client routing fallback)
            case "message_send": {
              const { conversationId, content, message_type } = data;
              if (conversationId && clientUserId) {
                const message = chatService.sendMessage(conversationId, clientUserId, {
                  content,
                  message_type
                });

                // Deliver to sender for validation
                ws.send(JSON.stringify({ type: "message_sent", data: { message } }));

                // Broadcast to active recipient client
                this.broadcastToConversation(conversationId, clientUserId, {
                  type: "message_delivered",
                  data: { message }
                });
              }
              break;
            }

            default:
              ws.send(JSON.stringify({ warning: `Unsupported message event type: '${type}'` }));
          }
        } catch (err: any) {
          console.error("[SocketService] Error parsing socket payload:", err);
          ws.send(JSON.stringify({ error: "Invalid JSON format." }));
        }
      });

      ws.on("close", () => {
        if (clientUserId) {
          this.clients.delete(clientUserId);
          console.log(`[SocketService] Client connection closed for user ${clientUserId}`);
        }
      });

      ws.on("error", (error) => {
        console.error(`[SocketService] Socket error on user connection:`, error);
      });
    });
  }

  // Helper: Broadcast a message to other participants in a conversation channel
  public broadcastToConversation(conversationId: string, excludeUserId: string, payload: any): void {
    const list = chatService.getConversations(excludeUserId);
    const matchedConv = list.find(c => c.id === conversationId);
    if (!matchedConv) return;

    const recipientId = matchedConv.otherParticipant?.id;
    if (recipientId) {
      const recipientWs = this.clients.get(recipientId);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify(payload));
      }
    }
  }

  // Broadcaster for REST API triggered message events
  public broadcastNewMessage(conversationId: string, senderId: string, message: any): void {
    this.broadcastToConversation(conversationId, senderId, {
      type: "message_delivered",
      data: { message }
    });
  }

  // Send a real-time notification to a specific connected user
  public sendNotificationToUser(userId: string, notification: any): boolean {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "notification_received",
        data: { notification }
      }));
      return true;
    }
    return false;
  }
}

export const socketService = new SocketService();
