-- Extend posts table to support advanced media and references
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='media') THEN
        ALTER TABLE public.posts ADD COLUMN media JSONB DEFAULT '[]'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='music_data') THEN
        ALTER TABLE public.posts ADD COLUMN music_data JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='reference_payload') THEN
        ALTER TABLE public.posts ADD COLUMN reference_payload JSONB;
    END IF;
END $$;
