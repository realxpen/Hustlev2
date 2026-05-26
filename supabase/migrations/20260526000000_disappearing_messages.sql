-- Migration: Add Disappearing Messages Support
-- Add settings to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS disappearing_messages_duration INTERVAL DEFAULT NULL;

-- Add expiration to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON public.messages(expires_at) WHERE expires_at IS NOT NULL;

-- Policy to ensure users can update their conversation settings
DROP POLICY IF EXISTS "Users can update their conversation settings" ON public.conversations;
CREATE POLICY "Users can update their conversation settings" 
ON public.conversations FOR UPDATE 
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);
