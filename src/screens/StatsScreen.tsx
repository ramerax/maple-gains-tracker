import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { getAllSessions } from '../utils/storage';
import {
  getTodayString, getWeekRange, getMonthRange,
  formatExp, formatNumber, formatPercent, formatDateMedium,
} from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';

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
        <Text style={styles.periodTitle}>{title}</Text>
        <Text style={styles.noData}>Sin sesiones</Text>
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
      <SumRow label="Fragmentos"    value={`+${formatNumber(totalFrags)}`}  color={COLORS.frags} />
      <SumRow label="Nodos"         value={`+${formatNumber(totalNodes)}`}  color={COLORS.nodes} />
      <SumRow label="Mesos"         value={`+${formatExp(totalMesos)}`}     color={COLORS.mesos} />
      <SumRow label="Fam. Comunes"  value={`+${totalCommon}`}               color={COLORS.common} />
      <SumRow label="Fam. Raros"    value={`+${totalRare}`}                 color={COLORS.rare} />
    </View>
  );
}

export default function StatsScreen() {
  const { activeProfileId } = useProfile();
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const all = await getAllSessions();
    setAllSessions(
      activeProfileId == null
        ? all
        : all.filter((s) => s.profileId === activeProfileId)
    );
  }, [activeProfileId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const today = getTodayString();
  const { start: wS, end: wE } = getWeekRange(today);
  const { start: mS, end: mE } = getMonthRange(today);

  const todaySessions = allSessions.filter((s) => s.date === today);
  const weekSessions  = allSessions.filter((s) => s.date >= wS && s.date <= wE);
  const monthSessions = allSessions.filter((s) => s.date >= mS && s.date <= mE);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={COLORS.primary} />}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>📊 Estadísticas</Text>
        <Text style={styles.pageSubtitle}>{allSessions.length} sesiones en total</Text>
      </View>

      <PeriodCard title="☀️  Hoy"         sessions={todaySessions} color={COLORS.primary} />
      <PeriodCard title="📅  Esta Semana" sessions={weekSessions}   color={COLORS.frags} />
      <PeriodCard title="🗓️  Este Mes"   sessions={monthSessions}  color={COLORS.exp} />

      {allSessions.length > 0 && (
        <>
          {/* Best days */}
          <Text style={styles.sectionTitle}>🏆 Mejores Días</Text>
          <View style={styles.bestGrid}>
            <BestDay sessions={allSessions} label="Más EXP"   color={COLORS.exp}   getValue={(s) => s.expGainedActual} format={formatExp} />
            <BestDay sessions={allSessions} label="Más Frags" color={COLORS.frags} getValue={(s) => s.fragsGained}     format={(n) => `+${formatNumber(n)}`} />
            <BestDay sessions={allSessions} label="Más Nodos" color={COLORS.nodes} getValue={(s) => s.nodesGained}     format={(n) => `+${formatNumber(n)}`} />
            <BestDay sessions={allSessions} label="Más Mesos" color={COLORS.mesos} getValue={(s) => s.mesosGained}     format={formatExp} />
          </View>

          {/* All time totals */}
          <Text style={styles.sectionTitle}>∑ Totales Históricos</Text>
          <View style={[styles.periodCard, { borderLeftColor: COLORS.primary }]}>
            <SumRow label="EXP total"    value={formatExp(allSessions.reduce((s, r) => s + r.expGainedActual, 0))}      color={COLORS.exp} />
            <SumRow label="Fragmentos"   value={`+${formatNumber(allSessions.reduce((s, r) => s + r.fragsGained, 0))}`} color={COLORS.frags} />
            <SumRow label="Nodos"        value={`+${formatNumber(allSessions.reduce((s, r) => s + r.nodesGained, 0))}`} color={COLORS.nodes} />
            <SumRow label="Mesos"        value={`+${formatExp(allSessions.reduce((s, r) => s + r.mesosGained, 0))}`}    color={COLORS.mesos} />
            <SumRow label="Fam. Comunes" value={`+${allSessions.reduce((s, r) => s + r.commonFamiliarsGained, 0)}`}     color={COLORS.common} />
            <SumRow label="Fam. Raros"   value={`+${allSessions.reduce((s, r) => s + r.rareFamiliarsGained, 0)}`}       color={COLORS.rare} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 40 },

  pageHeader: { marginBottom: SPACING.xl },
  pageTitle: { color: COLORS.text, fontSize: FONTS.xxl, fontWeight: '800' },
  pageSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 4 },

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
  periodSessions: { color: COLORS.textMuted, fontSize: FONTS.xs },
  noData: { color: COLORS.textMuted, fontSize: FONTS.md },

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
    paddingVertical: 6,
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
  bestDayDate: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 2 },
});
