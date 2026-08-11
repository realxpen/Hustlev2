-- 1. Drop all existing policies on conversations, conversation_participants and messages to avoid conflicts or leftovers
DROP POLICY IF EXISTS "Access own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Select conversations they are part of" ON public.conversations;
DROP POLICY IF EXISTS "Insert any authenticated conversation" ON public.conversations;
DROP POLICY IF EXISTS "Update own conversations" ON public.conversations;

DROP POLICY IF EXISTS "Access own partipations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can check if others are in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert participants for conversations they are creating" ON public.conversation_participants;
DROP POLICY IF EXISTS "Select own or conversational participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Insert participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Delete own participation" ON public.conversation_participants;

DROP POLICY IF EXISTS "Access own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Select messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Insert messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Update messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Delete own messages" ON public.messages;

-- 2. Create recursion-free security helper function
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.conversation_participants 
        WHERE conversation_id = p_conversation_id AND user_id = p_user_id
    ) INTO v_exists;
    RETURN v_exists;
END;
$$;

-- 3. Robust non-recursive RLS policy definitions

-- For conversations
CREATE POLICY "Select conversations they are part of" ON public.conversations
    FOR SELECT
    USING (public.is_conversation_participant(id, auth.uid()));

CREATE POLICY "Insert any authenticated conversation" ON public.conversations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update own conversations" ON public.conversations
    FOR UPDATE
    USING (public.is_conversation_participant(id, auth.uid()))
    WITH CHECK (public.is_conversation_participant(id, auth.uid()));

-- For conversation_participants
CREATE POLICY "Select own or conversational participants" ON public.conversation_participants
    FOR SELECT
    USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Insert participants" ON public.conversation_participants
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Delete own participation" ON public.conversation_participants
    FOR DELETE
    USING (user_id = auth.uid());

-- For messages
CREATE POLICY "Select messages in own conversations" ON public.messages
    FOR SELECT
    USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Insert messages in own conversations" ON public.messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Update messages in own conversations" ON public.messages
    FOR UPDATE
    USING (public.is_conversation_participant(conversation_id, auth.uid()))
    WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Delete own messages" ON public.messages
    FOR DELETE
    USING (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));
