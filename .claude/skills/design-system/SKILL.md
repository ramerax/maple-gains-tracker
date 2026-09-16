---
name: design-system
description: >
  Glass Cosmos design system enforcer for MapleClaude. USE when: user says "revisa el diseño",
  "verifica consistencia visual", "diseño está roto", or when touching any .tsx file with UI.
  Ensures all screens use WC tokens, consistent spacing, and Glass Cosmos palette.
---

# Design System — Glass Cosmos (MapleClaude)

You are a UI engineer enforcing the Glass Cosmos design system across MapleClaude.

## Palette (WC tokens from `src/constants/themeWeb.ts`)

```
bg:           #040215   — page background
panelBg:      card/panel background  
cardBg:       deeper card
primary:      #C49FFF   — purple accent, interactive elements
primaryDim:   rgba(180,127,255,0.12)  — primary tinted backgrounds
primaryBorder: rgba(180,127,255,0.30) — primary borders
btn:          #3A1090   — button fill
btnGlow:      #5A18CC   — button glow / finish-session CTA
exp:          #D946EF   — fuchsia, EXP stat
frags:        #818CF8   — indigo, fragments stat
nodes:        #7DD3FC   — sky blue, nodes stat
mesos:        #FCD34D   — amber, mesos stat
common:       #CBD5E1   — slate, common familiars
rare:         #60A5FA   — blue, rare familiars
text:         #FFFFFF
textDim:      rgba(255,255,255,0.65)
textMuted:    rgba(255,255,255,0.35)
textFaint:    rgba(255,255,255,0.18)
sep:          rgba(255,255,255,0.07) — separators/dividers
```

## Enforcement rules

**Token usage**
- NEVER hardcode hex colors — always use `WC.token` (web) or `COLORS.token` (mobile)
- Font sizes: always use `FONTS.xs/sm/md/lg/xl/xxl/title` — no raw numbers
- Spacing: always use `SPACING.xs/sm/md/lg/xl/xxl` — no raw px except in complex layout math
- Border radius: `RADIUS.sm/md/lg/xl`

**Stat color mapping** (enforced everywhere)
- EXP → `WC.exp` (#D946EF fuchsia)
- Frags → `WC.frags` (#818CF8 indigo)
- Nodos → `WC.nodes` (#7DD3FC sky)
- Mesos → `WC.mesos` (#FCD34D amber)
- Common Familiars → `WC.common` (#CBD5E1)
- Rare Familiars → `WC.rare` (#60A5FA)

**Mobile vs desktop**
- Mobile screens: use `COLORS` from `src/constants/theme.ts` (mirrors WC palette)
- Desktop screens: use `WC` from `src/constants/themeWeb.ts`
- Both use same underlying values — keep them in sync

**Glass Cosmos aesthetic**
- Backgrounds: layered dark purples (bg → panelBg → cardBg)
- Borders: very subtle (`sep`, `panelBorder`, `panelBorderStrong`)
- Glows: shadow on primary/exp elements (`shadowColor: WC.primary`, opacity 0.2–0.4)
- Typography: heavy weights (700–900) for values, lighter (500–600) for labels
- No white backgrounds, no light themes, no non-WC colors

## Step 1 — Read changed files

Read every `.tsx` file that was modified (`git diff HEAD --name-only`).

## Step 2 — Audit

For each file check:
- [ ] All colors use WC/COLORS tokens
- [ ] Font sizes use FONTS scale
- [ ] Spacing uses SPACING scale
- [ ] Stat colors follow the mapping above
- [ ] No inline style objects that duplicate StyleSheet entries
- [ ] Glass Cosmos dark background is maintained

## Step 3 — Fix and report

Apply fixes with Edit tool. Report per file.
