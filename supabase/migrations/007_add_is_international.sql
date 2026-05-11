ALTER TABLE public.supplement_events ADD COLUMN IF NOT EXISTS is_international boolean NOT NULL DEFAULT false;

UPDATE public.supplement_events
SET is_international = true
WHERE brand_id IN (
  SELECT id FROM public.supplement_brands WHERE slug IN ('on', 'gnc', 'muscletech', 'musclepharm')
);
