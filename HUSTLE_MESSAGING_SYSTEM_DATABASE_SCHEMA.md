# Hustle Messaging System Database Schema

This document details the production-ready PostgreSQL database architecture for the Hustle Real-Time Messaging System. The design supports scaling to millions of records, low-latency concurrent retrieval, granular delivery verification, linked transaction/booking states, and secure multi-recipient spaces.

---

## 1. Schema Diagram & Relationships

```
      +------------------------+
      |        bookings        |
      +------------------------+
      | PK | id         (UUID) |
      +------------------------+
                  | (0..1 : 1)
                  v
      +------------------------+
      |     conversations      |
      +------------------------+
      | PK | id         (UUID) | <----+
      | FK | booking_id (UUID) |      |
      |    | is_group   (BOOL) |      |
      +------------------------+      |
               |                      |
               | (1 : N)              | (1 : N)
               v                      |
      +------------------------+      |      +---------------------------+
      |        messages        |      |      | conversation_participants |
      +------------------------+      |      +---------------------------+
      | PK | id         (UUID) |      |      | PK | id            (UUID) |
      | FK | conv_id    (UUID) |------+      | FK | conv_id       (UUID) |
      | FK | sender_id  (UUID) |             | FK | profile_id    (UUID) |
      +------------------------+             +---------------------------+
         | (1 : N)     | (1 : N)
         v             v
+------------------+ +------------------+
|  message_media   | |  message_reads   |
+------------------+ +------------------+
| PK| id    (UUID) | | PK| id    (UUID) |
| FK| msgId (UUID) | | FK| msgId (UUID) |
|   | url   (TEXT) | | FK| user_i(UUID) |
+------------------+ +------------------+
```

---

## 2. Table Schemas DDL Statements

Below is the verified SQL script to create the necessary tables, relations, and constraints configured explicitly for hyper-scalable storage.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. CONVERSATIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150),
    avatar_url TEXT,
    
    -- Booking Association Loop
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    
    -- Channel attributes
    is_group BOOLEAN DEFAULT false NOT NULL,
    disappearing_messages_duration INTERVAL, -- Null means disabled, otherwise e.g. '24 hours' or '7 days'
    
    -- Metadata caching to eliminate expensive counts/joins during list queries
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 2. CONVERSATION_PARTICIPANTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Role permissions (Supports agency management and multi-party disputes)
    role VARCHAR(30) DEFAULT 'member' NOT NULL CONSTRAINT participant_role_check CHECK (role IN ('owner', 'admin', 'member', 'observer')),
    
    -- Read state metrics per client session
    last_read_message_id UUID, -- Null until read, avoids full index scans for unread highlights
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, profile_id)
);

-- =========================================================================
-- 3. MESSAGES TABLE (Partitioned format or segmented structure ready)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- keeps message history intact if profiles are anonymous
    
    content TEXT,
    message_type VARCHAR(30) DEFAULT 'text' NOT NULL CONSTRAINT msg_type_check CHECK (message_type IN ('text', 'image', 'video', 'file', 'voice', 'system')),
    
    -- Client/Server Synchronization Checks
    is_system_message BOOLEAN DEFAULT false NOT NULL,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    
    -- Lifecycle rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE -- Supports disappearing messages
);

-- =========================================================================
-- 4. MESSAGE_MEDIA TABLE (Decoupled to keep message payload processing thin)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.message_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL CONSTRAINT file_size_positive CHECK (file_size > 0),
    mime_type VARCHAR(100),
    
    -- High resolution/Compression alternatives
    thumbnail_url TEXT,
    metadata JSONB, -- Stores height, width, geolocation or duration for voice files
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 5. MESSAGE_READS TABLE (Optimized associative logging for read tracking)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT unique_message_recipient_read UNIQUE (message_id, profile_id)
);
```

---

## 3. Optimizations for Scalability & High Performance

To comfortably store millions of rows without degrading WebSocket delivery ticks or message historical logs, the architecture employs several indexes and schema techniques:

### Real-Time Optimized Indexes

```sql
-- 1. Accelerates message load in active threads (Chronological chat history order)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_chronological
ON public.messages (conversation_id, created_at DESC);

-- 2. Performance speedup for checking dynamic inbox notifications / read confirmations
CREATE INDEX IF NOT EXISTS idx_participants_profile_search
ON public.conversation_participants (profile_id);

-- 3. High scalability index to check disappearing mesages expiration targets
CREATE INDEX IF NOT EXISTS idx_messages_expiration_cleansing
ON public.messages (expires_at)
WHERE expires_at IS NOT NULL;

-- 4. Speeds up unread calculations on active threads
CREATE INDEX IF NOT EXISTS idx_message_reads_lookup
ON public.message_reads (message_id, profile_id);

-- 5. Speeds up searching direct workspace chats attached to bookings
CREATE INDEX IF NOT EXISTS idx_conversations_booking_routing
ON public.conversations (booking_id)
WHERE booking_id IS NOT NULL;
```

---

## 4. Scaling Architecture Strategy (to 100M+ Messages)

When designing a messaging hub for true production workloads carrying millions of active message exchanges, we rely on the following design choices:

1. **Denormalized Inbox Metadata Caching (`last_message` and `last_message_at`)**:
   Instead of querying sub-tables or joining recent items every time a user views their conversations hub, the `conversations` table maintains a cached copy of the last text and delivery timestamp. This guarantees $O(1)$ lookup times for inbox summaries.
2. **Columnar Decoupling for Multimedia Storage (`message_media`)**:
   Keeping image, file, dimensions, and metadata JSON values in `message_media` rather than inside the main `messages` table reduces row size inside the primary index. This maximizes the cache density of PostgreSQL's shared buffers.
3. **Storage Partitioning Range by Date (Optional scale)**:
   For databases holding massive historic records, the `public.messages` list can be configured as a **Partitioned Table** using Range Partitioning by chronological segment (e.g. partition by Month using `created_at` column ranges). Older partitions are moved to slower cold-storage tiers, keeping active disk sectors fast.
4. **Disappearing Messages Auto-Cleanup Daemon**:
   The index `idx_messages_expiration_cleansing` allows cleanups via a cron worker:
   ```sql
   DELETE FROM public.messages WHERE expires_at <= NOW();
   ```
   This keeps table allocations highly consolidated.
