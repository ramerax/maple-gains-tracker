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
import { getSessionsByDate, aggregateStats, getOpenSession, deleteOpenSession } from '../utils/storage';
import { getTodayString, formatDateLong, formatExp, formatNumber, formatPercent } from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function StatPill({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string;
}) {
  return (
    <View style={[styles.pill, { borderColor: color + '30' }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
      {sub ? <Text style={styles.pillSub}>{sub}</Text> : null}
    </View>
  );
}

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sessionCardLeft}>
        <Text style={styles.sessionCardLevel}>
          Lv {session.lvStart} → {session.lvEnd}
        </Text>
        <Text style={styles.sessionCardExp}>
          {formatPercent(session.expStart)}% → {formatPercent(session.expEnd)}%
        </Text>
        <Text style={[styles.sessionCardEXP, { color: COLORS.exp }]}>
          +{formatExp(session.expGainedActual)} EXP
        </Text>
      </View>
      <View style={styles.sessionCardRight}>
        <Text style={styles.sessionCardMini}>
          Frags <Text style={{ color: COLORS.frags }}>+{session.fragsGained}</Text>
        </Text>
        <Text style={styles.sessionCardMini}>
          Nodos <Text style={{ color: COLORS.nodes }}>+{session.nodesGained}</Text>
        </Text>
        <Text style={styles.sessionCardMini}>
          Mesos <Text style={{ color: COLORS.mesos }}>+{formatExp(session.mesosGained)}</Text>
        </Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} style={{ marginTop: 6 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { activeProfile, activeProfileId } = useProfile();
  const today = getTodayString();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, open] = await Promise.all([
      getSessionsByDate(today, activeProfileId ?? undefined),
      getOpenSession(),
    ]);
    // Only show open session if it belongs to the active profile
    setOpenSession(
      open && (activeProfileId == null || open.profileId === activeProfileId)
        ? open
        : null
    );
    setSessions(s);
    setStats(aggregateStats(s));
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
            await deleteOpenSession();
            setOpenSession(null);
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
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
              {/* Level track */}
              <View style={styles.levelTrack}>
                <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                <Text style={styles.levelTrackText}>
                  {'  '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%){'  →  '}
                  Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
                </Text>
              </View>

              {/* Stat pills row 1 */}
              <View style={styles.pillRow}>
                <StatPill label="EXP" value={formatExp(stats.totalExpGained)} color={COLORS.exp} />
                <StatPill label="Fragmentos" value={`+${formatNumber(stats.totalFragsGained)}`} color={COLORS.frags} />
                <StatPill label="Nodos" value={`+${formatNumber(stats.totalNodesGained)}`} color={COLORS.nodes} />
              </View>

              {/* Stat pills row 2 */}
              <View style={styles.pillRow}>
                <StatPill label="Mesos" value={`+${formatExp(stats.totalMesosGained)}`} color={COLORS.mesos} />
                <StatPill label="Fam. Comunes" value={`+${stats.totalCommonFamiliarsGained}`} color={COLORS.common} />
                <StatPill label="Fam. Raros" value={`+${stats.totalRareFamiliarsGained}`} color={COLORS.rare} />
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
            <View style={styles.openSessionInfo}>
              <Text style={styles.openSessionTitle}>⚡ Sesión en Progreso</Text>
              <Text style={styles.openSessionSub}>
                Lv {openSession.lvStart}  ({formatPercent(openSession.expStart)}%)  ·  {formatNumber(openSession.fragsStart)} frags  ·  {formatExp(openSession.mesosStart)} mesos
              </Text>
            </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
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
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  pillValue: { fontSize: FONTS.md, fontWeight: '700' },
  pillLabel: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 2, textAlign: 'center' },
  pillSub: { color: COLORS.textMuted, fontSize: FONTS.xs },

  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 44, marginBottom: SPACING.md },
  emptyText: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '600' },
  emptySubText: { color: COLORS.textMuted, fontSize: FONTS.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  sessionCard: { paddingVertical: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionCardLeft: { flex: 1 },
  sessionCardLevel: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700' },
  sessionCardExp: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 1 },
  sessionCardEXP: { fontSize: FONTS.sm, fontWeight: '600', marginTop: 2 },
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
    borderColor: COLORS.primary + '40',
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
  cancelBtn: { padding: SPACING.xs },

  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginTop: SPACING.xs,
  },
  addSessionBtnText: { color: COLORS.primary, fontSize: FONTS.md, fontWeight: '600' },
  finishBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  finishBtnText: { color: '#000', fontSize: FONTS.md, fontWeight: '700' },
});
