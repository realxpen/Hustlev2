-- Migration to build direct messaging foundation tables and columns
-- 1. Update conversations table to include last_message_preview and last_message_at
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Update messages table to include metadata and read_at
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 3. Update message_type constraint to allow 'text', 'image', 'file', 'voice', 'shared_post', 'system'
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'image', 'file', 'voice', 'shared_post', 'system'));

-- 4. Re-create last_message update trigger to keep last_message and last_message_preview synchronized
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = COALESCE(NEW.content, '[Media]'),
        last_message_preview = COALESCE(NEW.content, '[Media]'),
        last_message_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_conversation_on_new_message ON public.messages;
CREATE TRIGGER update_conversation_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE PROCEDURE update_conversation_last_message();

-- 5. RPC to get or create a conversation between user_a and user_b safely
-- This validates that both users exist and returns an existing 1-on-1 conversation or creates one.
CREATE OR REPLACE FUNCTION get_or_create_conversation_between_users(p_user_a UUID, p_user_b UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_user_a_exists BOOLEAN;
    v_user_b_exists BOOLEAN;
BEGIN
    -- Validate both users exist in public.profiles
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_a) INTO v_user_a_exists;
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_b) INTO v_user_b_exists;

    IF NOT v_user_a_exists OR NOT v_user_b_exists THEN
        RAISE EXCEPTION 'One or both users do not exist';
    END IF;

    IF p_user_a = p_user_b THEN
        RAISE EXCEPTION 'Cannot create a direct conversation with yourself';
    END IF;

    -- Try to find existing 1-on-1 conversation between user_a and user_b
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = p_user_a
    ) AND c.id IN (
        SELECT conversation_id 
        FROM public.conversation_participants 
        WHERE user_id = p_user_b
    )
    LIMIT 1;

    -- If no conversation exists, create a new one and join both users
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (last_message, last_message_preview, last_message_at)
        VALUES (NULL, NULL, now())
        RETURNING id INTO v_conversation_id;

        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES 
            (v_conversation_id, p_user_a),
            (v_conversation_id, p_user_b);
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- 6. Apply RLS toconversations, participants and messages
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Dynamic policies
DROP POLICY IF EXISTS "Access own conversations" ON public.conversations;
CREATE POLICY "Access own conversations" ON public.conversations
    FOR ALL
    USING (
        id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Access own partipations" ON public.conversation_participants;
CREATE POLICY "Access own partipations" ON public.conversation_participants
    FOR ALL
    USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Access own messages" ON public.messages;
CREATE POLICY "Access own messages" ON public.messages
    FOR ALL
    USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM public.conversation_participants 
            WHERE user_id = auth.uid()
        )
    );
