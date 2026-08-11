-- Add 'post' to message_type enum check
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'image', 'file', 'voice', 'post'));

-- Add post_id to messages to optionally link to a shared post directly
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;
