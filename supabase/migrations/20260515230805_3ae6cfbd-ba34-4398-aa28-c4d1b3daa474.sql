
-- Enums
CREATE TYPE public.app_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE public.uom_type AS ENUM ('numeric_min', 'numeric_max', 'percent_min', 'percent_max', 'timeline', 'zero');
CREATE TYPE public.sheet_status AS ENUM ('draft', 'submitted', 'approved_locked', 'returned', 'completed');
CREATE TYPE public.achievement_status AS ENUM ('not_started', 'on_track', 'completed');
CREATE TYPE public.quarter AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'New User',
  email TEXT,
  department TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_color TEXT DEFAULT 'lavender',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table - critical for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is manager of given employee
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_id UUID, _employee_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _employee_id AND manager_id = _manager_id
  )
$$;

-- Cycles
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phase1_open TIMESTAMPTZ NOT NULL,
  phase1_close TIMESTAMPTZ NOT NULL,
  q1_open TIMESTAMPTZ NOT NULL,
  q1_close TIMESTAMPTZ NOT NULL,
  q2_open TIMESTAMPTZ NOT NULL,
  q2_close TIMESTAMPTZ NOT NULL,
  q3_open TIMESTAMPTZ NOT NULL,
  q3_close TIMESTAMPTZ NOT NULL,
  q4_open TIMESTAMPTZ NOT NULL,
  q4_close TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goal sheets
CREATE TABLE public.goal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  status public.sheet_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, cycle_id)
);

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  thrust_area TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  uom_type public.uom_type NOT NULL,
  target NUMERIC,
  target_date DATE,
  weightage NUMERIC NOT NULL DEFAULT 0,
  shared_parent_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Achievements (quarterly actuals)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter public.quarter NOT NULL,
  actual_value NUMERIC,
  actual_date DATE,
  status public.achievement_status NOT NULL DEFAULT 'not_started',
  computed_score NUMERIC,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, quarter)
);

-- Manager check-in comments per goal per quarter
CREATE TABLE public.checkin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter public.quarter NOT NULL,
  manager_id UUID NOT NULL REFERENCES public.profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Return-for-rework comments
CREATE TABLE public.return_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_goal_sheets_owner ON public.goal_sheets(owner_id);
CREATE INDEX idx_goal_sheets_status ON public.goal_sheets(status);
CREATE INDEX idx_goals_sheet ON public.goals(sheet_id);
CREATE INDEX idx_achievements_goal ON public.achievements(goal_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_goal_sheets BEFORE UPDATE ON public.goal_sheets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_goals BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_achievements BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile + default 'employee' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== RLS ==============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone authenticated can read (org directory); user can update own; admin can update all
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles: user reads own; admin manages all
CREATE POLICY "roles_read_self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cycles: all read; admin write
CREATE POLICY "cycles_read_all" ON public.cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "cycles_admin_all" ON public.cycles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Goal sheets: owner full; manager of owner read+update; admin all
CREATE POLICY "sheets_owner_all" ON public.goal_sheets FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "sheets_manager_read" ON public.goal_sheets FOR SELECT TO authenticated
  USING (public.is_manager_of(auth.uid(), owner_id));
CREATE POLICY "sheets_manager_update" ON public.goal_sheets FOR UPDATE TO authenticated
  USING (public.is_manager_of(auth.uid(), owner_id));
CREATE POLICY "sheets_admin_all" ON public.goal_sheets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Goals: derived via sheet
CREATE POLICY "goals_via_sheet" ON public.goals FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.goal_sheets s WHERE s.id = sheet_id AND (
      s.owner_id = auth.uid()
      OR public.is_manager_of(auth.uid(), s.owner_id)
      OR public.has_role(auth.uid(), 'admin')
    ))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.goal_sheets s WHERE s.id = sheet_id AND (
      s.owner_id = auth.uid()
      OR public.is_manager_of(auth.uid(), s.owner_id)
      OR public.has_role(auth.uid(), 'admin')
    ))
  );

-- Achievements: same scoping as goals
CREATE POLICY "achievements_via_goal" ON public.achievements FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.goals g JOIN public.goal_sheets s ON s.id = g.sheet_id
            WHERE g.id = goal_id AND (
              s.owner_id = auth.uid()
              OR public.is_manager_of(auth.uid(), s.owner_id)
              OR public.has_role(auth.uid(), 'admin')
            ))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.goals g JOIN public.goal_sheets s ON s.id = g.sheet_id
            WHERE g.id = goal_id AND (
              s.owner_id = auth.uid()
              OR public.is_manager_of(auth.uid(), s.owner_id)
              OR public.has_role(auth.uid(), 'admin')
            ))
  );

-- Check-in comments: owner read; manager read+write own; admin all
CREATE POLICY "checkins_read" ON public.checkin_comments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.goals g JOIN public.goal_sheets s ON s.id = g.sheet_id
            WHERE g.id = goal_id AND (s.owner_id = auth.uid() OR public.is_manager_of(auth.uid(), s.owner_id) OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "checkins_manager_write" ON public.checkin_comments FOR INSERT TO authenticated
  WITH CHECK (
    manager_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.goals g JOIN public.goal_sheets s ON s.id = g.sheet_id
            WHERE g.id = goal_id AND public.is_manager_of(auth.uid(), s.owner_id))
  );

-- Return comments
CREATE POLICY "returns_read" ON public.return_comments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.goal_sheets s WHERE s.id = sheet_id AND (s.owner_id = auth.uid() OR public.is_manager_of(auth.uid(), s.owner_id) OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "returns_manager_write" ON public.return_comments FOR INSERT TO authenticated
  WITH CHECK (
    manager_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.goal_sheets s WHERE s.id = sheet_id AND public.is_manager_of(auth.uid(), s.owner_id))
  );

-- Audit log: admin read; system writes via service role
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit_self_read" ON public.audit_log FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- Seed: default cycle FY2026 with all windows currently open for demo
INSERT INTO public.cycles (name, phase1_open, phase1_close, q1_open, q1_close, q2_open, q2_close, q3_open, q3_close, q4_open, q4_close, is_active)
VALUES (
  'FY 2026',
  '2026-01-01'::timestamptz, '2027-12-31'::timestamptz,
  '2026-01-01'::timestamptz, '2027-12-31'::timestamptz,
  '2026-01-01'::timestamptz, '2027-12-31'::timestamptz,
  '2026-01-01'::timestamptz, '2027-12-31'::timestamptz,
  '2026-01-01'::timestamptz, '2027-12-31'::timestamptz,
  true
);
