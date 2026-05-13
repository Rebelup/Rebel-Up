CREATE TABLE public.event_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  parent_id     uuid REFERENCES public.event_categories(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplement_events
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.event_categories(id) ON DELETE SET NULL;

ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_categories_select_public"
  ON public.event_categories FOR SELECT USING (true);

CREATE POLICY "event_categories_write_auth"
  ON public.event_categories FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
