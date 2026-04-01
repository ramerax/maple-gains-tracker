import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session, PeriodStats, OpenSession } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { getSessionsByDate, getAllSessions, getSessionsByDateRange, aggregateStats, getOpenSession, deleteOpenSession } from '../utils/storage';
import { getTodayString, formatDateLong, formatExp, formatNumber, formatPercent, getWeekRange, getMonthRange } from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';
import { useIsDesktopWeb } from '../hooks/useIsDesktopWeb';
import HomeScreenDesktop from './HomeScreenDesktop';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatPill({ label, value, color, sub, total }: {
  label: string; value: string; color: string; sub?: string; total?: string;
}) {
  return (
    <View style={styles.pill}>
      {/* Header */}
      <Text style={styles.pillHeader}>{label}</Text>

      {/* Main content */}
      <View style={styles.pillMiddle}>
        <View style={styles.pillBody}>
          <Text style={[styles.pillValue, { color }]}>{value}</Text>
          {sub ? <Text style={[styles.pillSub, { color }]}>{sub}</Text> : null}
        </View>
      </View>

      {/* Total footer */}
      {total ? (
        <View style={styles.pillFooter}>
          <View style={styles.pillDivider} />
          <Text style={styles.pillTotal}>{total}</Text>
        </View>
      ) : (
        <View style={styles.pillFooterEmpty} />
      )}
    </View>
  );
}

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const levelsGained = session.lvEnd - session.lvStart;
  const pctGained = levelsGained * 100 + (session.expEnd - session.expStart);
  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sessionCardLeft}>
        <Text style={styles.sessionCardLevel}>
          Lv {session.lvStart}{levelsGained > 0 ? ` → ${session.lvEnd}` : ''}
        </Text>
        <Text style={styles.sessionCardExp}>
          {formatPercent(session.expStart)}% → {formatPercent(session.expEnd)}%
        </Text>
        <Text style={[styles.sessionCardEXP, { color: COLORS.exp }]}>
          +{formatExp(session.expGainedActual)} EXP
          <Text style={styles.sessionCardPct}>  (+{formatPercent(pctGained)}%)</Text>
        </Text>
      </View>
      <View style={styles.sessionCardRight}>
        <Text style={styles.sessionCardMini}>Frags <Text style={{ color: COLORS.frags }}>+{formatNumber(session.fragsGained)}</Text></Text>
        <Text style={styles.sessionCardMini}>Nodos <Text style={{ color: COLORS.nodes }}>+{formatNumber(session.nodesGained)}</Text></Text>
        <Text style={styles.sessionCardMini}>Mesos <Text style={{ color: COLORS.mesos }}>+{formatExp(session.mesosGained)}</Text></Text>
        {session.commonFamiliarsGained > 0 && (
          <Text style={styles.sessionCardMini}>Fam.C <Text style={{ color: COLORS.common }}>+{session.commonFamiliarsGained}</Text></Text>
        )}
        {session.rareFamiliarsGained > 0 && (
          <Text style={styles.sessionCardMini}>Fam.R <Text style={{ color: COLORS.rare }}>+{session.rareFamiliarsGained}</Text></Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { activeProfile, activeProfileId } = useProfile();
  const isDesktop = useIsDesktopWeb();
  const today = getTodayString();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<PeriodStats | null>(null);
  const [weekStats, setWeekStats] = useState<PeriodStats | null>(null);
  const [monthStats, setMonthStats] = useState<PeriodStats | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { start: wS, end: wE } = getWeekRange(today);
    const { start: mS, end: mE } = getMonthRange(today);
    const [s, all, open, weekSessions, monthSessions] = await Promise.all([
      getSessionsByDate(today, activeProfileId ?? undefined),
      getAllSessions(),
      getOpenSession(activeProfileId ?? undefined),
      getSessionsByDateRange(wS, wE, activeProfileId ?? undefined),
      getSessionsByDateRange(mS, mE, activeProfileId ?? undefined),
    ]);
    const profileSessions = activeProfileId
      ? all.filter((r) => r.profileId === activeProfileId)
      : all;
    setOpenSession(open ?? null);
    setSessions(s);
    setStats(aggregateStats(s));
    setAllTimeStats(aggregateStats(profileSessions));
    setWeekStats(aggregateStats(weekSessions));
    setMonthStats(aggregateStats(monthSessions));
    setAllSessions(profileSessions);
  }, [today, activeProfileId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleCancelOpenSession = useCallback(() => {
    Alert.alert(
      'Cancelar sesión',
      '¿Cancelar la sesión en progreso? Se perderán los datos de inicio.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await deleteOpenSession(activeProfileId ?? undefined);
            setOpenSession(null);
          },
        },
      ]
    );
  }, [activeProfileId]);

  // Derive current level/xp from the most recent session
  const latestSession = allSessions.length > 0
    ? allSessions.reduce((a, b) => (b.createdAt > a.createdAt ? b : a))
    : null;
  const profileLevel = latestSession?.lvEnd ?? (activeProfile ? 1 : 1);
  const profileXpPct = latestSession?.expEnd ?? 0;

  // Recent 10 sessions sorted descending
  const recentSessions = [...allSessions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);

  if (isDesktop) {
    return (
      <HomeScreenDesktop
        profileName={activeProfile?.name ?? 'Personaje'}
        profileClass={activeProfile?.gameClass ?? ''}
        profileLevel={profileLevel}
        profileXpPct={profileXpPct}
        weekStats={weekStats}
        monthStats={monthStats}
        allSessions={allSessions}
        recentSessions={recentSessions}
        openSession={openSession}
        onFinishSession={() => navigation.navigate('FinishSession')}
        onCancelSession={handleCancelOpenSession}
        onNewSession={() => navigation.navigate('StartSession')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header — hidden on desktop (sidebar handles logo/profile) */}
        {!isDesktop && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>🍁 MapleGains</Text>
              <Text style={styles.headerDate}>{formatDateLong(today)}</Text>
              {activeProfile && (
                <Text style={styles.headerProfile} numberOfLines={1}>
                  {activeProfile.name}
                  {activeProfile.gameClass ? ` · ${activeProfile.gameClass}` : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profiles')}
              activeOpacity={0.85}
            >
              {activeProfile ? (
                <View
                  style={[
                    styles.profileAvatar,
                    { backgroundColor: activeProfile.color + '30', borderColor: activeProfile.color },
                  ]}
                >
                  <Text style={[styles.profileAvatarLetter, { color: activeProfile.color }]}>
                    {activeProfile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Desktop date header */}
        {isDesktop && (
          <View style={styles.desktopDateHeader}>
            <Text style={styles.desktopDateText}>{formatDateLong(today)}</Text>
            <View style={styles.desktopDateAccent} />
          </View>
        )}

        {/* Today summary card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Resumen de Hoy</Text>
            {stats && (
              <View style={styles.sessionsBadge}>
                <Text style={styles.sessionsBadgeText}>{stats.sessionCount} sesión{stats.sessionCount !== 1 ? 'es' : ''}</Text>
              </View>
            )}
          </View>

          {stats ? (
            <>
              {/* Stat pills row 1 */}
              {(() => {
                const levelsUp = stats.lvEnd - stats.lvStart;
                const pctGained = levelsUp * 100 + (stats.expEnd - stats.expStart);
                const expSub = levelsUp > 0
                  ? `+${levelsUp} lv · +${formatPercent(stats.expEnd)}%`
                  : `+${formatPercent(pctGained)}%`;
                return (
                  <View style={styles.pillRow}>
                    <StatPill
                      label="EXP" value={expSub} color={COLORS.exp}
                      total={allTimeStats ? `Tot: ${formatExp(allTimeStats.totalExpGained)}` : undefined}
                    />
                    <StatPill
                      label="Fragmentos" value={`+${formatNumber(stats.totalFragsGained)}`} color={COLORS.frags}
                      total={allTimeStats ? `Tot: ${formatNumber(allTimeStats.totalFragsGained)}` : undefined}
                    />
                    <StatPill
                      label="Nodos" value={`+${formatNumber(stats.totalNodesGained)}`} color={COLORS.nodes}
                      total={allTimeStats ? `Tot: ${formatNumber(allTimeStats.totalNodesGained)}` : undefined}
                    />
                  </View>
                );
              })()}

              {/* Stat pills row 2 */}
              <View style={styles.pillRow}>
                <StatPill
                  label="Mesos" value={`+${formatExp(stats.totalMesosGained)}`} color={COLORS.mesos}
                  total={allTimeStats ? `Tot: ${formatExp(allTimeStats.totalMesosGained)}` : undefined}
                />
                <StatPill
                  label="Fam. Comunes" value={`+${stats.totalCommonFamiliarsGained}`} color={COLORS.common}
                  total={allTimeStats ? `Tot: ${allTimeStats.totalCommonFamiliarsGained}` : undefined}
                />
                <StatPill
                  label="Fam. Raros" value={`+${stats.totalRareFamiliarsGained}`} color={COLORS.rare}
                  total={allTimeStats ? `Tot: ${allTimeStats.totalRareFamiliarsGained}` : undefined}
                />
              </View>
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text style={styles.emptyText}>Sin sesiones hoy</Text>
              <Text style={styles.emptySubText}>Toca el botón + para registrar tu primera sesión</Text>
            </View>
          )}
        </View>

        {/* Sessions list */}
        {sessions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sesiones de Hoy</Text>
            {sessions.map((s, i) => (
              <View key={s.id}>
                {i > 0 && <View style={styles.divider} />}
                <SessionCard
                  session={s}
                  onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}
                />
              </View>
            ))}
          </View>
        )}

        {/* Open session banner */}
        {openSession && (
          <View style={styles.openSessionCard}>
            <View style={styles.openSessionPulse} />
            <TouchableOpacity
              style={styles.openSessionInfo}
              onPress={() => navigation.navigate('StartSession', { editing: true })}
              activeOpacity={0.7}
            >
              <Text style={styles.openSessionTitle}>⚡ Sesión en Progreso</Text>
              <Text style={styles.openSessionSub}>
                Lv {openSession.lvStart}  ({formatPercent(openSession.expStart)}%)  ·  {formatNumber(openSession.fragsStart)} frags  ·  {formatExp(openSession.mesosStart)} mesos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('StartSession', { editing: true })}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelOpenSession}
            >
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Main action button */}
        {openSession ? (
          <TouchableOpacity
            style={[styles.addSessionBtn, styles.finishBtn]}
            onPress={() => navigation.navigate('FinishSession')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
            <Text style={styles.finishBtnText}>Finalizar Sesión</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addSessionBtn}
            onPress={() => navigation.navigate('StartSession')}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addSessionBtnText}>Nueva Sesión</Text>
          </TouchableOpacity>
        )}

        {/* Weekly summary — desktop only, always shown */}
        {weekStats ? (
          <View style={styles.weekCard}>
            <View style={styles.weekCardHeader}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.weekCardTitle}>Esta Semana</Text>
              <Text style={styles.weekCardBadge}>{weekStats.sessionCount} sesión{weekStats.sessionCount !== 1 ? 'es' : ''}</Text>
            </View>
            <View style={styles.weekChipRow}>
              <View style={styles.weekChip}>
                <Text style={[styles.weekChipValue, { color: COLORS.exp }]}>{formatExp(weekStats.totalExpGained)}</Text>
                <Text style={styles.weekChipLabel}>EXP</Text>
              </View>
              <View style={styles.weekChip}>
                <Text style={[styles.weekChipValue, { color: COLORS.frags }]}>+{formatNumber(weekStats.totalFragsGained)}</Text>
                <Text style={styles.weekChipLabel}>Frags</Text>
              </View>
              <View style={styles.weekChip}>
                <Text style={[styles.weekChipValue, { color: COLORS.nodes }]}>+{formatNumber(weekStats.totalNodesGained)}</Text>
                <Text style={styles.weekChipLabel}>Nodos</Text>
              </View>
              <View style={styles.weekChip}>
                <Text style={[styles.weekChipValue, { color: COLORS.mesos }]}>{formatExp(weekStats.totalMesosGained)}</Text>
                <Text style={styles.weekChipLabel}>Mesos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.weekCard}>
            <View style={styles.weekCardHeader}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.weekCardTitle}>Esta Semana</Text>
              <Text style={styles.weekCardBadge}>0 sesiones</Text>
            </View>
            <View style={styles.weekChipRow}>
              {[
                { label: 'EXP', color: COLORS.exp },
                { label: 'Frags', color: COLORS.frags },
                { label: 'Nodos', color: COLORS.nodes },
                { label: 'Mesos', color: COLORS.mesos },
              ].map(({ label, color }) => (
                <View key={label} style={styles.weekChip}>
                  <Text style={[styles.weekChipValue, { color, opacity: 0.4 }]}>—</Text>
                  <Text style={styles.weekChipLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 32 },
  contentDesktop: { maxWidth: 860, width: '100%', alignSelf: 'center' as const },
  desktopDateHeader: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  desktopDateText: {
    color: COLORS.text,
    fontSize: FONTS.xxl,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  desktopDateAccent: {
    width: 32,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: SPACING.sm,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    color: COLORS.primary,
    fontSize: FONTS.title,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerDate: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  headerProfile: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: '700',
    marginTop: 4,
  },
  profileBtn: {
    marginLeft: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLetter: {
    fontSize: FONTS.xl,
    fontWeight: '800',
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: FONTS.xl,
    fontWeight: '700',
  },
  sessionsBadge: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  sessionsBadgeText: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: '700',
  },

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
  levelTrackText: { color: COLORS.text, fontSize: FONTS.sm },

  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 96,
  },
  pillHeader: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  pillMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pillBody: {
    alignItems: 'center',
  },
  pillValue: { fontSize: FONTS.lg, fontWeight: '800', textAlign: 'center' },
  pillSub: { fontSize: FONTS.xs, fontWeight: '600', marginTop: 2, textAlign: 'center', opacity: 0.85 },
  pillFooter: { alignItems: 'center', width: '100%', paddingTop: SPACING.xs },
  pillFooterEmpty: { height: SPACING.sm },
  pillDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', width: '75%', marginBottom: SPACING.xs },
  pillTotal: { color: COLORS.textSecondary, fontSize: FONTS.xs, textAlign: 'center', fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 44, marginBottom: SPACING.md },
  emptyText: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '600' },
  emptySubText: { color: COLORS.textSecondary, fontSize: FONTS.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  sessionCard: { paddingVertical: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionCardLeft: { flex: 1 },
  sessionCardLevel: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700' },
  sessionCardExp: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 1 },
  sessionCardEXP: { fontSize: FONTS.md, fontWeight: '700', marginTop: 3 },
  sessionCardPct: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: '500' },
  sessionCardRight: { alignItems: 'flex-end', marginLeft: SPACING.md },
  sessionCardMini: { color: COLORS.textSecondary, fontSize: FONTS.sm },

  openSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: SPACING.sm,
  },
  openSessionPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  openSessionInfo: { flex: 1 },
  openSessionTitle: { color: COLORS.primary, fontSize: FONTS.md, fontWeight: '700' },
  openSessionSub: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 3 },
  editBtn: { padding: SPACING.sm },
  cancelBtn: { padding: SPACING.sm },

  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginTop: SPACING.xs,
    minHeight: 52,
  },
  addSessionBtnText: { color: COLORS.primary, fontSize: FONTS.md, fontWeight: '600' },
  finishBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  finishBtnText: { color: '#000', fontSize: FONTS.md, fontWeight: '700' },

  weekCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  weekCardTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  weekCardBadge: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: '600',
  },
  weekChipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  weekChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekChipValue: { fontSize: FONTS.md, fontWeight: '800' },
  weekChipLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 2 },
  weekEmpty: { color: COLORS.textMuted, fontSize: FONTS.sm },
});
