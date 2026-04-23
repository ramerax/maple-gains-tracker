/**
 * StatsScreenDesktop — Web-native statistics dashboard
 * Layout: header | hero period row | bar chart | best days + totals
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session, OpenSession } from '../types';
import { WC } from '../constants/themeWeb';
import {
  formatExp, formatNumber, formatPercent, formatDateShortEs,
} from '../utils/formatters';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statLine}>
      <View style={[styles.statLineDot, { backgroundColor: color }]} />
      <Text style={styles.statLineLabel}>{label}</Text>
      <Text style={[styles.statLineValue, { color }]}>{value}</Text>
    </View>
  );
}

function PeriodHero({ title, sessions, accentColor, onNewSession, hasOpenSession }: {
  title: string;
  sessions: Session[];
  accentColor: string;
  onNewSession?: () => void;
  hasOpenSession?: boolean;
}) {
  const empty = sessions.length === 0;

  const sorted = empty ? [] : [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
  );
  const first = sorted[0];
  const last  = sorted[sorted.length - 1];

  const totalExp    = sessions.reduce((s, r) => s + r.expGainedActual, 0);
  const totalMesos  = sessions.reduce((s, r) => s + r.mesosGained, 0);
  const totalFrags  = sessions.reduce((s, r) => s + r.fragsGained, 0);
  const totalNodes  = sessions.reduce((s, r) => s + r.nodesGained, 0);
  const totalCommon = sessions.reduce((s, r) => s + r.commonFamiliarsGained, 0);
  const totalRare   = sessions.reduce((s, r) => s + r.rareFamiliarsGained, 0);

  return (
    <View style={[
      styles.periodHero,
      { borderTopColor: accentColor, shadowColor: accentColor },
    ]}>
      {/* Tinted inner glow area */}
      <View style={[styles.periodHeroGlow, { backgroundColor: accentColor + '09' }]} />

      {/* Header */}
      <View style={styles.periodHeroHdr}>
        <Text style={styles.periodHeroTitle}>{title}</Text>
        <View style={[styles.periodHeroCountBadge, {
          backgroundColor: accentColor + '18',
          borderColor: accentColor + '40',
        }]}>
          <Text style={[styles.periodHeroCount, { color: accentColor }]}>
            {empty ? '0' : sessions.length}
          </Text>
        </View>
      </View>

      {/* Level range */}
      {!empty && first && last && (
        <View style={[styles.levelBadge, { borderColor: accentColor + '35' }]}>
          <Ionicons name="trending-up" size={11} color={accentColor} />
          <Text style={styles.levelBadgeText}>
            {' '}Lv {first.lvStart} ({formatPercent(first.expStart)}%)
            {' → '}Lv {last.lvEnd} ({formatPercent(last.expEnd)}%)
          </Text>
        </View>
      )}

      {/* Stats */}
      {!empty ? (
        <>
          <Text style={styles.heroExpLabel}>EXP GANADA</Text>
          <Text style={[styles.heroExp, { color: accentColor }]}>{formatExp(totalExp)}</Text>
          <View style={styles.heroSep} />
          <StatLine label="Mesos" value={formatExp(totalMesos)}   color={WC.mesos} />
          <StatLine label="Frags" value={formatNumber(totalFrags)} color={WC.frags} />
          <StatLine label="Nodos" value={formatNumber(totalNodes)} color={WC.nodes} />
          {totalCommon > 0 && <StatLine label="Fam. C" value={String(totalCommon)} color={WC.common} />}
          {totalRare   > 0 && <StatLine label="Fam. R" value={String(totalRare)}   color={WC.rare} />}
        </>
      ) : (
        <View style={styles.emptyHeroBody}>
          {hasOpenSession ? (
            <View style={[styles.openBadge, { borderColor: accentColor + '40' }]}>
              <View style={[styles.openDot, { backgroundColor: accentColor, shadowColor: accentColor }]} />
              <Text style={[styles.openBadgeText, { color: accentColor }]}>Sesión en progreso</Text>
            </View>
          ) : onNewSession ? (
            <TouchableOpacity style={styles.newSessionBtn} onPress={onNewSession} activeOpacity={0.8}>
              <Ionicons name="flash" size={13} color="#fff" />
              <Text style={styles.newSessionBtnText}>Nueva Sesión</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyHint}>Sin datos para este período</Text>
          )}
        </View>
      )}
    </View>
  );
}

