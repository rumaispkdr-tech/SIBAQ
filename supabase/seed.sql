-- ==============================================================================
-- SIBAQ NARIYAL SWALATH TRACKER - SUPABASE SEED DATA
-- Seed: 001_seed.sql
-- ==============================================================================

-- 1. Insert Administrator (admin / Admin@Sibaq2026!)
INSERT INTO public.candidates (id, admission_no, name, password_hash, role, must_change_password, is_active, phone, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ADMIN',
    'Usthad Ahmad (Sibaq Convenor)',
    '$2a$10$wTf7Jz/rXmJ45Kx5h4QkOOTbJ59dKjC4XN2.5t2wJvS/sA7j5X.O.',
    'admin',
    FALSE,
    TRUE,
    '+91 98460 12345',
    'admin@sibaq.edu'
) ON CONFLICT (admission_no) DO NOTHING;

-- 2. Insert Default Site Settings
INSERT INTO public.site_settings (key, value, updated_at)
VALUES 
    ('app_title', 'Sibaq Nariyal Swalath Tracker', now()),
    ('daily_target', '33', now()),
    ('timezone', 'Asia/Kolkata', now()),
    ('announcement', 'Welcome to Sibaq Daily Swalath Space 🌿 Recite with presence and peace.', now())
ON CONFLICT (key) DO NOTHING;
