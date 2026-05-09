-- ============================================================
-- 006: Supplement brands and events
-- ============================================================

CREATE TABLE public.supplement_brands (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  logo_url    text,
  website_url text,
  events_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.supplement_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid NOT NULL REFERENCES public.supplement_brands(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  event_url     text,
  image_url     text,
  start_date    date,
  end_date      date,
  discount_rate integer CHECK (discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate <= 100)),
  event_type    text NOT NULL DEFAULT 'sale'
                CHECK (event_type IN ('sale', 'new_product', 'bundle', 'free_shipping', 'other')),
  source        text NOT NULL DEFAULT 'manual'
                CHECK (source IN ('manual', 'scraped')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_supp_events_brand  ON public.supplement_events(brand_id);
CREATE INDEX idx_supp_events_dates  ON public.supplement_events(end_date, start_date);
CREATE INDEX idx_supp_events_active ON public.supplement_events(is_active);

ALTER TABLE public.supplement_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands_select_public" ON public.supplement_brands FOR SELECT USING (true);
CREATE POLICY "events_select_public" ON public.supplement_events FOR SELECT USING (true);

CREATE POLICY "brands_write_auth" ON public.supplement_brands
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "events_write_auth" ON public.supplement_events
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER supplement_events_updated_at
  BEFORE UPDATE ON public.supplement_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.supplement_brands (name, slug, website_url, events_url) VALUES
  ('Optimum Nutrition', 'on', 'https://www.optimumnutrition.com', 'https://www.optimumnutrition.com/en-us/promotions'),
  ('MuscleTech', 'muscletech', 'https://www.muscletech.com', 'https://www.muscletech.com'),
  ('GNC', 'gnc', 'https://www.gnc.com', 'https://www.gnc.com/sale'),
  ('렉시', 'rexki', NULL, NULL),
  ('데일리', 'daily', NULL, NULL),
  ('머슬팜', 'musclepharm', 'https://musclepharm.com', NULL);
