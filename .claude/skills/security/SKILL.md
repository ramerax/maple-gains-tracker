---
name: security
description: >
  Security audit for MapleClaude. USE when: user says "revisa seguridad", "quién puede ver mis datos",
  "verifica RLS", "security review", or after any change to storage.ts, supabase config, or DB schema.
  Focus: Supabase RLS policies, data isolation, anon-key exposure, and access control.
---

# Security Review — MapleClaude

You are a security engineer auditing the MapleClaude Supabase backend.
The app uses **anon key only** — no user auth (no Supabase Auth, no JWT from users).
This means **RLS policies are the ONLY wall between users' data**.

## Context

- Supabase project: `iqgpbzvyyywflluqhpqj`
- Tables: `profiles`, `sessions`, `open_sessions`
- Access pattern: app sends `profile_id` as a filter — but without RLS, anyone with the anon key can skip it
- Anon key IS public (embedded in the client bundle via `.env`) — this is by design, but RLS must compensate

## Step 1 — Check RLS status

Use the Supabase Management API or the Supabase dashboard to verify RLS is enabled on every table.
If RLS status is unknown, run:
```bash
curl -s "https://iqgpbzvyyywflluqhpqj.supabase.co/rest/v1/sessions?select=id,profile_id&limit=5" \
  -H "apikey: $(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)" \
  -H "Authorization: Bearer $(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)"
```
If this returns rows WITHOUT a profile_id filter → **RLS is not enforced or not enabled**.

## Step 2 — Audit checklist

**RLS (Row Level Security)**
- [ ] `sessions` table — RLS enabled? Policy requires matching `profile_id`?
- [ ] `profiles` table — RLS enabled? Policy restricts read/write to owner?
- [ ] `open_sessions` table — RLS enabled? Policy requires matching `profile_id`?
- [ ] No table is publicly readable/writable without a filter

**Current vulnerability: no Supabase Auth**
Since there's no auth (no `auth.uid()`), standard RLS (`auth.uid() = profile_id`) won't work.
The only option without adding auth is:
  - Keep tables open BUT add a secret `access_key` column per profile, distributed only to the owner
  - OR add Supabase Auth (email/password or magic link) — **recommended long-term**
  - OR use a Postgres function with a signed token check

**Recommended fix (minimal change): Supabase Auth**
1. Enable email auth in Supabase dashboard
2. Add `user_id UUID REFERENCES auth.users` to `profiles`, `sessions`, `open_sessions`
3. Create RLS policies: `auth.uid() = user_id`
4. Update `src/lib/supabase.ts` to call `supabase.auth.signIn()` on app start

**Short-term mitigation (no-auth approach)**
If adding auth is out of scope now, at minimum:
- Ensure the anon key is NOT the service key (check: it should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` and role should be `anon`, not `service_role`)
- Add a `secret_token` UUID column to `profiles`, generated at creation
- Require `secret_token` in all queries as an additional filter
- This still isn't proper auth but raises the bar significantly

## Step 3 — Check secret exposure

```bash
# Verify the anon key role (should be "anon", NOT "service_role")
node -e "const k='$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2)'; const p=JSON.parse(atob(k.split('.')[1])); console.log(p.role, p.iss);"

# Check .gitignore protects .env
grep '\.env' .gitignore
```

## Step 4 — Report format

List findings as:
- **CRITICAL**: data accessible without owner filter
- **HIGH**: anon key is service_role key
- **MEDIUM**: .env exposed in git history
- **LOW**: missing input validation, no rate limiting

Always end with a prioritized action plan.
