---
name: db-review
description: >
  Database review for MapleClaude Supabase tables. USE when: user says "revisa la base de datos",
  "optimiza queries", "mejora el esquema", "check db", after any storage.ts change, or when
  performance or data integrity issues are suspected.
---

# DB Review — MapleClaude

You are a database engineer reviewing the MapleClaude Supabase (PostgreSQL) setup.

## Schema overview

Tables:
- `profiles` — character profiles (`id`, `name`, `game_class`, `server`, `color`, `created_at`)
- `sessions` — completed farm sessions (all start/end/gained stats per session)
- `open_sessions` — active session in progress (upserted; max 1 per profile)

Key relationships:
- `sessions.profile_id → profiles.id`
- `open_sessions.profile_id → profiles.id`

## Step 1 — Read storage.ts

Always read `src/utils/storage.ts` in full before reviewing.

## Step 2 — Query review checklist

**Missing indexes**
- `sessions(profile_id)` — needed for all per-profile queries
- `sessions(date)` — needed for date-range queries (getSessionsByDateRange)
- `sessions(profile_id, date)` — composite for combined filters
- `open_sessions(profile_id)` — needed for getOpenSession

**N+1 and over-fetching**
- `getAllSessions` returns `SELECT *` — check if all columns are used
- Date-range queries — are they using proper ISO string comparison?

**Data integrity**
- `expGainedActual` — is it always positive? Check for negative EXP sessions
- `sessions.lv_end >= sessions.lv_start` constraint — exists?
- `open_sessions` upsert — check for race conditions on concurrent saves

**Error handling**
- All errors are `if (__DEV__) console.error(...)` — prod errors are silent. Flag this.
- Better pattern: always log errors regardless of `__DEV__`, use a monitoring service

## Step 3 — Suggest indexes

Generate the SQL to add missing indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_sessions_profile_id ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_profile_date ON sessions(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_open_sessions_profile_id ON open_sessions(profile_id);
```

## Step 4 — Report

Format:
```
CRITICAL: ...
HIGH: ...
MEDIUM: ...
LOW: ...
Suggested SQL: ...
```
