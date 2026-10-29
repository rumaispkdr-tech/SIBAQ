-- ==============================================================================
-- SIBAQ NARIYAL SWALATH TRACKER - PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('candidate', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Candidates Table
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_no VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'candidate',
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone VARCHAR(32),
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Daily Tasks Table
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    task_date DATE NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 33 CHECK (target_count >= 1),
    completed_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0 AND completed_count <= 33),
    status task_status NOT NULL DEFAULT 'not_started',
    completed_at TIMESTAMPTZ,
    last_recitation_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_candidate_task_date UNIQUE (candidate_id, task_date)
);

-- 4. Recitation Events Table
CREATE TABLE IF NOT EXISTS public.recitation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    count_after INTEGER NOT NULL CHECK (count_after >= 1 AND count_after <= 33),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    candidate_id UUID PRIMARY KEY REFERENCES public.candidates(id) ON DELETE CASCADE,
    theme VARCHAR(64) NOT NULL DEFAULT 'peaceful-garden',
    text_size VARCHAR(32) NOT NULL DEFAULT 'large',
    animation_mode VARCHAR(32) NOT NULL DEFAULT 'full',
    fireworks_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ambient_motion BOOLEAN NOT NULL DEFAULT TRUE,
    sound_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    eye_rest_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(128) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_name VARCHAR(255),
    actor_role user_role NOT NULL,
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    details TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_candidates_admission_no ON public.candidates(admission_no);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_candidate_date ON public.daily_tasks(candidate_id, task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON public.daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_recitation_events_task ON public.recitation_events(daily_task_id);
CREATE INDEX IF NOT EXISTS idx_recitation_events_candidate ON public.recitation_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 9. Automatic Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_daily_tasks_updated_at
BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Row Level Security (RLS) Policies
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recitation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Candidates policy: Users can read own profile; Admin can read and update all
CREATE POLICY "Candidates can read own profile"
    ON public.candidates FOR SELECT
    USING (auth.uid() = id OR (SELECT role FROM public.candidates WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update all candidates"
    ON public.candidates FOR UPDATE
    USING ((SELECT role FROM public.candidates WHERE id = auth.uid()) = 'admin');

-- Daily tasks policy: Candidates can select and update own task; Admin has full access
CREATE POLICY "Candidates can manage own daily tasks"
    ON public.daily_tasks FOR ALL
    USING (candidate_id = auth.uid() OR (SELECT role FROM public.candidates WHERE id = auth.uid()) = 'admin');

-- Recitation events policy: Candidates can read and insert own events
CREATE POLICY "Candidates can manage own recitations"
    ON public.recitation_events FOR ALL
    USING (candidate_id = auth.uid() OR (SELECT role FROM public.candidates WHERE id = auth.uid()) = 'admin');

-- Preferences policy: Candidates can manage own preferences
CREATE POLICY "Candidates can manage own preferences"
    ON public.user_preferences FOR ALL
    USING (candidate_id = auth.uid());

-- Audit logs: Only admin can view audit logs
CREATE POLICY "Admin can view audit logs"
    ON public.audit_logs FOR SELECT
    USING ((SELECT role FROM public.candidates WHERE id = auth.uid()) = 'admin');

-- Site settings: Anyone authenticated can view settings; Admin can modify
CREATE POLICY "Authenticated users can read site settings"
    ON public.site_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can modify site settings"
    ON public.site_settings FOR ALL
    USING ((SELECT role FROM public.candidates WHERE id = auth.uid()) = 'admin');
