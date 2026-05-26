-- Automatically sync is_hustler if role changes to hustler
CREATE OR REPLACE FUNCTION public.sync_hustler_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IN ('hustler', 'both') THEN
    NEW.is_hustler := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_hustler_role ON public.profiles;
CREATE TRIGGER trg_sync_hustler_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_hustler_role();

-- Automatically grant hustler identity if a service is created
CREATE OR REPLACE FUNCTION public.activate_hustler_on_service()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET is_hustler = true
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activate_hustler_on_service ON public.services;
CREATE TRIGGER trg_activate_hustler_on_service
  AFTER INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_hustler_on_service();

-- Automatically recalculate trust metrics if is_hustler is toggled
CREATE OR REPLACE FUNCTION public.recalculate_metrics_on_hustler_toggle()
RETURNS trigger AS $$
BEGIN
  IF OLD.is_hustler IS DISTINCT FROM NEW.is_hustler THEN
    -- This will trigger the calculation via sync_trust_metrics if we use a dummy update or call it directly
    -- Actually, it's safer to just call the same logic here
    IF NEW.is_hustler = false THEN
      NEW.review_count := 0;
      NEW.rating_average := 0;
      NEW.has_reviews := false;
    ELSE
      -- If it's true, we want to restore from reviews
      SELECT COUNT(*), COALESCE(AVG(rating), 0)
      INTO NEW.review_count, NEW.rating_average
      FROM public.reviews
      WHERE provider_id = NEW.id;
      
      NEW.rating_average := ROUND(NEW.rating_average, 1);
      NEW.has_reviews := NEW.review_count > 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_metrics_on_hustler_toggle ON public.profiles;
CREATE TRIGGER trg_recalculate_metrics_on_hustler_toggle
  BEFORE UPDATE OF is_hustler ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_metrics_on_hustler_toggle();


