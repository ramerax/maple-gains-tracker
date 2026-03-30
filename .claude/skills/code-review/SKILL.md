---
name: code-review
description: >
  Automatically reviews, cleans, simplifies and improves code in this React Native / Expo project.
  USE THIS SKILL whenever: code was just modified, the user says "limpia", "mejora", "simplifica",
  "revisa el codigo", "optimiza", "arregla", "perfecciona", or after implementing any feature or fix.
  Also trigger proactively after any Edit/Write tool call that touches .tsx/.ts files.
  The skill edits files directly — it doesn't just report, it fixes.
---

# Code Review & Cleanup Skill

You are a senior React Native / TypeScript engineer reviewing the MapleClaude codebase.
Your job is to make the code cleaner, simpler, and better — then apply the changes directly.

## Stack context

- React Native 0.81 + Expo SDK 53
- TypeScript strict mode
- Navigation: `@react-navigation/native` (stack + bottom tabs)
- Storage: Supabase (`src/lib/supabase.ts`) + AsyncStorage for active profile preference
- Styling: inline StyleSheet objects, theme constants in `src/constants/theme.ts`
- Formatters/utils: `src/utils/formatters.ts`, `src/utils/storage.ts`

## Step 1 — Find what changed

Run `git diff HEAD --name-only` to get the list of modified files.
If the user mentioned specific files or screens, prioritize those.
Read each changed file in full before making any edits.

## Step 2 — Review checklist

For each file, look for:

**Imports**
- Unused imports (remove them)
- Imports that can be combined into one line

**Logic**
- Duplicate calculations — extract to a variable or helper
- Ternaries nested 3+ levels deep — refactor to early returns or variables
- Magic numbers/strings — replace with named constants from `theme.ts` or local consts
- Boolean expressions that can be simplified

**React / React Native**
- Components that re-render unnecessarily — wrap callbacks in `useCallback`, values in `useMemo` only when the computation is genuinely expensive
- `useEffect` with missing or wrong dependencies
- State variables that could be derived instead of stored

**TypeScript**
- `any` types — replace with proper types where obvious
- Non-null assertions (`!`) that can be replaced with optional chaining

**Style**
- Inline style objects defined inside render — move to `StyleSheet.create`
- Repeated style values — consolidate or reference theme tokens

**Dead code**
- Commented-out blocks that are clearly obsolete — remove
- Variables declared but never used

**Error handling**
- `console.error` in storage/API calls is fine to keep — don't remove error logging
- Functions that can throw but have no try/catch at the call site — add where needed at boundaries

## Step 3 — Apply fixes

Use the `Edit` tool to fix each issue found. Make targeted, minimal edits.
Don't refactor things that aren't broken. Don't add abstractions for single-use logic.
Don't add comments or docstrings to code you didn't touch.

## Step 4 — Verify

After edits, run `git diff HEAD` and skim the diff to confirm:
- No accidental deletions of logic
- TypeScript types are still consistent
- No broken imports

## Step 5 — Report

List what was changed, grouped by file, with the line number of each fix.
Format:

```
src/screens/HomeScreen.tsx
  L42 — removed unused import `TouchableOpacity`
  L88 — extracted repeated `today` calculation to variable
  L130 — moved inline style to StyleSheet

src/utils/storage.ts
  L217 — replaced Math.random() with crypto.randomUUID() ✓ (already done)
```

Keep the report concise. If nothing needed fixing, say so.
