# Hustle Notification System Database Schema

This document details the schema layout, security constraints, and automatic notification-generating hooks defined in our migration strategy (`/supabase/migrations/20260525000000_notification_system.sql`).

---

## 1. Relational Table Schema

The core structure is stored in the `notifications` table:

```sql
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, 
    entity_id UUID, 
    entity_type TEXT, 
    message TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Column Metadata:
- **`recipient_id`**: Foreign key to the profile table indicating who should see the alert. Safe cascaded deletes are guaranteed.
- **`actor_id`**: Identifies the trigger user (e.g. who liked, commented, followed, or booked).
- **`type`**: Enum-styled text designating UI icon rendering and filter pathways:
  - Engagement: `'like'`, `'comment'`, `'reply'`, `'mention'`, `'repost'`, `'follow'`
  - Operations: `'booking_new'`, `'booking_accepted'`, `'booking_completed'`
  - Finance: `'milestone_delivered'`, `'milestone_released'`, `'milestone_disputed'`
- **`entity_id`**: Optional reference UUID linking directly to the origin record (such as booking, post, or thread).
- **`entity_type`**: Designator indicating the source class (`post`, `comment`, `story`, `profile`, `booking`).

---

## 2. Row Level Security (RLS) Policy Declarations

To guard user privacy and verify authorization, standard access policies apply:

1. **Self-Service Select**: Users can select notifications **only** if they are the designated `recipient_id`.
   ```sql
   CREATE POLICY "Users can view their own notifications"
       ON public.notifications FOR SELECT
       USING (auth.uid() = recipient_id);
   ```
2. **Self-Service Actions**: Users can update read/unread states **only** if they are the designated `recipient_id`.
3. **Internal Insertion**: Allowed for system services to insert alerts.
   ```sql
   CREATE POLICY "System can insert notifications"
       ON public.notifications FOR INSERT
       WITH CHECK (true);
   ```

---

## 3. Advanced Postgres Procedure triggers

To streamline creation, the database executes an autonomous deduplication trigger function on insert:

```sql
CREATE OR REPLACE FUNCTION public.create_notification(
    p_recipient_id UUID,
    p_actor_id UUID,
    p_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_entity_type TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_recent_exists BOOLEAN;
BEGIN
    -- Don't notify yourself
    IF p_recipient_id = p_actor_id THEN
        RETURN NULL;
    END IF;

    -- Basic deduplication: avoid exact same notification in the last 1 minute
    SELECT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE recipient_id = p_recipient_id
          AND actor_id IS NOT DISTINCT FROM p_actor_id
          AND type = p_type
          AND entity_id IS NOT DISTINCT FROM p_entity_id
          AND created_at > now() - interval '1 minute'
    ) INTO v_recent_exists;

    IF v_recent_exists THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_id, entity_type, message)
    VALUES (p_recipient_id, p_actor_id, p_type, p_entity_id, p_entity_type, p_message)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
```

---

## 4. Automatic Database Triggers

For direct user actions, notifications are generated down at the database level instantly:
- **Comments/Post Likes**: Fires an `AFTER INSERT` trigger on `post_likes` or `comments`, resolving the post owner, and inserting the alert.
- **Profile Followers**: Resolves target and fires the trigger on the `followers` connection mapping table.