function BarChart({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null;

  const byDate: Record<string, number> = {};
  for (const s of sessions) {
    byDate[s.date] = (byDate[s.date] ?? 0) + s.expGainedActual;
  }
  const sorted = Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14)
    .reverse();

  if (sorted.length === 0) return null;
  const maxVal = Math.max(...sorted.map(([, v]) => v));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartTitleRow}>
        <View style={styles.chartTitleAccent} />
        <Text style={styles.chartTitle}>EXP POR DÍA</Text>
        <Text style={styles.chartSubtitle}>ÚLTIMOS {sorted.length} DÍAS</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.chartMaxBadge}>
          <Text style={styles.chartMaxText}>max {formatExp(maxVal)}</Text>
        </View>
      </View>
      <View style={styles.chartBars}>
        {sorted.map(([date, val]) => {
          const pct    = maxVal > 0 ? val / maxVal : 0;
          const isMax  = val === maxVal;
          const isGood = pct >= 0.6;
          return (
            <View key={date} style={styles.chartCol}>
              {/* Value label — show only for tall bars */}
              <Text style={[
                styles.chartValLabel,
                { opacity: isMax ? 1 : isGood ? 0.6 : 0 },
              ]}>
                {formatExp(val)}
              </Text>
              <View style={styles.chartBarTrack}>
                {/* Fill */}
                <View style={[
                  styles.chartBarFill,
                  { height: `${Math.max(pct * 100, 3)}%` as `${number}%` },
                  isMax && styles.chartBarFillMax,
                ]} />
                {/* Glow cap on max bar */}
                {isMax && (
                  <View style={[
                    styles.chartBarGlowCap,
                    { bottom: `${Math.max(pct * 100 - 3, 0)}%` as `${number}%` },
                  ]} />
                )}
              </View>
              <Text style={[styles.chartDateLabel, isMax && styles.chartDateLabelMax]}>
                {formatDateShortEs(date)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const BEST_META: Array<{
  label: string;
  icon:  keyof typeof Ionicons.glyphMap;
  color: string;
  bg:    string;
  getValue: (s: Session) => number;
  fmt:  (n: number) => string;
}> = [
  { label: 'Más EXP',   icon: 'flash',          color: WC.exp,   bg: WC.expBg,   getValue: (s) => s.expGainedActual, fmt: formatExp    },
  { label: 'Más Frags', icon: 'diamond',         color: WC.frags, bg: WC.fragsBg, getValue: (s) => s.fragsGained,     fmt: formatNumber },
  { label: 'Más Nodos', icon: 'grid',            color: WC.nodes, bg: WC.nodesBg, getValue: (s) => s.nodesGained,     fmt: formatNumber },
  { label: 'Más Mesos', icon: 'cash',            color: WC.mesos, bg: WC.mesosBg, getValue: (s) => s.mesosGained,     fmt: formatExp    },
];

function BestDaysGrid({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null;

  return (
    <View style={styles.bestGrid}>
      {BEST_META.map(({ label, icon, color, bg, getValue, fmt }) => {
        const byDate: Record<string, number> = {};
        for (const s of sessions) byDate[s.date] = (byDate[s.date] ?? 0) + getValue(s);
        const entry = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
        if (!entry) return null;

        return (
          <View key={label} style={[
            styles.bestCell,
            { borderTopColor: color, shadowColor: color },
          ]}>
            {/* Icon + label row */}
            <View style={styles.bestCellHeader}>
              <View style={[styles.bestCellIconBox, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={13} color={color} />
              </View>
              <Text style={styles.bestCellLabel}>{label}</Text>
            </View>
            {/* Value */}
            <Text style={[styles.bestCellValue, { color }]}>{fmt(entry[1])}</Text>
            {/* Date */}
            <View style={styles.bestCellDateRow}>
              <Ionicons name="calendar-outline" size={9} color={WC.textFaint} />
              <Text style={styles.bestCellDate}>{' '}{formatDateShortEs(entry[0])}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  allSessions:    Session[];
  todaySessions:  Session[];
  weekSessions:   Session[];
  monthSessions:  Session[];
  totalExp:    number;
  totalFrags:  number;
  totalNodes:  number;
  totalMesos:  number;
  totalCommon: number;
  totalRare:   number;
  openSession: OpenSession | null;
  onNewSession: () => void;
  refreshing: boolean;
  onRefresh:  () => void;
}

export default function StatsScreenDesktop({
  allSessions, todaySessions, weekSessions, monthSessions,
  totalExp, totalFrags, totalNodes, totalMesos, totalCommon, totalRare,
  openSession, onNewSession, refreshing, onRefresh,
}: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WC.primary} />}
    >

      {/* ── PAGE HEADER ────────────────────────────────────────────── */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Estadísticas</Text>
          <Text style={styles.pageSubtitle}>
            {allSessions.length} {allSessions.length === 1 ? 'sesión registrada' : 'sesiones registradas'}
          </Text>
        </View>
        {/* Summary badges */}
        <View style={styles.headerBadges}>
          <View style={[styles.headerBadge, { backgroundColor: WC.expBg, borderColor: 'rgba(217,70,239,0.25)' }]}>
            <Ionicons name="flash" size={11} color={WC.exp} />
            <Text style={[styles.headerBadgeText, { color: WC.exp }]}>{formatExp(totalExp)}</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: WC.fragsBg, borderColor: 'rgba(129,140,248,0.25)' }]}>
            <Ionicons name="diamond" size={11} color={WC.frags} />
            <Text style={[styles.headerBadgeText, { color: WC.frags }]}>{formatNumber(totalFrags)}</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: WC.mesosBg, borderColor: 'rgba(252,211,77,0.25)' }]}>
            <Ionicons name="cash" size={11} color={WC.mesos} />
            <Text style={[styles.headerBadgeText, { color: WC.mesos }]}>{formatExp(totalMesos)}</Text>
          </View>
        </View>
      </View>

      {/* ── PERIOD HERO ROW ────────────────────────────────────────── */}
      <View style={styles.periodRow}>
        <PeriodHero
          title="☀️  Hoy"
          sessions={todaySessions}
          accentColor={WC.primary}
          hasOpenSession={!!openSession}
          onNewSession={onNewSession}
        />
        <PeriodHero
          title="📅  Esta Semana"
          sessions={weekSessions}
          accentColor={WC.frags}
        />
        <PeriodHero
          title="🗓️  Este Mes"
          sessions={monthSessions}
          accentColor={WC.exp}
        />
      </View>

      {allSessions.length > 0 && (
        <>
          {/* ── BAR CHART ────────────────────────────────────────────── */}
          <BarChart sessions={allSessions} />

          {/* ── BOTTOM ROW: Best days + Totals ───────────────────────── */}
          <View style={styles.bottomRow}>

            {/* Best days */}
            <View style={styles.bestSection}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionTitleDot, { backgroundColor: WC.exp }]} />
                <Text style={styles.sectionTitle}>MEJORES DÍAS</Text>
              </View>
              <BestDaysGrid sessions={allSessions} />
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionTitleDot, { backgroundColor: WC.primary }]} />
                <Text style={styles.sectionTitle}>TOTALES HISTÓRICOS</Text>
              </View>
              <View style={styles.totalsPanel}>
                <StatLine label="EXP total"    value={formatExp(totalExp)}      color={WC.exp} />
                <StatLine label="Mesos"        value={formatExp(totalMesos)}    color={WC.mesos} />
                <StatLine label="Fragmentos"   value={formatNumber(totalFrags)} color={WC.frags} />
                <StatLine label="Nodos"        value={formatNumber(totalNodes)} color={WC.nodes} />
                <StatLine label="Fam. Comunes" value={String(totalCommon)}      color={WC.common} />
                <StatLine label="Fam. Raros"   value={String(totalRare)}        color={WC.rare} />
                <View style={styles.totalsSep} />
                <View style={styles.totalSessionsRow}>
                  <Ionicons name="layers-outline" size={12} color={WC.textMuted} />
                  <Text style={styles.totalSessions}>
                    {' '}{allSessions.length} sesiones en total
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WC.bg },
  content: {
    padding: 28,
    paddingBottom: 60,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center' as const,
  },

  // ── Page header ──────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  pageTitle: {
    color: WC.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  pageSubtitle: { color: WC.textMuted, fontSize: 13, marginTop: 4 },

  headerBadges: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700' },

  // ── Period hero row ───────────────────────────────────────────────────────
  periodRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },

  periodHero: {
    flex: 1,
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    borderTopWidth: 3,
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  periodHeroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  periodHeroHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodHeroTitle: { color: WC.text, fontSize: 14, fontWeight: '800' },
  periodHeroCountBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  periodHeroCount: { fontSize: 12, fontWeight: '800' },

  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 12,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 10, color: WC.textDim, flex: 1, flexWrap: 'wrap' },

  heroExpLabel: {
    fontSize: 8,
    color: WC.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  heroExp: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  heroSep: { height: 1, backgroundColor: WC.sep, marginBottom: 8 },

  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
    gap: 8,
  },
  statLineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  statLineLabel: { color: WC.textMuted, fontSize: 12, flex: 1 },
  statLineValue: { fontSize: 13, fontWeight: '700' },

  emptyHeroBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  emptyHint: { color: WC.textMuted, fontSize: 12, textAlign: 'center' },

  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: WC.primaryDim,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  openBadgeText: { fontSize: 12, fontWeight: '700' },
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: WC.btn,
    borderRadius: 50,
    paddingVertical: 9,
    paddingHorizontal: 18,
    shadowColor: WC.btnGlow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  newSessionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // ── Bar chart ─────────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chartTitleAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: WC.exp,
  },
  chartTitle: {
    color: WC.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chartSubtitle: {
    color: WC.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  chartMaxBadge: {
    backgroundColor: WC.expBg,
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.20)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chartMaxText: { color: WC.expDim, fontSize: 10, fontWeight: '700' },

  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    gap: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartValLabel: {
    color: WC.expDim,
    fontSize: 7,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  chartBarTrack: {
    width: '68%',
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WC.panelBorder,
    position: 'relative',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: WC.exp,
    borderRadius: 3,
    opacity: 0.55,
  },
  chartBarFillMax: {
    opacity: 0.95,
    shadowColor: WC.exp,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  chartBarGlowCap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: WC.expDim,
    borderRadius: 2,
  },
  chartDateLabel: {
    color: WC.textFaint,
    fontSize: 7,
    marginTop: 5,
    textAlign: 'center',
  },
  chartDateLabelMax: { color: WC.expDim, fontWeight: '700' },

  // ── Bottom row ────────────────────────────────────────────────────────────
  bottomRow: { flexDirection: 'row', gap: 20 },
  bestSection: { flex: 1 },
  totalsSection: { width: 300 },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitleDot: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    color: WC.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Best days grid
  bestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bestCell: {
    width: '47%',
    backgroundColor: WC.cardBg,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    borderTopWidth: 3,
    borderRadius: 14,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  bestCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bestCellIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestCellLabel: {
    color: WC.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  bestCellValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  bestCellDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestCellDate: {
    color: WC.textFaint,
    fontSize: 10,
  },

  // Totals panel
  totalsPanel: {
    backgroundColor: WC.cardBg,
    borderWidth: 1,
    borderColor: WC.panelBorderStrong,
    borderRadius: 16,
    padding: 20,
  },
  totalsSep: {
    height: 1,
    backgroundColor: WC.sep,
    marginVertical: 14,
  },
  totalSessionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalSessions: {
    color: WC.textMuted,
    fontSize: 11,
  },
});
