-- PHASE 2: Enable RLS (run AFTER confirming data migration worked in app)
-- This locks down all tables — only authenticated owner can access their data

-- Make user_id NOT NULL (all rows should have it by now)
ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE open_sessions ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated user can only see/modify their own rows
CREATE POLICY "owner_profiles" ON profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_sessions" ON sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_open_sessions" ON open_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Completely block anon (no-auth) access
CREATE POLICY "deny_anon_profiles" ON profiles FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_sessions" ON sessions FOR ALL TO anon USING (false);
CREATE POLICY "deny_anon_open_sessions" ON open_sessions FOR ALL TO anon USING (false);
