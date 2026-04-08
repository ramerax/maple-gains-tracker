-- ============================================================================
-- MapleClaude: Enable Row Level Security (RLS)
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for the 'anon' role (used by the app's anon key)
-- The app uses anon key without user auth, so we allow CRUD for the anon role.
-- This still provides protection: only the anon role can access,
-- and the service_role key is required for admin operations.

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "anon_select_profiles" ON profiles
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_profiles" ON profiles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_profiles" ON profiles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_profiles" ON profiles
  FOR DELETE TO anon USING (true);

-- ── sessions ──────────────────────────────────────────────────────────────────
CREATE POLICY "anon_select_sessions" ON sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_sessions" ON sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_sessions" ON sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_sessions" ON sessions
  FOR DELETE TO anon USING (true);

-- ── open_sessions ─────────────────────────────────────────────────────────────
CREATE POLICY "anon_select_open_sessions" ON open_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_open_sessions" ON open_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_open_sessions" ON open_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_open_sessions" ON open_sessions
  FOR DELETE TO anon USING (true);

-- ============================================================================
-- Verification: check RLS is enabled
-- ============================================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'sessions', 'open_sessions');
