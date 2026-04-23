/**
 * HomeScreenDesktop — Glass Cosmos dashboard
 * Layout: left character panel | right sessions feed
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session, PeriodStats, OpenSession } from '../types';
import { formatExp, formatNumber, formatPercent, formatDateShortEs } from '../utils/formatters';
import { WC } from '../constants/themeWeb';
import XPRing from '../components/XPRing';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── StatRow — left panel weekly stat ──────────────────────────────────────────
function StatRow({ label, value, color, bg, icon }: {
  label: string; value: string; color: string; bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={13} color={color} />
      </View>
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={[styles.statRowValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── SessionRow — recent sessions table ────────────────────────────────────────
function SessionRow({ session, index }: { session: Session; index: number }) {
  const navigation = useNavigation<Nav>();
  const levelsGained = session.lvEnd - session.lvStart;
  const isEven = index % 2 === 0;
  return (
    <TouchableOpacity
      style={[styles.sessRow, isEven && styles.sessRowEven]}
      onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
      activeOpacity={0.65}
    >
      <View style={styles.sessDateWrap}>
        <Text style={styles.sessRowDate}>{formatDateShortEs(session.date)}</Text>
      </View>
      <Text style={styles.sessRowLevel}>
        {levelsGained > 0
          ? `Lv ${session.lvStart}→${session.lvEnd}`
          : `Lv ${session.lvStart}`}
      </Text>
      <Text style={[styles.sessRowExp, { color: WC.exp }]}>{formatExp(session.expGainedActual)}</Text>
      <Text style={[styles.sessRowMesos, { color: WC.mesos }]}>{formatExp(session.mesosGained)}</Text>
      <Text style={[styles.sessRowFrags, { color: WC.frags }]}>{formatNumber(session.fragsGained)}</Text>
      <Text style={[styles.sessRowNodes, { color: WC.nodes }]}>{formatNumber(session.nodesGained)}</Text>
      <Ionicons name="chevron-forward" size={12} color={WC.textFaint} style={styles.sessRowArrow} />
    </TouchableOpacity>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  profileName: string;
  profileClass: string;
  profileLevel: number;
  profileXpPct: number;
  weekStats: PeriodStats | null;
  monthStats: PeriodStats | null;
  recentSessions: Session[];
  openSession: OpenSession | null;
  onFinishSession: () => void;
  onCancelSession: () => void;
  onNewSession: () => void;
}

export default function HomeScreenDesktop({
  profileName,
  profileClass,
  profileLevel,
  profileXpPct,
  weekStats,
  recentSessions,
  openSession,
  onFinishSession,
  onCancelSession,
}: Props) {
  const w = weekStats;

  return (
    <View style={[styles.root, openSession ? styles.rootWithPill : null]}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <View style={styles.leftPanel}>

        {/* XP Ring */}
        <View style={styles.ringWrap}>
          <XPRing level={profileLevel} xpPercent={profileXpPct} size={148} strokeWidth={8} />
        </View>

        {/* Character identity */}
        <Text style={styles.charName}>{profileName}</Text>
        {profileClass ? (
          <View style={styles.classBadge}>
            <Text style={styles.classBadgeText}>{profileClass}</Text>
          </View>
        ) : null}

        {/* XP bar */}
        <View style={styles.xpBarWrap}>
          <View style={[styles.xpBarFill, { width: `${Math.min(profileXpPct, 100)}%` as `${number}%` }]} />
        </View>
        <Text style={styles.xpPctText}>{profileXpPct.toFixed(2)}% → Lv {profileLevel + 1}</Text>

        <View style={styles.leftSep} />

        {/* Week header */}
        <View style={styles.weekHeaderRow}>
          <Text style={styles.weekTitle}>ESTA SEMANA</Text>
          {w && w.sessionCount > 0 && (
            <View style={styles.weekCountBadge}>
              <Text style={styles.weekCountText}>{w.sessionCount}</Text>
            </View>
          )}
        </View>

        {/* Stat rows */}
        <View style={styles.statList}>
          <StatRow label="EXP"   value={w ? formatExp(w.totalExpGained)      : '—'} color={WC.exp}   bg={WC.expBg}   icon="flash" />
          <StatRow label="Mesos" value={w ? formatExp(w.totalMesosGained)    : '—'} color={WC.mesos} bg={WC.mesosBg} icon="cash" />
          <StatRow label="Frags" value={w ? formatNumber(w.totalFragsGained) : '—'} color={WC.frags} bg={WC.fragsBg} icon="diamond" />
          <StatRow label="Nodos" value={w ? formatNumber(w.totalNodesGained) : '—'} color={WC.nodes} bg={WC.nodesBg} icon="grid" />
        </View>

        <View style={styles.leftSep} />
        <Text style={styles.weekSessions}>
          {w?.sessionCount ?? 0} sesión{(w?.sessionCount ?? 0) !== 1 ? 'es' : ''} esta semana
        </Text>
      </View>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <View style={styles.rightPanel}>

        {/* Header */}
        <View style={styles.rightHeader}>
          <View>
            <Text style={styles.rightTitle}>Sesiones Recientes</Text>
          </View>
          <View style={styles.recentBadge}>
            <Text style={styles.recentBadgeText}>{recentSessions.length} más recientes</Text>
          </View>
        </View>

        {/* Table header */}
        {recentSessions.length > 0 && (
          <View style={styles.tableHeader}>
            <Text style={[styles.thCell, styles.sessDateWrap]}>FECHA</Text>
            <Text style={[styles.thCell, styles.sessRowLevel]}>NIVEL</Text>
            <Text style={[styles.thCell, styles.sessRowExp]}>EXP</Text>
            <Text style={[styles.thCell, styles.sessRowMesos]}>MESOS</Text>
            <Text style={[styles.thCell, styles.sessRowFrags]}>FRAGS</Text>
            <Text style={[styles.thCell, styles.sessRowNodes]}>NODOS</Text>
            <View style={styles.sessRowArrow} />
          </View>
        )}

        {/* Rows */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎮</Text>
              <Text style={styles.emptyTitle}>Sin sesiones aún</Text>
              <Text style={styles.emptyHint}>Inicia tu primera sesión desde el menú lateral</Text>
            </View>
          ) : (
            recentSessions.map((s, i) => (
              <SessionRow key={s.id} session={s} index={i} />
            ))
          )}
        </ScrollView>
      </View>

      {/* ── SESSION PILL ───────────────────────────────────────────────── */}
      {openSession && (
        <View style={styles.sessionPill}>
          <View style={styles.pillLeft}>
            <View style={styles.pillDot} />
            <View>
              <Text style={styles.pillTitle}>Sesión en Progreso</Text>
              <Text style={styles.pillSub}>
                Lv {openSession.lvStart} · {openSession.expStart.toFixed(2)}% EXP
              </Text>
            </View>
          </View>
          <View style={styles.pillActions}>
            <TouchableOpacity style={styles.pillCancelBtn} onPress={onCancelSession} activeOpacity={0.7}>
              <Text style={styles.pillCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillFinishBtn} onPress={onFinishSession} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.pillFinishText}>Finalizar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WC.bg,
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    paddingBottom: 0,
  },
  rootWithPill: { paddingBottom: 68 },

  // Left panel
  leftPanel: {
    width: 252,
    flexShrink: 0,
    backgroundColor: WC.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WC.panelBorderStrong,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 10,
  },

  ringWrap: {
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },

  charName: {
    fontSize: 18,
    fontWeight: '900',
    color: WC.text,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: 6,
  },
  classBadge: {
    backgroundColor: WC.primaryDim,
    borderWidth: 1,
    borderColor: WC.primaryBorder,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: -4,
  },
  classBadgeText: {
    color: WC.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  xpBarWrap: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: WC.primary,
    borderRadius: 3,
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  xpPctText: {
    fontSize: 10,
    color: WC.textMuted,
    marginTop: -2,
  },

  leftSep: {
    width: '100%',
    height: 1,
    backgroundColor: WC.sep,
  },

  weekHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekTitle: {
    fontSize: 9,
    color: WC.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  weekCountBadge: {
    backgroundColor: WC.primaryDim,
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: WC.primaryBorder,
  },
  weekCountText: {
    color: WC.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  statList: {
    width: '100%',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: WC.sep,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRowLabel: {
    flex: 1,
    color: WC.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  statRowValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  weekSessions: {
    fontSize: 10,
    color: WC.textFaint,
    textAlign: 'center',
  },

  // Right panel
  rightPanel: {
    flex: 1,
    backgroundColor: WC.panelBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    overflow: 'hidden',
  },

  rightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
  },
  rightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: WC.text,
    letterSpacing: -0.3,
  },
  recentBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: WC.sep,
  },
  recentBadgeText: {
    color: WC.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  thCell: {
    fontSize: 9,
    color: WC.textFaint,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  sessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sessRowEven: { backgroundColor: 'rgba(255,255,255,0.02)' },

  sessDateWrap:  { width: 70 },
  sessRowDate:   { color: WC.textDim, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  sessRowLevel:  { flex: 1, color: WC.textMuted, fontWeight: '500', fontSize: 12 },
  sessRowExp:    { width: 92,  fontWeight: '900', fontSize: 14, letterSpacing: -0.5, textAlign: 'right' },
  sessRowMesos:  { width: 82,  fontWeight: '700', fontSize: 12, textAlign: 'right' },
  sessRowFrags:  { width: 62,  fontWeight: '700', fontSize: 12, textAlign: 'right' },
  sessRowNodes:  { width: 62,  fontWeight: '700', fontSize: 12, textAlign: 'right' },
  sessRowArrow:  { width: 24, alignItems: 'center' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: WC.textDim, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: WC.textMuted, textAlign: 'center' },

  // Session pill
  sessionPill: {
    position: 'absolute',
    bottom: 12, left: 16, right: 16,
    backgroundColor: 'rgba(8,4,32,0.92)',
    borderWidth: 1,
    borderColor: WC.primaryBorder,
    borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    zIndex: 20,
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    // @ts-ignore
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  pillLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: WC.exp,
    shadowColor: WC.exp, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8,
  },
  pillTitle: { fontSize: 13, fontWeight: '800', color: WC.primary },
  pillSub: { fontSize: 10, color: WC.textMuted, marginTop: 1 },
  pillActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pillCancelBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  pillCancelText: { fontSize: 12, color: WC.textMuted, fontWeight: '600' },
  pillFinishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WC.btnGlow,
    borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 9,
    shadowColor: WC.btnGlow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.6, shadowRadius: 14,
  },
  pillFinishText: { fontSize: 13, color: '#fff', fontWeight: '800' },
});
