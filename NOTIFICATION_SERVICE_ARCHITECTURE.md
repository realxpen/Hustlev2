# Hustle Notification Service Architecture

This document details the high-fidelity, production-ready backend **Notification Service** built to deliver priority-based, real-time alerts across the Hustle platform. It handles manual creators, automated event streams, event-driven integrations, instant WebSocket delivery, and smart email fallback pipelines.

---

## 1. Core Responsibilities

The service is engineered with four distinct pipelines:
- **Notification Creation**: Consumes client payloads and system event triggers. Dynamically resolves user preferences, prioritizes the alert, and persists it into the relational database.
- **Delivery Engine**: Translates notification priority into appropriate transport channels (WebSocket vs. SMTP/Push).
- **Real-Time Push**: Integrates with active WebSocket channels (`ws://`) to deliver immediate, low-latency UI updates without requiring refresh cycles.
- **Email Fallback**: Automatically dispatches a transactional SMTP payload (simulated pipeline default) if the recipient is offline or if a high-priority alert warrants multiple channels.

---

## 2. API Endpoints

The service exposes three core Express REST endpoints, fully fortified by authentication middleware:

### `GET /api/notifications` (or `/notifications`)
Retrieves all grouped history logs matching the authenticated user, enriched with user profiles.
- **Auth required**: Bearer JWT
- **Response**:
  ```json
  {
    "success": true,
    "notifications": [
      {
        "id": "notif-0f6c243a-9694-4632-aeb6-92f7035661bc",
        "recipient_id": "user-client-1",
        "actor_id": "creator-marcus",
        "type": "message",
        "entity_id": "conversation-demo-1",
        "entity_type": "comment",
        "message": "New message from Marcus: 'Ready to proceed for the grooming appointment of 2pm.'",
        "priority": "high",
        "is_read": false,
        "delivery_channels": {
          "push": { "sent": true, "delivered": true },
          "email": { "sent": false, "recipient_email": "realxpens@gmail.com", "delivered": false }
        },
        "created_at": "2026-06-11T10:57:23.000Z",
        "actor": {
          "id": "creator-marcus",
          "full_name": "Marcus (Barber)",
          "username": "marcus_barber",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
        }
      }
    ]
  }
  ```

### `POST /api/notifications/create` (or `/notifications/create`)
Engineered for manual administrators, backend service-to-service calls, or automated batch tasks to queue alerts.
- **Request Body**:
  ```json
  {
    "recipient_id": "user-client-1",
    "actor_id": "creator-alex",
    "type": "booking_accepted",
    "entity_id": "booking-demo-1",
    "entity_type": "booking",
    "message": "Escrow secure payment has been authorized and locked.",
    "priority": "high"
  }
  ```
- **Response**: Returns a `201 Created` status with the full notification layout.

### `POST /api/notifications/read` (or `/notifications/read`)
Marks notifications as read to reset unread counters.
- **Request Body**:
  - Pass `{"notificationId": "some-uuid"}` to mark a specific alert as read.
  - Leave empty `{}` to mark **all** notifications for the active session as read.

---

## 3. High-Performance Priority Routing & Delivery Rules

The engine respects a rigid set of priority matrix pathways:

| Priority | Delivery Transport | Email Fallback Trigger | Common Event Types |
| :--- | :--- | :--- | :--- |
| **HIGH** | Immediate WS Socket push + Immediate SMTP dispatch | **Always** dispatch email, regardless of recipient state | Booking Requests, Chat messages, Dispute Alerts, Funds Released |
| **NORMAL** | Immediate WS push if user is connected | Dispatch email **only if** target user is offline | Comments, profile level verifications, general state changes |
| **LOW** | Silent in-app insert, no sound / active alert | **Never** dispatch email | Simple follower additions, non-urgent marketing, likes |

---

## 4. Real-Time WebSocket Handshake Sequence

```
 Client (React View)               Express Server / WebSocket       Notification Engine
         |                                     |                             |
         | ---- Upgrade HTTP to ws:// ------>  |                             |
         | <--- Upgrade Handshake OK --------  |                             |
         |                                     |                             |
         | ---- Register user identity ------> |                             |
         |                                     |                             |
         |                                     | <--- System Event Trigger   |
         |                                     |      (booking.accepted)     |
         |                                     |                             |
         | <--- JSON Live Broadcast ---------  |                             |
         |      (notification_received)        |                             |
```

---

## 5. Event-Driven Schema Architecture

Our notification engine subscribes directly to the `BookingEventService` emitting transitions. For instance:
- `booking.created` initiates a `booking_new` notification.
- `booking.accepted` dispatches a high-priority `booking_accepted` push.
- `booking.delivered` notifies the client to verify deliverables.
- `booking.completed` settles escrow and alerts the seller's wallet instantly.
