CREATE OR REPLACE FUNCTION public.activate_hustler_on_service()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET is_hustler = true
  WHERE id = NEW.owner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
