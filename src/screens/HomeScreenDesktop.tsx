/**
 * HomeScreenDesktop — Glass Cosmos dashboard (desktop web)
 * Layout: left panel (ring + char + today stats) | right (sessions table + active session)
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

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      {sub ? <Text style={styles.statCardSub}>{sub}</Text> : null}
    </View>
  );
}

function SessionRow({ session, index }: { session: Session; index: number }) {
  const navigation = useNavigation<Nav>();
  const levelsGained = session.lvEnd - session.lvStart;
  const isEven = index % 2 === 0;
  return (
    <TouchableOpacity
      style={[styles.sessRow, isEven && styles.sessRowEven]}
      onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
      activeOpacity={0.7}
    >
      <Text style={styles.sessRowDate}>{formatDateShortEs(session.date)}</Text>
      <Text style={styles.sessRowLevel}>
        Lv {levelsGained > 0 ? `${session.lvStart}→${session.lvEnd}` : session.lvStart}
      </Text>
      <Text style={[styles.sessRowExp, { color: WC.exp }]}>{formatExp(session.expGainedActual)}</Text>
      <Text style={[styles.sessRowMesos, { color: WC.mesos }]}>{formatExp(session.mesosGained)}</Text>
      <Text style={[styles.sessRowFrags, { color: WC.frags }]}>{formatNumber(session.fragsGained)}</Text>
      <Text style={[styles.sessRowNodes, { color: WC.nodes }]}>{formatNumber(session.nodesGained)}</Text>
      <Ionicons name="chevron-forward" size={12} color={WC.textMuted} style={styles.sessRowArrow} />
    </TouchableOpacity>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
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

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <View style={styles.leftPanel}>

        {/* XP Ring */}
        <XPRing level={profileLevel} xpPercent={profileXpPct} size={140} strokeWidth={8} />

        {/* Character */}
        <Text style={styles.charName}>{profileName}</Text>
        {profileClass ? <Text style={styles.charClass}>{profileClass}</Text> : null}

        {/* XP progress bar */}
        <View style={styles.xpBarWrap}>
          <View style={[styles.xpBarFill, { width: `${Math.min(profileXpPct, 100)}%` as `${number}%` }]} />
        </View>
        <Text style={styles.xpPctText}>{profileXpPct.toFixed(2)}% → Lv {profileLevel + 1}</Text>

        <View style={styles.leftSep} />

        {/* This week quick stats */}
        <Text style={styles.weekTitle}>ESTA SEMANA</Text>
        <View style={styles.weekGrid}>
          <StatCard label="EXP"    value={w ? formatExp(w.totalExpGained)      : '—'} color={WC.exp} />
          <StatCard label="Mesos"  value={w ? formatExp(w.totalMesosGained)    : '—'} color={WC.mesos} />
          <StatCard label="Frags"  value={w ? formatNumber(w.totalFragsGained) : '—'} color={WC.frags} />
          <StatCard label="Nodos"  value={w ? formatNumber(w.totalNodesGained) : '—'} color={WC.nodes} />
        </View>

        <View style={styles.leftSep} />

        <Text style={styles.weekSessions}>
          {w?.sessionCount ?? 0} sesión{(w?.sessionCount ?? 0) !== 1 ? 'es' : ''} esta semana
        </Text>
      </View>

      {/* ── RIGHT AREA ──────────────────────────────────────────────────── */}
      <View style={styles.rightArea}>

        <View style={styles.rightHeader}>
          <Text style={styles.rightTitle}>Sesiones Recientes</Text>
          <Text style={styles.rightSub}>{recentSessions.length} más recientes</Text>
        </View>

        {/* Table header */}
        {recentSessions.length > 0 && (
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHdrCell, styles.sessRowDate]}>FECHA</Text>
            <Text style={[styles.tableHdrCell, styles.sessRowLevel]}>NIVEL</Text>
            <Text style={[styles.tableHdrCell, styles.sessRowExp]}>EXP</Text>
            <Text style={[styles.tableHdrCell, styles.sessRowMesos]}>MESOS</Text>
            <Text style={[styles.tableHdrCell, styles.sessRowFrags]}>FRAGS</Text>
            <Text style={[styles.tableHdrCell, styles.sessRowNodes]}>NODOS</Text>
            <View style={styles.sessRowArrow} />
          </View>
        )}

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

      {/* ── SESSION PILL ────────────────────────────────────────────────── */}
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
              <Text style={styles.pillFinishText}>◎  Finalizar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WC.bg,
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    paddingBottom: 0,
  },
  rootWithPill: { paddingBottom: 64 },

  // Left panel
  leftPanel: {
    width: 240,
    flexShrink: 0,
    backgroundColor: WC.panelBgStrong,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WC.panelBorderStrong,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 8,
  },

  charName: { fontSize: 16, fontWeight: '800', color: WC.text, textAlign: 'center', marginTop: 4 },
  charClass: { fontSize: 11, fontWeight: '700', color: WC.primary, letterSpacing: 0.5, marginTop: -4 },

  xpBarWrap: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: WC.primary,
    borderRadius: 2,
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  xpPctText: { fontSize: 10, color: WC.textMuted, marginTop: 2 },

  leftSep: { width: '100%', height: 1, backgroundColor: WC.sep },

  weekTitle: {
    fontSize: 9,
    color: WC.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  weekGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: WC.sep,
    borderRadius: 8,
    padding: 8,
  },
  statCardLabel: { fontSize: 8, color: WC.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  statCardValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statCardSub: { fontSize: 8, color: WC.textMuted, marginTop: 1 },

  weekSessions: { fontSize: 10, color: WC.textMuted, textAlign: 'center' },

  // Right area
  rightArea: {
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
  },
  rightTitle: { fontSize: 14, fontWeight: '800', color: WC.text, letterSpacing: -0.3 },
  rightSub: { fontSize: 11, color: WC.textMuted },

  // Table
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableHdrCell: {
    fontSize: 9,
    color: WC.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  sessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  sessRowEven: { backgroundColor: 'rgba(255,255,255,0.015)' },
  sessRowDate:  { width: 64,  color: WC.text,    fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  sessRowLevel: { flex: 1,    color: WC.textDim,  fontWeight: '500', fontSize: 12 },
  sessRowExp:   { width: 88,  fontWeight: '900',  fontSize: 14, letterSpacing: -0.5, textAlign: 'right' },
  sessRowMesos: { width: 80,  fontWeight: '700',  fontSize: 12, textAlign: 'right' },
  sessRowFrags: { width: 64,  fontWeight: '700',  fontSize: 12, textAlign: 'right' },
  sessRowNodes: { width: 64,  fontWeight: '700',  fontSize: 12, textAlign: 'right' },
  sessRowArrow: { width: 24,  alignItems: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: WC.textDim, marginBottom: 6 },
  emptyHint: { fontSize: 13, color: WC.textMuted, textAlign: 'center' },

  // Session pill
  sessionPill: {
    position: 'absolute',
    bottom: 10, left: 16, right: 16,
    backgroundColor: 'rgba(10,8,32,0.85)',
    borderWidth: 1, borderColor: WC.primaryBorder,
    borderRadius: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 11,
    zIndex: 20,
    // @ts-ignore
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  pillLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillDot: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: WC.exp,
    shadowColor: WC.exp, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8,
  },
  pillTitle: { fontSize: 13, fontWeight: '700', color: WC.primary },
  pillSub: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  pillActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pillCancelBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  pillCancelText: { fontSize: 11, color: WC.textMuted, fontWeight: '600' },
  pillFinishBtn: {
    backgroundColor: WC.btnGlow, borderRadius: 50,
    paddingHorizontal: 20, paddingVertical: 8,
    shadowColor: WC.btnGlow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  pillFinishText: { fontSize: 12, color: '#fff', fontWeight: '800', letterSpacing: 0.2 },
});
