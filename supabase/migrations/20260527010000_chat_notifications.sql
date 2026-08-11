-- Chat Messages Notification Trigger
CREATE OR REPLACE FUNCTION public.tr_notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient UUID;
BEGIN
    -- Find the other participant in this conversation
    SELECT user_id INTO v_recipient
    FROM public.conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
    LIMIT 1;

    -- Avoid notifying if other participant is not found
    IF v_recipient IS NOT NULL THEN
        -- Avoid notifying users who are restricted/blocked
        IF NOT EXISTS (
            SELECT 1 FROM public.buyer_restrictions
            WHERE (seller_id = NEW.sender_id AND buyer_id = v_recipient)
               OR (seller_id = v_recipient AND buyer_id = NEW.sender_id)
        ) THEN
            PERFORM public.create_notification(
                v_recipient,
                NEW.sender_id,
                'message',
                NEW.conversation_id,
                'system',
                NEW.content
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_new_message ON public.messages;
CREATE TRIGGER tr_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE PROCEDURE public.tr_notify_new_message();
