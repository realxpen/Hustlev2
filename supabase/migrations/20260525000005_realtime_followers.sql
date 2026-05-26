-- Enable Realtime for followers table so that our subscriptions receive events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add followers to publication: %', SQLERRM;
        END;
    END IF;
END;
$$;
