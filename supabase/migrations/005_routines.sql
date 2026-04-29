-- 루틴 테이블
CREATE TABLE routines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('workout', 'diet')),
  days integer[] NOT NULL DEFAULT '{}',  -- 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX routines_user_id_idx ON routines(user_id);

-- 루틴 항목 (운동 또는 식단 세부 항목)
CREATE TABLE routine_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  detail text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX routine_items_routine_id_idx ON routine_items(routine_id);

-- 루틴 완료 로그
CREATE TABLE routine_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, routine_id, log_date)
);

CREATE INDEX routine_logs_user_date_idx ON routine_logs(user_id, log_date);

-- RLS 활성화
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_logs ENABLE ROW LEVEL SECURITY;

-- routines RLS
CREATE POLICY "Users can view own routines"
  ON routines FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own routines"
  ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routines FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routines FOR DELETE USING (auth.uid() = user_id);

-- routine_items RLS (루틴 소유권 기반)
CREATE POLICY "Users can view own routine items"
  ON routine_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own routine items"
  ON routine_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own routine items"
  ON routine_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own routine items"
  ON routine_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM routines WHERE routines.id = routine_items.routine_id AND routines.user_id = auth.uid()
  ));

-- routine_logs RLS
CREATE POLICY "Users can view own logs"
  ON routine_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs"
  ON routine_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON routine_logs FOR DELETE USING (auth.uid() = user_id);
