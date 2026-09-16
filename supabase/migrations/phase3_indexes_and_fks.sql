-- PHASE 3: Indexes + FK constraints (safe, additive — no data loss)
-- Fixes: RLS policy checks and common queries were doing full table scans;
-- deleting a profile could orphan its sessions/open_sessions rows.

-- Indexes — every column used in a WHERE/ORDER BY or RLS policy check
CREATE INDEX IF NOT EXISTS idx_sessions_profile_id      ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date             ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id          ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_profile_date     ON sessions(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_open_sessions_profile_id  ON open_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_open_sessions_user_id     ON open_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id          ON profiles(user_id);

-- Foreign keys — deleting a profile now cascades to its sessions/open_sessions
-- instead of leaving orphaned rows behind.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sessions_profile' AND table_name = 'sessions'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT fk_sessions_profile
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_open_sessions_profile' AND table_name = 'open_sessions'
  ) THEN
    ALTER TABLE open_sessions
      ADD CONSTRAINT fk_open_sessions_profile
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
