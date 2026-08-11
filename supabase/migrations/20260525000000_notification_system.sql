-- Notification System Schema and Triggers

-- Step 1: Create notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- like, comment, reply, repost, follow, story_reaction, story_reply, internal_share, system
    entity_id UUID, -- References post, comment, story, etc.
    entity_type TEXT, -- post, comment, story, profile, system
    message TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can manage their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- API for manual creation
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

-- Mark read RPC
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE id = p_id AND recipient_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE recipient_id = auth.uid() AND is_read = false;
END;
$$;


-- TRIGGER: Like Notifications (using post_likes table)
CREATE OR REPLACE FUNCTION public.tr_notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner UUID;
BEGIN
    SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
    IF v_post_owner IS NOT NULL THEN
        PERFORM public.create_notification(
            v_post_owner,
            NEW.user_id,
            'like',
            NEW.post_id,
            'post'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_post_like ON public.post_likes;
CREATE TRIGGER tr_notify_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE PROCEDURE public.tr_notify_post_like();

-- TRIGGER: Comment Notifications
CREATE OR REPLACE FUNCTION public.tr_notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner UUID;
BEGIN
    SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.post_id;
    IF v_post_owner IS NOT NULL THEN
        PERFORM public.create_notification(
            v_post_owner,
            NEW.user_id,
            'comment',
            NEW.id, -- entity_id is comment
            'comment'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_post_comment ON public.comments;
CREATE TRIGGER tr_notify_post_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.tr_notify_post_comment();

-- TRIGGER: Repost Notifications
CREATE OR REPLACE FUNCTION public.tr_notify_repost()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner UUID;
BEGIN
    IF NEW.is_repost AND NEW.original_post_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner FROM public.posts WHERE id = NEW.original_post_id;
        IF v_post_owner IS NOT NULL THEN
            PERFORM public.create_notification(
                v_post_owner,
                NEW.user_id,
                'repost',
                NEW.id,
                'post'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Don't overlap with original post repost trigger if there's one, or we can just add this
DROP TRIGGER IF EXISTS tr_notify_repost_trigger ON public.posts;
CREATE TRIGGER tr_notify_repost_trigger
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE public.tr_notify_repost();

-- TRIGGER: Follow Notifications
CREATE OR REPLACE FUNCTION public.tr_notify_follow()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_notification(
        NEW.following_id,
        NEW.follower_id,
        'follow',
        NEW.follower_id,
        'profile'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_follow_trigger ON public.followers;
CREATE TRIGGER tr_notify_follow_trigger
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE PROCEDURE public.tr_notify_follow();

-- Enable Supabase Realtime for Notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add notifications to publication: %', SQLERRM;
        END;
    END IF;
END;
$$;
