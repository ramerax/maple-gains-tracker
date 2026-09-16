-- PHASE 1: Add user_id columns (run BEFORE deploying auth code)
-- Safe to run: does NOT break existing app, just adds nullable columns

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE open_sessions ADD COLUMN IF NOT EXISTS user_id UUID;

-- New rows will auto-set user_id from the authenticated user's JWT
ALTER TABLE profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE sessions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE open_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();
