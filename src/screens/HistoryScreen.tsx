import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session, PeriodStats } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { getSessionsByDateRange, aggregateStats } from '../utils/storage';
import {
  getTodayString, formatDateLong, formatDateMedium, formatWeekRange,
  formatMonthDisplay, formatExp, formatNumber, formatPercent, getWeekRange, getMonthRange, addDays,
} from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';
import { useIsDesktopWeb } from '../hooks/useIsDesktopWeb';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'day' | 'week' | 'month';

function StatsBar({ stats }: { stats: PeriodStats }) {
  return (
    <View style={styles.statsBar}>
      {/* Level track */}
      <View style={styles.levelTrack}>
        <Ionicons name="trending-up" size={13} color={COLORS.primary} />
        <Text style={styles.levelTrackText}>
          {'  '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%){'  →  '}
          Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
        </Text>
      </View>
      {/* Row 1 */}
      <View style={styles.chipRow}>
        <Chip label="EXP"    value={formatExp(stats.totalExpGained)}              color={COLORS.exp} />
        <Chip label="Frags"  value={`+${formatNumber(stats.totalFragsGained)}`}   color={COLORS.frags} />
        <Chip label="Nodos"  value={`+${formatNumber(stats.totalNodesGained)}`}   color={COLORS.nodes} />
      </View>
      {/* Row 2 */}
      <View style={styles.chipRow}>
        <Chip label="Mesos"    value={`+${formatExp(stats.totalMesosGained)}`}                    color={COLORS.mesos} />
        <Chip label="Fam. C"   value={`+${stats.totalCommonFamiliarsGained}`}  color={COLORS.common} />
        <Chip label="Fam. R"   value={`+${stats.totalRareFamiliarsGained}`}    color={COLORS.rare} />
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

function SessionItem({ session, onPress }: { session: Session; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sessionItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sessionLeft}>
        <Text style={styles.sessionDate}>{formatDateMedium(session.date)}</Text>
        <Text style={styles.sessionLevel}>
          Lv {session.lvStart} ({formatPercent(session.expStart)}%) → Lv {session.lvEnd} ({formatPercent(session.expEnd)}%)
        </Text>
      </View>
      <View style={styles.sessionRight}>
        <Text style={[styles.sessionExp, { color: COLORS.exp }]}>+{formatExp(session.expGainedActual)}</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
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

  return (
    <View style={styles.container}>
      {/* Mode selector */}
      <View style={[styles.modeBar, isDesktop && styles.modeBarDesktop]}>
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

      {/* Period navigation */}
      <View style={[styles.periodNav, isDesktop && styles.periodNavDesktop]}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.periodLabel} numberOfLines={1}>{getPeriodLabel()}</Text>
        <TouchableOpacity onPress={() => navigate(1)} style={styles.navArrow} disabled={isFuture()}>
          <Ionicons name="chevron-forward" size={20} color={isFuture() ? COLORS.textMuted : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Desktop: two-column layout (list left, stats panel right) */}
      {isDesktop ? (
        <View style={styles.desktopBody}>
          {/* Left: session list */}
          <View style={styles.desktopLeft}>
            {sessions.length === 0 ? (
              <View style={styles.noData}>
                <Text style={styles.noDataEmoji}>📭</Text>
                <Text style={styles.noDataText}>Sin sesiones en este período</Text>
              </View>
            ) : (
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
            )}
          </View>

          {/* Right: stats panel */}
          <View style={styles.desktopRight}>
            {stats ? (
              <View style={styles.sidePanel}>
                <Text style={styles.sidePanelTitle}>Resumen del período</Text>
                <View style={styles.levelTrack}>
                  <Ionicons name="trending-up" size={13} color={COLORS.primary} />
                  <Text style={styles.levelTrackText}>
                    {'  '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%){'  →  '}
                    Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
                  </Text>
                </View>
                <View style={styles.sidePanelGrid}>
                  <View style={[styles.sideStat, { borderColor: COLORS.exp + '40' }]}>
                    <Text style={[styles.sideStatValue, { color: COLORS.exp }]}>{formatExp(stats.totalExpGained)}</Text>
                    <Text style={styles.sideStatLabel}>EXP</Text>
                  </View>
                  <View style={[styles.sideStat, { borderColor: COLORS.frags + '40' }]}>
                    <Text style={[styles.sideStatValue, { color: COLORS.frags }]}>+{formatNumber(stats.totalFragsGained)}</Text>
                    <Text style={styles.sideStatLabel}>Frags</Text>
                  </View>
                  <View style={[styles.sideStat, { borderColor: COLORS.nodes + '40' }]}>
                    <Text style={[styles.sideStatValue, { color: COLORS.nodes }]}>+{formatNumber(stats.totalNodesGained)}</Text>
                    <Text style={styles.sideStatLabel}>Nodos</Text>
                  </View>
                  <View style={[styles.sideStat, { borderColor: COLORS.mesos + '40' }]}>
                    <Text style={[styles.sideStatValue, { color: COLORS.mesos }]}>{formatExp(stats.totalMesosGained)}</Text>
                    <Text style={styles.sideStatLabel}>Mesos</Text>
                  </View>
                  <View style={[styles.sideStat, { borderColor: COLORS.common + '40' }]}>
                    <Text style={[styles.sideStatValue, { color: COLORS.common }]}>+{stats.totalCommonFamiliarsGained}</Text>
                    <Text style={styles.sideStatLabel}>Fam. C</Text>
                  </View>
                  <View style={[styles.sideStat, { borderColor: COLORS.rare + '40' }]}>
                    <Text style={[styles.sideStatValue, { color: COLORS.rare }]}>+{stats.totalRareFamiliarsGained}</Text>
                    <Text style={styles.sideStatLabel}>Fam. R</Text>
                  </View>
                </View>
                <View style={styles.sidePanelFooter}>
                  <Text style={styles.sidePanelSessions}>{stats.sessionCount} sesión{stats.sessionCount !== 1 ? 'es' : ''} en este período</Text>
                </View>
              </View>
            ) : (
              <View style={styles.sidePanel}>
                <Text style={styles.sidePanelTitle}>Resumen del período</Text>
                <Text style={styles.sidePanelEmpty}>Sin datos para mostrar</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Mobile: original layout */
        <>
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
        </>
      )}

      {/* FAB */}
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
  modeBarDesktop: { paddingHorizontal: SPACING.xl },
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
  periodNavDesktop: { paddingHorizontal: SPACING.xl },
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

  // Desktop two-column layout
  desktopBody: { flex: 1, flexDirection: 'row' },
  desktopLeft: { flex: 1, borderRightWidth: 1, borderRightColor: COLORS.border },
  desktopRight: { width: 280, padding: SPACING.lg },

  sidePanel: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sidePanelTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  sidePanelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  sideStat: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  sideStatValue: { fontSize: FONTS.lg, fontWeight: '800' },
  sideStatLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 2 },
  sidePanelFooter: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  sidePanelSessions: { color: COLORS.textSecondary, fontSize: FONTS.xs, textAlign: 'center' },
  sidePanelEmpty: { color: COLORS.textMuted, fontSize: FONTS.sm },
});
