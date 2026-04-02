import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session, OpenSession } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { WC } from '../constants/themeWeb';
import { getAllSessions, getOpenSession } from '../utils/storage';
import {
  getTodayString, getWeekRange, getMonthRange,
  formatExp, formatNumber, formatPercent, formatDateMedium, formatDateShortEs,
} from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';
import { useIsDesktopWeb } from '../hooks/useIsDesktopWeb';

// ── Mobile sub-components ────────────────────────────────────────────────

function ExpBarChart({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null;

  const byDate: Record<string, number> = {};
  for (const s of sessions) {
    byDate[s.date] = (byDate[s.date] ?? 0) + s.expGainedActual;
  }
  const sorted = Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .reverse();

  if (sorted.length === 0) return null;

  const maxVal = Math.max(...sorted.map(([, v]) => v));

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>📈 EXP por día (últimos 7)</Text>
      <View style={styles.chartBars}>
        {sorted.map(([date, val]) => {
          const pct = maxVal > 0 ? val / maxVal : 0;
          const label = formatDateShortEs(date);
          return (
            <View key={date} style={styles.chartCol}>
              <Text style={styles.chartBarLabel}>{formatExp(val)}</Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBarFill, { height: `${Math.max(pct * 100, 4)}%` as `${number}%` }]} />
              </View>
              <Text style={styles.chartDateLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SumRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={[styles.sumValue, { color }]}>{value}</Text>
    </View>
  );
}

function BestDay({ sessions, label, color, getValue, format }: {
  sessions: Session[]; label: string; color: string;
  getValue: (s: Session) => number; format: (n: number) => string;
}) {
  if (sessions.length === 0) return null;
  const byDate: Record<string, number> = {};
  for (const s of sessions) {
    byDate[s.date] = (byDate[s.date] ?? 0) + getValue(s);
  }
  const best = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  return (
    <View style={[styles.bestDay, { borderLeftColor: color }]}>
      <Text style={[styles.bestDayValue, { color }]}>{format(best[1])}</Text>
      <Text style={styles.bestDayLabel}>{label}</Text>
      <Text style={styles.bestDayDate}>{formatDateMedium(best[0])}</Text>
    </View>
  );
}

function PeriodCard({ title, sessions, color }: {
  title: string; sessions: Session[]; color: string;
}) {
  if (sessions.length === 0) {
    return (
      <View style={[styles.periodCard, { borderLeftColor: color }]}>
        <View style={styles.periodTitleRow}>
          <Text style={styles.periodTitle}>{title}</Text>
          <Text style={styles.periodSessions}>0 sesiones</Text>
        </View>
        <SumRow label="EXP ganada"    value="—"  color={COLORS.textMuted} />
        <SumRow label="Fragmentos"    value="—"  color={COLORS.textMuted} />
        <SumRow label="Nodos"         value="—"  color={COLORS.textMuted} />
        <SumRow label="Mesos"         value="—"  color={COLORS.textMuted} />
        <SumRow label="Fam. Comunes"  value="—"  color={COLORS.textMuted} />
        <SumRow label="Fam. Raros"    value="—"  color={COLORS.textMuted} />
      </View>
    );
  }

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalExp     = sessions.reduce((s, r) => s + r.expGainedActual, 0);
  const totalFrags   = sessions.reduce((s, r) => s + r.fragsGained, 0);
  const totalNodes   = sessions.reduce((s, r) => s + r.nodesGained, 0);
  const totalMesos   = sessions.reduce((s, r) => s + r.mesosGained, 0);
  const totalCommon  = sessions.reduce((s, r) => s + r.commonFamiliarsGained, 0);
  const totalRare    = sessions.reduce((s, r) => s + r.rareFamiliarsGained, 0);

  return (
    <View style={[styles.periodCard, { borderLeftColor: color }]}>
      <View style={styles.periodTitleRow}>
        <Text style={styles.periodTitle}>{title}</Text>
        <Text style={styles.periodSessions}>{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}</Text>
      </View>
      <View style={styles.levelTrack}>
        <Ionicons name="trending-up" size={13} color={COLORS.primary} />
        <Text style={styles.levelTrackText}>
          {'  '}Lv {first.lvStart} ({formatPercent(first.expStart)}%){'  →  '}
          Lv {last.lvEnd} ({formatPercent(last.expEnd)}%)
        </Text>
      </View>
      <SumRow label="EXP ganada"    value={formatExp(totalExp)}             color={COLORS.exp} />
      <SumRow label="Fragmentos"    value={formatNumber(totalFrags)}  color={COLORS.frags} />
      <SumRow label="Nodos"         value={formatNumber(totalNodes)}  color={COLORS.nodes} />
      <SumRow label="Mesos"         value={formatExp(totalMesos)}     color={COLORS.mesos} />
      <SumRow label="Fam. Comunes"  value={String(totalCommon)}       color={COLORS.common} />
      <SumRow label="Fam. Raros"    value={String(totalRare)}         color={COLORS.rare} />
    </View>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Desktop sub-components ───────────────────────────────────────────────

function DeskStatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={dStyles.statRow}>
      <Text style={dStyles.statRowLabel}>{label}</Text>
      <Text style={[dStyles.statRowValue, { color }]}>{value}</Text>
    </View>
  );
}

function DeskPeriodPanel({ title, sessions, color, empty, onNewSession, hasOpenSession }: {
  title: string; sessions: Session[]; color: string; empty?: boolean; onNewSession?: () => void; hasOpenSession?: boolean;
}) {
  const isEmpty = sessions.length === 0 || empty;

  let first: Session | undefined, last: Session | undefined;
  let totalExp = 0, totalFrags = 0, totalNodes = 0, totalMesos = 0, totalCommon = 0, totalRare = 0;

  if (!isEmpty) {
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    first = sorted[0];
    last = sorted[sorted.length - 1];
    totalExp   = sessions.reduce((s, r) => s + r.expGainedActual, 0);
    totalFrags = sessions.reduce((s, r) => s + r.fragsGained, 0);
    totalNodes = sessions.reduce((s, r) => s + r.nodesGained, 0);
    totalMesos = sessions.reduce((s, r) => s + r.mesosGained, 0);
    totalCommon = sessions.reduce((s, r) => s + r.commonFamiliarsGained, 0);
    totalRare  = sessions.reduce((s, r) => s + r.rareFamiliarsGained, 0);
  }

  return (
    <View style={[dStyles.periodPanel, { borderTopColor: color }]}>
      <View style={dStyles.periodPanelHdr}>
        <Text style={dStyles.periodPanelTitle}>{title}</Text>
        <Text style={[dStyles.periodPanelCount, { color }]}>
          {isEmpty ? '0 sesiones' : `${sessions.length} ${sessions.length !== 1 ? 'sesiones' : 'sesión'}`}
        </Text>
      </View>

      {!isEmpty && first && last && (
        <View style={dStyles.levelBadge}>
          <Ionicons name="trending-up" size={11} color={color} />
          <Text style={dStyles.levelBadgeText}>
            {' '}Lv {first.lvStart} ({formatPercent(first.expStart)}%) → Lv {last.lvEnd} ({formatPercent(last.expEnd)}%)
          </Text>
        </View>
      )}

      <DeskStatRow label="EXP"    value={isEmpty ? '—' : formatExp(totalExp)}         color={isEmpty ? WC.textMuted : WC.exp} />
      <DeskStatRow label="Frags"  value={isEmpty ? '—' : formatNumber(totalFrags)}    color={isEmpty ? WC.textMuted : WC.frags} />
      <DeskStatRow label="Nodos"  value={isEmpty ? '—' : formatNumber(totalNodes)}    color={isEmpty ? WC.textMuted : WC.nodes} />
      <DeskStatRow label="Mesos"  value={isEmpty ? '—' : formatExp(totalMesos)}       color={isEmpty ? WC.textMuted : WC.mesos} />
      <DeskStatRow label="Fam. C" value={isEmpty ? '—' : String(totalCommon)}         color={isEmpty ? WC.textMuted : WC.common} />
      <DeskStatRow label="Fam. R" value={isEmpty ? '—' : String(totalRare)}           color={isEmpty ? WC.textMuted : WC.rare} />

      {isEmpty && (
        hasOpenSession ? (
          <View style={dStyles.openSessionBadge}>
            <View style={dStyles.openSessionDot} />
            <Text style={dStyles.openSessionBadgeText}>Sesión en progreso</Text>
          </View>
        ) : onNewSession ? (
          <TouchableOpacity style={dStyles.newSessionBtn} onPress={onNewSession} activeOpacity={0.8}>
            <Text style={dStyles.newSessionBtnText}>▶  Nueva Sesión</Text>
          </TouchableOpacity>
        ) : null
      )}
    </View>
  );
}

function DeskBarChart({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null;

  const byDate: Record<string, number> = {};
  for (const s of sessions) {
    byDate[s.date] = (byDate[s.date] ?? 0) + s.expGainedActual;
  }
  const sorted = Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .reverse();

  if (sorted.length === 0) return null;
  const maxVal = Math.max(...sorted.map(([, v]) => v));

  return (
    <View style={dStyles.chartCard}>
      <Text style={dStyles.chartTitle}>EXP POR DÍA (ÚLTIMOS 7)</Text>
      <View style={dStyles.chartBars}>
        {sorted.map(([date, val]) => {
          const pct = maxVal > 0 ? val / maxVal : 0;
          return (
            <View key={date} style={dStyles.chartCol}>
              <Text style={dStyles.chartValLabel}>{formatExp(val)}</Text>
              <View style={dStyles.chartBarTrack}>
                <View style={[dStyles.chartBarFill, { height: `${Math.max(pct * 100, 4)}%` as `${number}%` }]} />
              </View>
              <Text style={dStyles.chartDateLabel}>{formatDateShortEs(date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DeskBestDays({ sessions }: { sessions: Session[] }) {
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
    <View style={dStyles.bestGrid}>
      {bests.map(({ label, color, entry, fmt }) => {
        if (!entry) return null;
        return (
          <View key={label} style={[dStyles.bestCell, { borderTopColor: color }]}>
            <Text style={[dStyles.bestVal, { color }]}>{fmt(entry[1])}</Text>
            <Text style={dStyles.bestLabel}>{label}</Text>
            <Text style={dStyles.bestDate}>{formatDateShortEs(entry[0])}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export default function StatsScreen() {
  const { activeProfileId } = useProfile();
  const isDesktop = useIsDesktopWeb();
  const navigation = useNavigation<Nav>();
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [all, open] = await Promise.all([
      getAllSessions(activeProfileId ?? undefined),
      getOpenSession(activeProfileId ?? undefined),
    ]);
    setAllSessions(all);
    setOpenSession(open);
  }, [activeProfileId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const today = getTodayString();
  const { start: wS, end: wE } = getWeekRange(today);
  const { start: mS, end: mE } = getMonthRange(today);

  const todaySessions = allSessions.filter((s) => s.date === today);
  const weekSessions  = allSessions.filter((s) => s.date >= wS && s.date <= wE);
  const monthSessions = allSessions.filter((s) => s.date >= mS && s.date <= mE);

  const totalExp    = allSessions.reduce((s, r) => s + r.expGainedActual, 0);
  const totalFrags  = allSessions.reduce((s, r) => s + r.fragsGained, 0);
  const totalNodes  = allSessions.reduce((s, r) => s + r.nodesGained, 0);
  const totalMesos  = allSessions.reduce((s, r) => s + r.mesosGained, 0);
  const totalCommon = allSessions.reduce((s, r) => s + r.commonFamiliarsGained, 0);
  const totalRare   = allSessions.reduce((s, r) => s + r.rareFamiliarsGained, 0);

  // ── Desktop layout ───────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <ScrollView
        style={dStyles.container}
        contentContainerStyle={dStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WC.primary} />}
      >
        {/* Header */}
        <View style={dStyles.pageHeader}>
          <Text style={dStyles.pageTitle}>Estadísticas</Text>
          <Text style={dStyles.pageSubtitle}>
            {allSessions.length} {allSessions.length === 1 ? 'sesión' : 'sesiones'} registradas
          </Text>
        </View>

        {/* Period panels row */}
        <View style={dStyles.periodRow}>
          <DeskPeriodPanel title="☀️  Hoy"         sessions={todaySessions} color={WC.primary} hasOpenSession={!!openSession} onNewSession={() => navigation.navigate('StartSession')} />
          <DeskPeriodPanel title="📅  Esta Semana" sessions={weekSessions}  color={WC.frags} />
          <DeskPeriodPanel title="🗓️  Este Mes"    sessions={monthSessions} color={WC.exp} />
        </View>

        {allSessions.length > 0 && (
          <>
            {/* Bar chart */}
            <DeskBarChart sessions={allSessions} />

            {/* Best days + totals side by side */}
            <View style={dStyles.bottomRow}>
              <View style={dStyles.bestSection}>
                <Text style={dStyles.sectionTitle}>MEJORES DÍAS</Text>
                <DeskBestDays sessions={allSessions} />
              </View>

              <View style={dStyles.totalsSection}>
                <Text style={dStyles.sectionTitle}>TOTALES HISTÓRICOS</Text>
                <View style={dStyles.totalsPanel}>
                  <DeskStatRow label="EXP total"    value={formatExp(totalExp)}      color={WC.exp} />
                  <DeskStatRow label="Fragmentos"   value={formatNumber(totalFrags)} color={WC.frags} />
                  <DeskStatRow label="Nodos"        value={formatNumber(totalNodes)} color={WC.nodes} />
                  <DeskStatRow label="Mesos"        value={formatExp(totalMesos)}    color={WC.mesos} />
                  <DeskStatRow label="Fam. Comunes" value={String(totalCommon)}      color={WC.common} />
                  <DeskStatRow label="Fam. Raros"   value={String(totalRare)}        color={WC.rare} />
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  // ── Mobile layout ────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>📊 Estadísticas</Text>
        <Text style={styles.pageSubtitle}>{allSessions.length} {allSessions.length === 1 ? 'sesión' : 'sesiones'} en total</Text>
      </View>

      <View style={styles.periodGrid}>
        <View>
          <PeriodCard title="☀️  Hoy"         sessions={todaySessions} color={COLORS.primary} />
          <PeriodCard title="📅  Esta Semana" sessions={weekSessions}   color={COLORS.frags} />
        </View>
        <View>
          <PeriodCard title="🗓️  Este Mes"    sessions={monthSessions}  color={COLORS.exp} />
        </View>
      </View>

      {allSessions.length > 0 && (
        <>
          <ExpBarChart sessions={allSessions} />

          <Text style={styles.sectionTitle}>🏆 Mejores Días</Text>
          <View style={styles.bestGrid}>
            <BestDay sessions={allSessions} label="Más EXP"   color={COLORS.exp}   getValue={(s) => s.expGainedActual} format={formatExp} />
            <BestDay sessions={allSessions} label="Más Frags" color={COLORS.frags} getValue={(s) => s.fragsGained}     format={formatNumber} />
            <BestDay sessions={allSessions} label="Más Nodos" color={COLORS.nodes} getValue={(s) => s.nodesGained}     format={formatNumber} />
            <BestDay sessions={allSessions} label="Más Mesos" color={COLORS.mesos} getValue={(s) => s.mesosGained}     format={formatExp} />
          </View>

          <Text style={styles.sectionTitle}>∑ Totales Históricos</Text>
          <View style={[styles.periodCard, { borderLeftColor: COLORS.primary }]}>
            <SumRow label="EXP total"    value={formatExp(totalExp)}         color={COLORS.exp} />
            <SumRow label="Fragmentos"   value={formatNumber(totalFrags)}    color={COLORS.frags} />
            <SumRow label="Nodos"        value={formatNumber(totalNodes)}    color={COLORS.nodes} />
            <SumRow label="Mesos"        value={formatExp(totalMesos)}       color={COLORS.mesos} />
            <SumRow label="Fam. Comunes" value={String(totalCommon)}         color={COLORS.common} />
            <SumRow label="Fam. Raros"   value={String(totalRare)}           color={COLORS.rare} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── Desktop styles ───────────────────────────────────────────────────────
const dStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WC.bg },
  content: { padding: 24, paddingBottom: 60, maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  pageHeader: { marginBottom: 24 },
  pageTitle: { color: WC.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: WC.textMuted, fontSize: 13, marginTop: 4 },

  sectionTitle: {
    color: WC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Period panels
  periodRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  periodPanel: {
    flex: 1,
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderTopWidth: 2,
    borderRadius: 14,
    padding: 16,
  },
  periodPanelHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  periodPanelTitle: { color: WC.text, fontSize: 14, fontWeight: '700' },
  periodPanelCount: { fontSize: 11, fontWeight: '600' },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5,
    marginBottom: 10, borderWidth: 1, borderColor: WC.sep,
  },
  levelBadgeText: { fontSize: 10, color: WC.textDim, flex: 1 },

  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: WC.sep,
  },
  statRowLabel: { color: WC.textMuted, fontSize: 12 },
  statRowValue: { fontSize: 12, fontWeight: '700' },

  // Bar chart
  chartCard: {
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 14, padding: 20, marginBottom: 20,
  },
  chartTitle: {
    color: WC.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 8 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartValLabel: { color: WC.exp, fontSize: 9, fontWeight: '700', marginBottom: 3, textAlign: 'center' },
  chartBarTrack: {
    width: '70%', height: '80%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden',
    borderWidth: 1, borderColor: WC.panelBorder,
  },
  chartBarFill: { width: '100%', backgroundColor: WC.exp, borderRadius: 3, opacity: 0.85 },
  chartDateLabel: { color: WC.textMuted, fontSize: 9, marginTop: 4, textAlign: 'center' },

  // Bottom row
  bottomRow: { flexDirection: 'row', gap: 16 },
  bestSection: { flex: 1 },
  totalsSection: { width: 280 },

  // Best days grid
  bestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bestCell: {
    width: '47%',
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderTopWidth: 2,
    borderRadius: 10, padding: 14,
  },
  bestVal: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  bestLabel: { color: WC.textMuted, fontSize: 11, marginTop: 3 },
  bestDate: { color: WC.textMuted, fontSize: 10, marginTop: 2 },

  // Totals panel
  totalsPanel: {
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 14, padding: 16,
  },

  // Open session badge (shown in empty "Hoy" panel when session is in progress)
  openSessionBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: WC.primaryDim,
    borderWidth: 1,
    borderColor: WC.primaryBorder,
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  openSessionDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: WC.primary,
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  openSessionBadgeText: { color: WC.primary, fontSize: 12, fontWeight: '700' },

  // Nueva Sesión button (shown in empty "Hoy" panel)
  newSessionBtn: {
    marginTop: 12,
    backgroundColor: WC.btn,
    borderRadius: 50,
    paddingVertical: 9,
    alignItems: 'center',
    shadowColor: WC.btnGlow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  newSessionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
});

// ── Mobile styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  contentDesktop: { maxWidth: 1100, width: '100%', alignSelf: 'center' as const },
  periodGrid: {},

  pageHeader: { marginBottom: SPACING.xl },
  pageTitle: { color: COLORS.text, fontSize: FONTS.xxl, fontWeight: '800' },
  pageSubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 4 },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  periodCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  periodTitle: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700' },
  periodSessions: { color: COLORS.textSecondary, fontSize: FONTS.xs },

  levelTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelTrackText: { color: COLORS.textSecondary, fontSize: FONTS.sm },

  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sumLabel: { color: COLORS.textSecondary, fontSize: FONTS.md },
  sumValue: { fontSize: FONTS.md, fontWeight: '700' },

  bestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  bestDay: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bestDayValue: { fontSize: FONTS.xl, fontWeight: '800' },
  bestDayLabel: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 2 },
  bestDayDate: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 2 },

  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.lg,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    gap: SPACING.sm,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarLabel: {
    color: COLORS.exp,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  chartBarTrack: {
    width: '70%',
    height: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: COLORS.exp,
    borderRadius: 3,
    opacity: 0.85,
  },
  chartDateLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
});
