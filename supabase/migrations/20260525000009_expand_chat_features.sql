-- Step 1: Expand message types
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'video', 'file', 'voice', 'shared_post', 'reply', 'system'));

-- Step 2: Add metadata fields
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS media_metadata JSONB,
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_disappearing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Step 4: Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions in their conversations"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_id AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_id AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "Users can remove their reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RPC to toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_message_reaction(p_message_id UUID, p_emoji TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_my_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_my_user_id := auth.uid();
    IF v_my_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Check if it exists
    SELECT EXISTS (
        SELECT 1 FROM public.message_reactions 
        WHERE message_id = p_message_id AND user_id = v_my_user_id AND emoji = p_emoji
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.message_reactions 
        WHERE message_id = p_message_id AND user_id = v_my_user_id AND emoji = p_emoji;
        RETURN FALSE;
    ELSE
        INSERT INTO public.message_reactions (message_id, user_id, emoji)
        VALUES (p_message_id, v_my_user_id, p_emoji);
        RETURN TRUE;
    END IF;
END;
$$;
