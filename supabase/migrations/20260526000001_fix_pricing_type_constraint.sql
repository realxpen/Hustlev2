ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_pricing_type_check;
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_pricing_type_check1;
ALTER TABLE public.services ADD CONSTRAINT services_pricing_type_check CHECK (pricing_type IN ('fixed', 'hourly', 'custom', 'negotiable', 'starting'));
