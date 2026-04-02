import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session, PeriodStats } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { WC } from '../constants/themeWeb';
import { getSessionsByDateRange, aggregateStats } from '../utils/storage';
import {
  getTodayString, formatDateLong, formatDateMedium, formatWeekRange,
  formatMonthDisplay, formatExp, formatNumber, formatPercent, formatDateShortEs,
  getWeekRange, getMonthRange, addDays,
} from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';
import { useIsDesktopWeb } from '../hooks/useIsDesktopWeb';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'day' | 'week' | 'month';

function StatsBar({ stats }: { stats: PeriodStats }) {
  return (
    <View style={styles.statsBar}>
      <View style={styles.levelTrack}>
        <Ionicons name="trending-up" size={13} color={COLORS.primary} />
        <Text style={styles.levelTrackText}>
          {'  '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%){'  →  '}
          Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
        </Text>
      </View>
      <View style={styles.chipRow}>
        <Chip label="EXP"    value={formatExp(stats.totalExpGained)}           color={COLORS.exp} />
        <Chip label="Frags"  value={formatNumber(stats.totalFragsGained)}      color={COLORS.frags} />
        <Chip label="Nodos"  value={formatNumber(stats.totalNodesGained)}      color={COLORS.nodes} />
      </View>
      <View style={styles.chipRow}>
        <Chip label="Mesos"  value={formatExp(stats.totalMesosGained)}         color={COLORS.mesos} />
        <Chip label="Fam. C" value={String(stats.totalCommonFamiliarsGained)}  color={COLORS.common} />
        <Chip label="Fam. R" value={String(stats.totalRareFamiliarsGained)}    color={COLORS.rare} />
      </View>
    </View>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: color + '50' }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function SessionItem({ session, onPress, desktop }: { session: Session; onPress: () => void; desktop?: boolean }) {
  const dateStr = desktop ? formatDateShortEs(session.date) : formatDateMedium(session.date);
  return (
    <TouchableOpacity
      style={desktop ? dStyles.sessItem : styles.sessionItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sessionLeft}>
        <Text style={desktop ? dStyles.sessDate : styles.sessionDate}>{dateStr}</Text>
        <Text style={desktop ? dStyles.sessLevel : styles.sessionLevel}>
          Lv {session.lvStart} ({formatPercent(session.expStart)}%) → Lv {session.lvEnd} ({formatPercent(session.expEnd)}%)
        </Text>
      </View>
      <View style={desktop ? dStyles.sessRight : styles.sessionRight}>
        {desktop ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[dStyles.sessExp, { color: WC.exp }]}>
              {formatExp(session.expGainedActual)}
            </Text>
            <Text style={dStyles.sessMesos}>+{formatExp(session.mesosGained)}</Text>
          </View>
        ) : (
          <Text style={[styles.sessionExp, { color: COLORS.exp }]}>
            {formatExp(session.expGainedActual)}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={desktop ? WC.textMuted : COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { activeProfileId } = useProfile();
  const isDesktop = useIsDesktopWeb();
  const [mode, setMode] = useState<Mode>('day');
  const [cursor, setCursor] = useState(getTodayString());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<PeriodStats | null>(null);

  const getRange = useCallback((date: string) => {
    if (mode === 'day')   return { start: date, end: date };
    if (mode === 'week')  return getWeekRange(date);
    return getMonthRange(date);
  }, [mode]);

  const load = useCallback(async () => {
    const { start, end } = getRange(cursor);
    const s = await getSessionsByDateRange(start, end, activeProfileId ?? undefined);
    setSessions(s);
    setStats(aggregateStats(s));
  }, [cursor, getRange, activeProfileId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const navigate = (dir: -1 | 1) => {
    if (mode === 'day') {
      setCursor((c) => addDays(c, dir));
    } else if (mode === 'week') {
      setCursor((c) => addDays(c, dir * 7));
    } else {
      setCursor((c) => {
        const [y, m] = c.split('-').map(Number);
        const d = new Date(y, m - 1 + dir, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      });
    }
  };

  const getPeriodLabel = () => {
    const { start, end } = getRange(cursor);
    if (mode === 'day')  return formatDateLong(cursor);
    if (mode === 'week') return formatWeekRange(start, end);
    return formatMonthDisplay(cursor);
  };

  const isFuture = () => {
    if (mode === 'day') return cursor >= getTodayString();
    const next = mode === 'week' ? addDays(cursor, 7) : addDays(cursor, 32);
    return getRange(next).start > getTodayString();
  };

  if (isDesktop) {
    return (
      <View style={dStyles.root}>
        {/* Mode selector */}
        <View style={dStyles.modeBar}>
          {(['day', 'week', 'month'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[dStyles.modeBtn, mode === m && dStyles.modeBtnActive]}
              onPress={() => { setMode(m); setCursor(getTodayString()); }}
            >
              <Text style={[dStyles.modeBtnText, mode === m && dStyles.modeBtnTextActive]}>
                {m === 'day' ? 'Día' : m === 'week' ? 'Semana' : 'Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period nav */}
        <View style={dStyles.periodNav}>
          <TouchableOpacity onPress={() => navigate(-1)} style={dStyles.navArrow}>
            <Ionicons name="chevron-back" size={18} color={WC.primary} />
          </TouchableOpacity>
          <Text style={dStyles.periodLabel} numberOfLines={1}>{getPeriodLabel()}</Text>
          <TouchableOpacity onPress={() => navigate(1)} style={dStyles.navArrow} disabled={isFuture()}>
            <Ionicons name="chevron-forward" size={18} color={isFuture() ? WC.textMuted : WC.primary} />
          </TouchableOpacity>
        </View>

        {/* Body: list left + stats right */}
        <View style={dStyles.body}>
          <View style={dStyles.listCol}>
            {sessions.length === 0 ? (
              <View style={dStyles.empty}>
                <Text style={dStyles.emptyEmoji}>📭</Text>
                <Text style={dStyles.emptyText}>Sin sesiones en este período</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(s) => s.id}
                renderItem={({ item }) => (
                  <SessionItem
                    session={item}
                    desktop
                    onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
                  />
                )}
                contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                ItemSeparatorComponent={() => <View style={dStyles.sep} />}
              />
            )}
          </View>

          {/* Stats panel */}
          <View style={dStyles.statsCol}>
            <View style={dStyles.panel}>
              <Text style={dStyles.panelHdr}>RESUMEN DEL PERÍODO</Text>
              {stats ? (
                <>
                  <View style={dStyles.levelRow}>
                    <Ionicons name="trending-up" size={12} color={WC.primary} />
                    <Text style={dStyles.levelText}>
                      {' '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%) → Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
                    </Text>
                  </View>
                  <View style={dStyles.statGrid}>
                    {[
                      { label: 'EXP',    value: formatExp(stats.totalExpGained),           color: WC.exp },
                      { label: 'Frags',  value: formatNumber(stats.totalFragsGained),       color: WC.frags },
                      { label: 'Nodos',  value: formatNumber(stats.totalNodesGained),       color: WC.nodes },
                      { label: 'Mesos',  value: formatExp(stats.totalMesosGained),          color: WC.mesos },
                      { label: 'Fam.C',  value: String(stats.totalCommonFamiliarsGained),   color: WC.common },
                      { label: 'Fam.R',  value: String(stats.totalRareFamiliarsGained),     color: WC.rare },
                    ].map(({ label, value, color }) => (
                      <View key={label} style={dStyles.statCell}>
                        <Text style={[dStyles.statVal, { color }]}>{value}</Text>
                        <Text style={dStyles.statLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={dStyles.sessionCount}>
                    {stats.sessionCount} {stats.sessionCount === 1 ? 'sesión' : 'sesiones'} en este período
                  </Text>
                </>
              ) : (
                <Text style={dStyles.emptyText}>Sin datos para mostrar</Text>
              )}
            </View>
          </View>
        </View>

        {/* FAB */}
        <TouchableOpacity
          style={dStyles.fab}
          onPress={() => navigation.navigate('StartSession')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Mobile layout ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.modeBar}>
        {(['day', 'week', 'month'] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => { setMode(m); setCursor(getTodayString()); }}
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'day' ? 'Día' : m === 'week' ? 'Semana' : 'Mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.periodNav}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.periodLabel} numberOfLines={1}>{getPeriodLabel()}</Text>
        <TouchableOpacity onPress={() => navigate(1)} style={styles.navArrow} disabled={isFuture()}>
          <Ionicons name="chevron-forward" size={20} color={isFuture() ? COLORS.textMuted : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {stats ? (
        <StatsBar stats={stats} />
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataEmoji}>📭</Text>
          <Text style={styles.noDataText}>Sin sesiones en este período</Text>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SessionItem
            session={item}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('StartSession')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

// ── Desktop styles ──────────────────────────────────────────────────────
const dStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WC.bg, flexDirection: 'column' },

  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
  },
  modeBtn: {
    paddingHorizontal: 20, paddingVertical: 7,
    borderRadius: 50, borderWidth: 1, borderColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: WC.primaryDim, borderColor: WC.primaryBorder,
  },
  modeBtnText: { color: WC.textMuted, fontSize: 13, fontWeight: '600' },
  modeBtnTextActive: { color: WC.primary },

  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
  },
  navArrow: { padding: 8 },
  periodLabel: {
    flex: 1, color: WC.text, fontSize: 15, fontWeight: '700',
    textAlign: 'center', textTransform: 'capitalize',
  },

  body: { flex: 1, flexDirection: 'row' },
  listCol: { flex: 1, maxWidth: 760, borderRightWidth: 1, borderRightColor: WC.panelBorder },
  statsCol: { minWidth: 260, maxWidth: 300, width: 280, padding: 14 },

  panel: {
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 14, padding: 16,
  },
  panelHdr: {
    fontSize: 9, color: WC.textMuted, letterSpacing: 2, textTransform: 'uppercase',
    fontWeight: '700', marginBottom: 12, borderBottomWidth: 1,
    borderBottomColor: WC.sep, paddingBottom: 8,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  levelText: { fontSize: 11, color: WC.textDim, flex: 1 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statCell: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: WC.sep, borderRadius: 8, padding: 8,
  },
  statVal: { fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, color: WC.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  sessionCount: {
    marginTop: 12, fontSize: 10, color: WC.textMuted, textAlign: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: WC.sep,
  },

  sep: { height: 1, backgroundColor: WC.sep },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: WC.textMuted, fontSize: 13 },

  sessItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  sessDate: { fontSize: 13, color: WC.text, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sessLevel: { fontSize: 10, color: WC.textMuted, marginTop: 3 },
  sessExp: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  sessMesos: { fontSize: 11, color: WC.mesos, fontWeight: '600', marginTop: 1, textAlign: 'right' },
  sessRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: WC.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
});

// ── Mobile styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  modeBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modeBtn: {
    flex: 1, padding: SPACING.sm, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent', minHeight: 40,
  },
  modeBtnActive: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryBorder },
  modeBtnText: { color: COLORS.textSecondary, fontSize: FONTS.md, fontWeight: '600' },
  modeBtnTextActive: { color: COLORS.primary },

  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navArrow: { padding: SPACING.sm },
  periodLabel: {
    flex: 1, color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700',
    textAlign: 'center', textTransform: 'capitalize', paddingHorizontal: SPACING.sm,
  },

  statsBar: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  levelTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelTrackText: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  chipRow: { flexDirection: 'row', gap: SPACING.sm },
  chip: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    padding: SPACING.sm, alignItems: 'center', borderWidth: 1,
  },
  chipValue: { fontSize: FONTS.md, fontWeight: '700' },
  chipLabel: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 2 },

  noData: {
    alignItems: 'center', padding: SPACING.xxl,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  noDataEmoji: { fontSize: 36, marginBottom: SPACING.sm },
  noDataText: { color: COLORS.textSecondary, fontSize: FONTS.md },

  list: { padding: SPACING.md, paddingBottom: 100 },
  separator: { height: 1, backgroundColor: COLORS.border },

  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
  },
  sessionLeft: { flex: 1 },
  sessionDate: { color: COLORS.textSecondary, fontSize: FONTS.xs },
  sessionLevel: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '600', marginTop: 2 },
  sessionRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sessionExp: { fontSize: FONTS.md, fontWeight: '700' },

  fab: {
    position: 'absolute', right: SPACING.xl, bottom: SPACING.xl,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
});
