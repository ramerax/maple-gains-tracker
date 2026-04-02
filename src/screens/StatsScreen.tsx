import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session, OpenSession } from '../types';
// Note: Ionicons, NativeStackNavigationProp, RootStackParamList used below in mobile layout + Nav type
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { WC } from '../constants/themeWeb';
import { getAllSessions, getOpenSession } from '../utils/storage';
import {
  getTodayString, getWeekRange, getMonthRange,
  formatExp, formatNumber, formatPercent, formatDateMedium, formatDateShortEs,
} from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';
import { useIsDesktopWeb } from '../hooks/useIsDesktopWeb';
import StatsScreenDesktop from './StatsScreenDesktop';

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
      <StatsScreenDesktop
        allSessions={allSessions}
        todaySessions={todaySessions}
        weekSessions={weekSessions}
        monthSessions={monthSessions}
        totalExp={totalExp}
        totalFrags={totalFrags}
        totalNodes={totalNodes}
        totalMesos={totalMesos}
        totalCommon={totalCommon}
        totalRare={totalRare}
        openSession={openSession}
        onNewSession={() => navigation.navigate('StartSession')}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
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
