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

  const sorted = empty ? [] : [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalExp    = sessions.reduce((s, r) => s + r.expGainedActual, 0);
  const totalMesos  = sessions.reduce((s, r) => s + r.mesosGained, 0);
  const totalFrags  = sessions.reduce((s, r) => s + r.fragsGained, 0);
  const totalNodes  = sessions.reduce((s, r) => s + r.nodesGained, 0);
  const totalCommon = sessions.reduce((s, r) => s + r.commonFamiliarsGained, 0);
  const totalRare   = sessions.reduce((s, r) => s + r.rareFamiliarsGained, 0);

  return (
    <View style={[styles.periodHero, { borderTopColor: accentColor }]}>
      {/* Header row */}
      <View style={styles.periodHeroHdr}>
        <Text style={styles.periodHeroTitle}>{title}</Text>
        <Text style={[styles.periodHeroCount, { color: accentColor }]}>
          {empty ? '0 sesiones' : `${sessions.length} ${sessions.length === 1 ? 'sesión' : 'sesiones'}`}
        </Text>
      </View>

      {/* Level range */}
      {!empty && first && last && (
        <View style={[styles.levelBadge, { borderColor: accentColor + '40' }]}>
          <Ionicons name="trending-up" size={11} color={accentColor} />
          <Text style={styles.levelBadgeText}>
            {' '}Lv {first.lvStart} ({formatPercent(first.expStart)}%)
            {' → '}Lv {last.lvEnd} ({formatPercent(last.expEnd)}%)
          </Text>
        </View>
      )}

      {/* Big EXP stat */}
      {!empty ? (
        <>
          <Text style={[styles.heroExpLabel]}>EXP GANADA</Text>
          <Text style={[styles.heroExp, { color: WC.exp }]}>{formatExp(totalExp)}</Text>
          <View style={styles.heroSep} />
          <StatLine label="Mesos"    value={formatExp(totalMesos)}        color={WC.mesos} />
          <StatLine label="Frags"    value={formatNumber(totalFrags)}      color={WC.frags} />
          <StatLine label="Nodos"    value={formatNumber(totalNodes)}      color={WC.nodes} />
          {totalCommon > 0 && <StatLine label="Fam. C" value={String(totalCommon)} color={WC.common} />}
          {totalRare > 0 && <StatLine label="Fam. R"   value={String(totalRare)}   color={WC.rare} />}
        </>
      ) : (
        <View style={styles.emptyHeroBody}>
          {hasOpenSession ? (
            <View style={styles.openBadge}>
              <View style={[styles.openDot, { shadowColor: accentColor }]} />
              <Text style={[styles.openBadgeText, { color: accentColor }]}>Sesión en progreso</Text>
            </View>
          ) : onNewSession ? (
            <TouchableOpacity style={styles.newSessionBtn} onPress={onNewSession} activeOpacity={0.8}>
              <Text style={styles.newSessionBtnText}>▶  Nueva Sesión</Text>
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
      <Text style={styles.chartTitle}>EXP POR DÍA — ÚLTIMOS {sorted.length} DÍAS</Text>
      <View style={styles.chartBars}>
        {sorted.map(([date, val]) => {
          const pct = maxVal > 0 ? val / maxVal : 0;
          return (
            <View key={date} style={styles.chartCol}>
              <Text style={styles.chartValLabel}>{formatExp(val)}</Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBarFill, { height: `${Math.max(pct * 100, 4)}%` as `${number}%` }]} />
              </View>
              <Text style={styles.chartDateLabel}>{formatDateShortEs(date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BestDaysGrid({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null;

  const bestOf = (getValue: (s: Session) => number) => {
    const byDate: Record<string, number> = {};
    for (const s of sessions) byDate[s.date] = (byDate[s.date] ?? 0) + getValue(s);
    return Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
  };

  const bests = [
    { label: 'Más EXP',   color: WC.exp,   entry: bestOf((s) => s.expGainedActual), fmt: formatExp },
    { label: 'Más Frags', color: WC.frags,  entry: bestOf((s) => s.fragsGained),     fmt: formatNumber },
    { label: 'Más Nodos', color: WC.nodes,  entry: bestOf((s) => s.nodesGained),     fmt: formatNumber },
    { label: 'Más Mesos', color: WC.mesos,  entry: bestOf((s) => s.mesosGained),     fmt: formatExp },
  ];

  return (
    <View style={styles.bestGrid}>
      {bests.map(({ label, color, entry, fmt }) => {
        if (!entry) return null;
        return (
          <View key={label} style={[styles.bestCell, { borderTopColor: color }]}>
            <Text style={styles.bestCellLabel}>{label}</Text>
            <Text style={[styles.bestCellValue, { color }]}>{fmt(entry[1])}</Text>
            <Text style={styles.bestCellDate}>{formatDateShortEs(entry[0])}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  allSessions: Session[];
  todaySessions: Session[];
  weekSessions: Session[];
  monthSessions: Session[];
  totalExp: number;
  totalFrags: number;
  totalNodes: number;
  totalMesos: number;
  totalCommon: number;
  totalRare: number;
  openSession: OpenSession | null;
  onNewSession: () => void;
  refreshing: boolean;
  onRefresh: () => void;
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
            <View style={styles.bestSection}>
              <Text style={styles.sectionTitle}>MEJORES DÍAS</Text>
              <BestDaysGrid sessions={allSessions} />
            </View>

            <View style={styles.totalsSection}>
              <Text style={styles.sectionTitle}>TOTALES HISTÓRICOS</Text>
              <View style={styles.totalsPanel}>
                <StatLine label="EXP total"    value={formatExp(totalExp)}      color={WC.exp} />
                <StatLine label="Mesos"        value={formatExp(totalMesos)}    color={WC.mesos} />
                <StatLine label="Fragmentos"   value={formatNumber(totalFrags)} color={WC.frags} />
                <StatLine label="Nodos"        value={formatNumber(totalNodes)} color={WC.nodes} />
                <StatLine label="Fam. Comunes" value={String(totalCommon)}      color={WC.common} />
                <StatLine label="Fam. Raros"   value={String(totalRare)}        color={WC.rare} />
                <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: WC.sep, paddingTop: 10 }}>
                  <Text style={styles.totalSessions}>
                    {allSessions.length} sesiones en total
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
  content: { padding: 28, paddingBottom: 60, maxWidth: 1280, width: '100%', alignSelf: 'center' as const },

  // Page header
  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 24,
  },
  pageTitle: { color: WC.text, fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  pageSubtitle: { color: WC.textMuted, fontSize: 13, marginTop: 4 },
  // Period hero panels
  periodRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  periodHero: {
    flex: 1,
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderTopWidth: 3,
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
  },
  periodHeroHdr: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  periodHeroTitle: { color: WC.text, fontSize: 15, fontWeight: '800' },
  periodHeroCount: { fontSize: 12, fontWeight: '700' },

  levelBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    marginBottom: 12, borderWidth: 1,
  },
  levelBadgeText: { fontSize: 10, color: WC.textDim, flex: 1, flexWrap: 'wrap' },

  heroExpLabel: {
    fontSize: 9, color: WC.textMuted, letterSpacing: 1.5,
    textTransform: 'uppercase', fontWeight: '700', marginBottom: 2,
  },
  heroExp: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, marginBottom: 12 },
  heroSep: { height: 1, backgroundColor: WC.sep, marginBottom: 8 },

  statLine: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: WC.sep,
  },
  statLineLabel: { color: WC.textMuted, fontSize: 12 },
  statLineValue: { fontSize: 13, fontWeight: '700' },

  emptyHeroBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  emptyHint: { color: WC.textMuted, fontSize: 12, textAlign: 'center' },

  openBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: WC.primaryDim, borderWidth: 1, borderColor: WC.primaryBorder,
    borderRadius: 50, paddingVertical: 8, paddingHorizontal: 14,
  },
  openDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: WC.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6,
  },
  openBadgeText: { fontSize: 12, fontWeight: '700' },
  newSessionBtn: {
    backgroundColor: WC.btn, borderRadius: 50,
    paddingVertical: 9, paddingHorizontal: 18,
    shadowColor: WC.btnGlow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 10,
  },
  newSessionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Bar chart
  chartCard: {
    backgroundColor: WC.panelBgStrong, borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 16, padding: 24, marginBottom: 24,
  },
  chartTitle: {
    color: WC.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 180, gap: 6 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartValLabel: { color: WC.exp, fontSize: 8, fontWeight: '700', marginBottom: 3, textAlign: 'center' },
  chartBarTrack: {
    width: '65%', height: '80%',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4,
    justifyContent: 'flex-end', overflow: 'hidden',
    borderWidth: 1, borderColor: WC.panelBorder,
  },
  chartBarFill: { width: '100%', backgroundColor: WC.exp, borderRadius: 3, opacity: 0.85 },
  chartDateLabel: { color: WC.textMuted, fontSize: 8, marginTop: 5, textAlign: 'center' },

  // Bottom section
  bottomRow: { flexDirection: 'row', gap: 20 },
  bestSection: { flex: 1 },
  totalsSection: { width: 300 },

  sectionTitle: {
    color: WC.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14,
  },

  bestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bestCell: {
    width: '47%',
    backgroundColor: WC.panelBgStrong, borderWidth: 1, borderColor: WC.panelBorder,
    borderTopWidth: 2, borderRadius: 12, padding: 16,
  },
  bestCellLabel: { color: WC.textMuted, fontSize: 11, marginBottom: 4 },
  bestCellValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  bestCellDate: { color: WC.textMuted, fontSize: 10, marginTop: 3 },

  totalsPanel: {
    backgroundColor: WC.panelBgStrong, borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 16, padding: 20,
  },
  totalSessions: { color: WC.textMuted, fontSize: 11, textAlign: 'center' },
});
