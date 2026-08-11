-- Add parent_comment_id to comments for nesting
ALTER TABLE public.comments ADD COLUMN parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add comments_count to posts for denormalized performance (as requested)
ALTER TABLE public.posts ADD COLUMN comments_count INTEGER DEFAULT 0 NOT NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- Trigger to keep comments_count in sync
CREATE OR REPLACE FUNCTION public.handle_comment_count_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_created_or_deleted
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.handle_comment_count_change();

-- Initialize counts for existing posts
UPDATE public.posts p
SET comments_count = (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id);
