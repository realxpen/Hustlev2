-- Update messages table to include 'shared_post' message type
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'image', 'file', 'voice', 'shared_post'));

-- Add shared_post_id column to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='shared_post_id') THEN
        ALTER TABLE public.messages ADD COLUMN shared_post_id UUID REFERENCES public.posts(id);
    END IF;
END $$;
