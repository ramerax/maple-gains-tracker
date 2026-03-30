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
    <View style={[styles.chip, { borderColor: color + '30' }]}>
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

      {/* Period navigation */}
      <View style={styles.periodNav}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.navArrow}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.periodLabel} numberOfLines={1}>{getPeriodLabel()}</Text>
        <TouchableOpacity onPress={() => navigate(1)} style={styles.navArrow} disabled={isFuture()}>
          <Ionicons name="chevron-forward" size={20} color={isFuture() ? COLORS.textMuted : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats or empty */}
      {stats ? (
        <StatsBar stats={stats} />
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataEmoji}>📭</Text>
          <Text style={styles.noDataText}>Sin sesiones en este período</Text>
        </View>
      )}

      {/* List */}
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
