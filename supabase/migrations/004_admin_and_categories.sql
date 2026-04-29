-- ============================================================
-- 004: Admin role, banned status, and dynamic categories
-- ============================================================

-- Add role column to profiles (user | admin)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin'));

-- Add banned_at column (nullable — null means not banned)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- Categories table (replaces hardcoded constants)
CREATE TABLE IF NOT EXISTS public.categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  label         text NOT NULL,
  color         text NOT NULL DEFAULT 'gray',
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed initial categories
INSERT INTO public.categories (slug, label, color, display_order) VALUES
  ('workout',      '운동',      'blue',   1),
  ('diet',         '식단',      'green',  2),
  ('supplements',  '보충제',    'purple', 3),
  ('body_profile', '바디프로필', 'pink',   4),
  ('free',         '자유',      'gray',   5)
ON CONFLICT (slug) DO NOTHING;

-- Drop the hardcoded category CHECK constraint on posts
-- (allows admin to create new categories that posts can use)
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- ---- RLS for categories ----
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (true);

-- Only admins can insert/update/delete categories
CREATE POLICY "categories_insert_admin"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_update_admin"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_delete_admin"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile's role / banned_at
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to read all profiles (including the admin-only fields)
CREATE POLICY "profiles_select_admin_all"
  ON public.profiles FOR SELECT
  USING (true);
