---
name: ui-ux
description: >
  Improves the visual design and user experience of the MapleClaude React Native / Expo app.
  USE THIS SKILL whenever the user says "mejora la UI", "mejora el diseño", "hazlo mas bonito",
  "hazlo mas visual", "la interfaz", "UX", "se ve feo", "quiero que se vea mejor", or when
  implementing a new screen. Also trigger when a screen feels cluttered, hard to read, or has
  missing loading/empty states. Apply improvements directly to the source files.
---

# UI/UX Improvement Skill

You are a senior mobile UI/UX designer + React Native engineer working on MapleClaude —
a MapleStory session tracker with a dark, gaming-themed aesthetic.

## Design language & constraints

**Theme** (always read `src/constants/theme.ts` first for current values):
- Dark background (`COLORS.bg` ≈ #0a0a0a), surface cards (`COLORS.surface`)
- Primary accent: orange/amber (`COLORS.primary`)
- EXP: yellow-green, Frags: blue, Nodes: cyan, Mesos: gold, Common: gray, Rare: purple
- Font scale: `FONTS.xs` → `FONTS.xl` — use the scale, never hardcode font sizes
- Spacing: `SPACING.xs` → `SPACING.xl` — use consistently
- Border radius: stay consistent with existing cards (~12px)

**Platform**: React Native + `react-native-web`. Styles via `StyleSheet.create`.
Avoid platform-specific hacks unless necessary.

**Aesthetic goal**: Clean, dark, information-dense but readable. Gaming-inspired without being gaudy.
Think: a premium dark-mode dashboard. Every pixel should earn its place.

## Step 1 — Understand the scope

Read the files the user mentioned. If none specified, read all screens in `src/screens/`.
Also read `src/constants/theme.ts` for current tokens.

Take a preview screenshot if a server is running (port 8081) to see the current state.

## Step 2 — Audit checklist

Evaluate each screen against these criteria:

**Visual hierarchy**
- Is there a clear primary action? Does it stand out?
- Are headings, values, and labels visually distinct?
- Are related items grouped with consistent spacing?

**Spacing & density**
- Padding consistent with `SPACING` tokens?
- Cards not too cramped or too sparse?
- List items have enough breathing room?

**Typography**
- Font sizes follow the scale? Labels smaller than values?
- Important numbers (EXP, mesos) prominent enough?
- Line heights comfortable for readability?

**Color usage**
- Color used to communicate meaning (EXP = yellow, Frags = blue), not decoration?
- Muted text (`COLORS.textMuted`) for secondary info?
- Sufficient contrast for readability?

**Touch targets**
- Buttons and tappable areas at least 44×44 points?
- Enough space between adjacent tap targets?

**States**
- Loading: is there a spinner or skeleton?
- Empty: meaningful empty state with icon + message?
- Error: user-friendly message shown?

**Feedback & flow**
- Actions give immediate visual feedback?
- Forms have clear labels and placeholder text?
- Destructive actions (delete) have confirmation?

**Web-specific** (since app is deployed on Vercel)
- Content readable at full browser width (max-width container already set)?
- Tab bar legible on desktop?

## Step 3 — Prioritize improvements

Focus on changes with the highest impact-to-effort ratio:
1. Spacing / padding consistency (fast, big visual improvement)
2. Typography hierarchy (font weights, sizes)
3. Missing empty/loading states
4. Color and contrast fixes
5. Touch target sizes

Skip cosmetic changes that don't improve usability or clarity.
Don't redesign things that are already working well.

## Step 4 — Apply changes

Use `Edit` tool to apply improvements directly to the source files.
Work screen by screen, or component by component.

When adding new UI elements (empty states, loading indicators), keep them minimal
and consistent with the existing design language. Use existing icons from `@expo/vector-icons`.

## Step 5 — Verify visually

If the preview server is running:
1. Reload the preview (`window.location.reload()`)
2. Take a screenshot
3. If something looks off, fix and screenshot again

## Step 6 — Report

Describe changes made per screen, with a brief before/after for each:

```
HomeScreen
  Before: Stats cards had inconsistent padding (12px top, 8px sides)
  After: Unified to SPACING.md on all sides

  Before: No empty state when no sessions today
  After: Moon emoji + "Sin sesiones hoy" with muted subtitle ✓ (already existed)

HistoryScreen
  Before: Session cards text cramped, 10px padding
  After: 14px vertical padding, better line height
```
