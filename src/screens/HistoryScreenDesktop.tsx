/**
 * HistoryScreenDesktop — Web-native history dashboard
 * Layout: top control bar | left session table | right stats panel
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session, PeriodStats } from '../types';
import { WC } from '../constants/themeWeb';
import {
  formatDateShortEs, formatExp, formatNumber, formatPercent,
} from '../utils/formatters';

type Mode = 'day' | 'week' | 'month';

// ── Sub-components ────────────────────────────────────────────────────────────

function TableRow({ session, onPress }: { session: Session; onPress: () => void }) {
  const levelsGained = session.lvEnd - session.lvStart;
  return (
    <TouchableOpacity style={styles.tableRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.cell, styles.cellDate]}>{formatDateShortEs(session.date)}</Text>
      <Text style={[styles.cell, styles.cellLevel]}>
        {levelsGained > 0
          ? `${session.lvStart} → ${session.lvEnd}`
          : `${session.lvStart}`}
        {'  '}
        <Text style={styles.cellLevelPct}>
          {formatPercent(session.expStart)}% → {formatPercent(session.expEnd)}%
        </Text>
      </Text>
      <Text style={[styles.cell, styles.cellExp, { color: WC.exp }]}>
        {formatExp(session.expGainedActual)}
      </Text>
      <Text style={[styles.cell, styles.cellMesos, { color: WC.mesos }]}>
        {formatExp(session.mesosGained)}
      </Text>
      <Text style={[styles.cell, styles.cellFrags, { color: WC.frags }]}>
        {formatNumber(session.fragsGained)}
      </Text>
      <Text style={[styles.cell, styles.cellNodes, { color: WC.nodes }]}>
        {formatNumber(session.nodesGained)}
      </Text>
      <View style={styles.cellArrow}>
        <Ionicons name="chevron-forward" size={13} color={WC.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  periodLabel: string;
  onBack: () => void;
  onNext: () => void;
  isFuture: boolean;
  sessions: Session[];
  stats: PeriodStats | null;
  onSessionPress: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function HistoryScreenDesktop({
  mode, onModeChange, periodLabel, onBack, onNext, isFuture,
  sessions, stats, onSessionPress, onNewSession,
}: Props) {
  return (
    <View style={styles.root}>

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Mode tabs */}
        <View style={styles.modeTabs}>
          {(['day', 'week', 'month'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
              onPress={() => onModeChange(m)}
              activeOpacity={0.75}
            >
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {m === 'day' ? 'Día' : m === 'week' ? 'Semana' : 'Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period navigator */}
        <View style={styles.periodNav}>
          <TouchableOpacity onPress={onBack} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={16} color={WC.primary} />
          </TouchableOpacity>
          <Text style={styles.periodLabel} numberOfLines={1}>{periodLabel}</Text>
          <TouchableOpacity onPress={onNext} style={styles.navBtn} disabled={isFuture}>
            <Ionicons name="chevron-forward" size={16} color={isFuture ? WC.textMuted : WC.primary} />
          </TouchableOpacity>
        </View>

      </View>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <View style={styles.body}>

        {/* SESSION TABLE */}
        <View style={styles.tableCol}>
          {sessions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>Sin sesiones en este período</Text>
              <Text style={styles.emptyHint}>Cambia el filtro o inicia una nueva sesión</Text>
            </View>
          ) : (
            <>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.cellDate]}>FECHA</Text>
                <Text style={[styles.headerCell, styles.cellLevel]}>NIVEL</Text>
                <Text style={[styles.headerCell, styles.cellExp]}>EXP</Text>
                <Text style={[styles.headerCell, styles.cellMesos]}>MESOS</Text>
                <Text style={[styles.headerCell, styles.cellFrags]}>FRAGS</Text>
                <Text style={[styles.headerCell, styles.cellNodes]}>NODOS</Text>
                <View style={styles.cellArrow} />
              </View>

              {/* Table rows */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {sessions.map((s, i) => (
                  <View key={s.id}>
                    {i > 0 && <View style={styles.rowDivider} />}
                    <TableRow
                      session={s}
                      onPress={() => onSessionPress(s.id)}
                    />
                  </View>
                ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            </>
          )}
        </View>

        {/* STATS PANEL */}
        <View style={styles.statsCol}>
          <View style={styles.statsPanel}>
            <Text style={styles.panelTitle}>RESUMEN</Text>

            {stats && sessions.length > 0 ? (
              <>
                <View style={styles.levelBadge}>
                  <Ionicons name="trending-up" size={11} color={WC.primary} />
                  <Text style={styles.levelBadgeText}>
                    {' '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%)
                    {' → '}Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
                  </Text>
                </View>

                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>EXPERIENCIA</Text>
                  <Text style={[styles.bigStat, { color: WC.exp }]}>
                    {formatExp(stats.totalExpGained)}
                  </Text>
                </View>

                <View style={styles.sep} />

                <StatRow label="Mesos"    value={formatExp(stats.totalMesosGained)}          color={WC.mesos} />
                <StatRow label="Frags"    value={formatNumber(stats.totalFragsGained)}         color={WC.frags} />
                <StatRow label="Nodos"    value={formatNumber(stats.totalNodesGained)}         color={WC.nodes} />
                <StatRow label="Fam. C"   value={String(stats.totalCommonFamiliarsGained)}     color={WC.common} />
                <StatRow label="Fam. R"   value={String(stats.totalRareFamiliarsGained)}       color={WC.rare} />

                <View style={[styles.sep, { marginTop: 12 }]} />
                <Text style={styles.sessionCount}>
                  {stats.sessionCount} {stats.sessionCount === 1 ? 'sesión' : 'sesiones'}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyStats}>Sin datos para el período seleccionado</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WC.bg, flexDirection: 'column' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
    backgroundColor: WC.bg,
  },
  modeTabs: { flexDirection: 'row', gap: 4 },
  modeTab: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 50, borderWidth: 1, borderColor: 'transparent',
  },
  modeTabActive: { backgroundColor: WC.primaryDim, borderColor: WC.primaryBorder },
  modeTabText: { color: WC.textMuted, fontSize: 13, fontWeight: '600' },
  modeTabTextActive: { color: WC.primary },

  periodNav: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: WC.panelBg, borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 50, paddingHorizontal: 4,
    maxWidth: 400,
  },
  navBtn: { padding: 8 },
  periodLabel: {
    flex: 1, color: WC.text, fontSize: 13, fontWeight: '700',
    textAlign: 'center', textTransform: 'capitalize',
  },

  // Body layout
  body: { flex: 1, flexDirection: 'row' },

  // Table column
  tableCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: WC.panelBorder,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerCell: {
    fontSize: 9, color: WC.textMuted, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'transparent',
  },
  rowDivider: { height: 1, marginHorizontal: 16, backgroundColor: WC.sep },
  cell: { fontSize: 13 },

  // Column widths
  cellDate:  { width: 72, color: WC.text, fontWeight: '700', textTransform: 'uppercase', fontSize: 12 },
  cellLevel: { width: 200, color: WC.textDim, fontWeight: '500' },
  cellLevelPct: { fontSize: 10, color: WC.textMuted },
  cellExp:   { width: 90, fontWeight: '800', letterSpacing: -0.5, textAlign: 'right' },
  cellMesos: { width: 80, fontWeight: '700', textAlign: 'right', fontSize: 12 },
  cellFrags: { width: 70, fontWeight: '700', textAlign: 'right', fontSize: 12 },
  cellNodes: { width: 70, fontWeight: '700', textAlign: 'right', fontSize: 12 },
  cellArrow: { width: 28, alignItems: 'center' },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: WC.textDim, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyHint: { color: WC.textMuted, fontSize: 12 },

  // Stats panel
  statsCol: { width: 280, padding: 16 },
  statsPanel: {
    flex: 1,
    backgroundColor: WC.panelBgStrong,
    borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 14, padding: 18,
  },
  panelTitle: {
    fontSize: 9, color: WC.textMuted, letterSpacing: 2,
    textTransform: 'uppercase', fontWeight: '700',
    marginBottom: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: WC.sep,
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5,
    marginBottom: 14, borderWidth: 1, borderColor: WC.sep,
  },
  levelBadgeText: { fontSize: 10, color: WC.textDim, flex: 1, flexWrap: 'wrap' },

  statSection: { marginBottom: 10 },
  statSectionTitle: {
    fontSize: 9, color: WC.textMuted, letterSpacing: 1.5,
    textTransform: 'uppercase', fontWeight: '600', marginBottom: 4,
  },
  bigStat: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },

  sep: { height: 1, backgroundColor: WC.sep, marginBottom: 10 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: WC.sep,
  },
  statLabel: { color: WC.textMuted, fontSize: 12 },
  statValue: { fontSize: 13, fontWeight: '700' },
  sessionCount: { color: WC.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  emptyStats: { color: WC.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center' },
});
