CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE OR REPLACE FUNCTION public.sync_trust_metrics()
RETURNS trigger AS $$
DECLARE
  provider uuid;
  r_count integer;
  r_avg numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    provider := OLD.provider_id;
  ELSE
    provider := NEW.provider_id;
  END IF;

  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO r_count, r_avg
  FROM public.reviews
  WHERE provider_id = provider;

  UPDATE public.profiles
  SET review_count = CASE WHEN is_hustler THEN r_count ELSE 0 END,
      rating_average = CASE WHEN is_hustler THEN ROUND(r_avg, 1) ELSE 0 END,
      has_reviews = CASE WHEN is_hustler THEN r_count > 0 ELSE false END
  WHERE id = provider;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_trust_metrics ON public.reviews;
CREATE TRIGGER trg_sync_trust_metrics
  AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trust_metrics();
