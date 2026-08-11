-- Create Conversations Table
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Conversation Participants Table
CREATE TABLE public.conversation_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Create Messages Table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'file', 'voice')) DEFAULT 'text' NOT NULL,
    media_url TEXT,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER update_conversations_modtime
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_messages_modtime
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Update last message trigger
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE PROCEDURE update_conversation_last_message();

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- Conversation Participants
CREATE POLICY "Users can view their own participations"
  ON public.conversation_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can check if others are in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert participants for conversations they are creating"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (true); -- simplified, real app would verify logic in RPC

-- Conversations
CREATE POLICY "Users can view conversations they are part of"
  ON public.conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

-- Messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- RPC for creating or getting a direct conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_my_user_id UUID;
BEGIN
    v_my_user_id := auth.uid();
    
    IF v_my_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_my_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot converse with yourself';
    END IF;

    -- Try to find existing direct conversation
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = v_my_user_id AND cp2.user_id = p_other_user_id
    LIMIT 1;

    -- If not found, create one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;
        
        INSERT INTO public.conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, v_my_user_id),
               (v_conversation_id, p_other_user_id);
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- Create chat bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat', 'chat', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for chat
CREATE POLICY "Chat media are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat');

CREATE POLICY "Anyone can upload chat media."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat' AND auth.uid() = owner);
