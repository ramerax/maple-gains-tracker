/**
 * HistoryScreenDesktop — Web-native history dashboard
 * Layout: top control bar | left session table | right stats panel
 */
import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session, PeriodStats } from '../types';
import { WC } from '../constants/themeWeb';
import {
  formatDateShortEs, formatExp, formatNumber, formatPercent,
} from '../utils/formatters';

type Mode = 'day' | 'week' | 'month';

// ── Sub-components ────────────────────────────────────────────────────────────

const MODE_ICONS: Record<Mode, keyof typeof Ionicons.glyphMap> = {
  day:   'sunny-outline',
  week:  'calendar-outline',
  month: 'calendar-number-outline',
};

function TableRow({ session, onPress }: { session: Session; onPress: () => void }) {
  const levelsGained = session.lvEnd - session.lvStart;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Pressable style={(state: any) => [styles.tableRow, state.hovered && styles.tableRowHovered]} onPress={onPress}>
      {/* Date */}
      <View style={styles.cellDateWrap}>
        <View style={styles.dateDot} />
        <Text style={styles.cellDateText}>{formatDateShortEs(session.date)}</Text>
      </View>
      {/* Level */}
      <Text style={[styles.cell, styles.cellLevel]}>
        {levelsGained > 0
          ? `${session.lvStart} → ${session.lvEnd}`
          : `${session.lvStart}`}
        {'  '}
        <Text style={styles.cellLevelPct}>
          {formatPercent(session.expStart)}% → {formatPercent(session.expEnd)}%
        </Text>
      </Text>
      <Text style={[styles.cell, styles.cellExp]}>{formatExp(session.expGainedActual)}</Text>
      <Text style={[styles.cell, styles.cellMesos]}>{formatExp(session.mesosGained)}</Text>
      <Text style={[styles.cell, styles.cellFrags]}>{formatNumber(session.fragsGained)}</Text>
      <Text style={[styles.cell, styles.cellNodes]}>{formatNumber(session.nodesGained)}</Text>
      <View style={styles.cellArrow}>
        <Ionicons name="chevron-forward" size={12} color={WC.textMuted} />
      </View>
    </Pressable>
  );
}

// Stat rows with icon boxes — right panel
const STAT_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  Mesos:    { icon: 'cash-outline',    color: WC.mesos, bg: WC.mesosBg },
  Frags:    { icon: 'diamond-outline', color: WC.frags, bg: WC.fragsBg },
  Nodos:    { icon: 'grid-outline',    color: WC.nodes, bg: WC.nodesBg },
  'Fam. C': { icon: 'leaf-outline',    color: WC.common, bg: 'rgba(203,213,225,0.10)' },
  'Fam. R': { icon: 'star-outline',    color: WC.rare,   bg: 'rgba(96,165,250,0.10)'  },
};

function PanelStatRow({ label, value, color }: { label: string; value: string; color: string }) {
  const meta = STAT_META[label];
  return (
    <View style={styles.panelStatRow}>
      {meta ? (
        <View style={[styles.panelStatIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={11} color={meta.color} />
        </View>
      ) : (
        <View style={styles.panelStatIconPlaceholder} />
      )}
      <Text style={styles.panelStatLabel}>{label}</Text>
      <Text style={[styles.panelStatValue, { color }]}>{value}</Text>
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
  sessions, stats, onSessionPress,
}: Props) {
  return (
    <View style={styles.root}>

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>

        {/* Mode tabs — segmented control */}
        <View style={styles.modeTabs}>
          {(['day', 'week', 'month'] as Mode[]).map((m, i) => {
            const isActive = mode === m;
            return (
              <Pressable
                key={m}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={(state: any) => [
                  styles.modeTab,
                  i === 0 && styles.modeTabFirst,
                  i === 2 && styles.modeTabLast,
                  state.hovered && !isActive && styles.modeTabHovered,
                  isActive && styles.modeTabActive,
                ]}
                onPress={() => onModeChange(m)}
              >
                <Ionicons
                  name={MODE_ICONS[m]}
                  size={12}
                  color={isActive ? WC.primary : WC.textMuted}
                />
                <Text style={[styles.modeTabText, isActive && styles.modeTabTextActive]}>
                  {m === 'day' ? 'Día' : m === 'week' ? 'Semana' : 'Mes'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Period navigator */}
        <View style={styles.periodNav}>
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(state: any) => [styles.navBtn, state.hovered && styles.navBtnHovered]}
            onPress={onBack}
          >
            <Ionicons name="chevron-back" size={14} color={WC.primary} />
          </Pressable>
          <Text style={styles.periodLabel} numberOfLines={1}>{periodLabel}</Text>
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(state: any) => [styles.navBtn, state.hovered && !isFuture && styles.navBtnHovered]}
            onPress={onNext}
            disabled={isFuture}
          >
            <Ionicons name="chevron-forward" size={14} color={isFuture ? WC.textFaint : WC.primary} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        {/* Session count badge */}
        {sessions.length > 0 && (
          <View style={styles.countBadge}>
            <Ionicons name="layers-outline" size={11} color={WC.textMuted} />
            <Text style={styles.countBadgeText}>{sessions.length} sesiones</Text>
          </View>
        )}
      </View>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <View style={styles.body}>

        {/* SESSION TABLE */}
        <View style={styles.tableCol}>
          {sessions.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="time-outline" size={30} color={WC.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Sin sesiones en este período</Text>
              <Text style={styles.emptyHint}>Cambia el filtro o inicia una nueva sesión</Text>
            </View>
          ) : (
            <>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <View style={styles.cellDateWrap}>
                  <Text style={styles.headerCell}>FECHA</Text>
                </View>
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
                    <TableRow session={s} onPress={() => onSessionPress(s.id)} />
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

            {/* Panel title */}
            <View style={styles.panelTitleRow}>
              <View style={styles.panelAccentBar} />
              <Text style={styles.panelTitle}>RESUMEN</Text>
            </View>

            {stats && sessions.length > 0 ? (
              <>
                {/* Level range */}
                <View style={styles.levelBadge}>
                  <Ionicons name="trending-up" size={11} color={WC.primary} />
                  <Text style={styles.levelBadgeText}>
                    {' '}Lv {stats.lvStart} ({formatPercent(stats.expStart)}%)
                    {' → '}Lv {stats.lvEnd} ({formatPercent(stats.expEnd)}%)
                  </Text>
                </View>

                {/* EXP hero block */}
                <View style={styles.expBlock}>
                  <Text style={styles.expBlockLabel}>EXP TOTAL</Text>
                  <Text style={styles.expBlockValue}>{formatExp(stats.totalExpGained)}</Text>
                </View>

                <View style={styles.sep} />

                <PanelStatRow label="Mesos"  value={formatExp(stats.totalMesosGained)}        color={WC.mesos} />
                <PanelStatRow label="Frags"  value={formatNumber(stats.totalFragsGained)}      color={WC.frags} />
                <PanelStatRow label="Nodos"  value={formatNumber(stats.totalNodesGained)}      color={WC.nodes} />
                <PanelStatRow label="Fam. C" value={String(stats.totalCommonFamiliarsGained)}  color={WC.common} />
                <PanelStatRow label="Fam. R" value={String(stats.totalRareFamiliarsGained)}    color={WC.rare} />

                <View style={[styles.sep, { marginTop: 12 }]} />
                <View style={styles.sessionCountRow}>
                  <Ionicons name="layers-outline" size={11} color={WC.textMuted} />
                  <Text style={styles.sessionCount}>
                    {' '}{stats.sessionCount} {stats.sessionCount === 1 ? 'sesión' : 'sesiones'}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyStatsWrap}>
                <Ionicons name="stats-chart-outline" size={28} color={WC.textFaint} />
                <Text style={styles.emptyStats}>Sin datos para el período</Text>
              </View>
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

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
    backgroundColor: WC.bgDeep,
  },

  // Mode tabs — segmented control
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    overflow: 'hidden',
    backgroundColor: WC.panelBg,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRightWidth: 1,
    borderRightColor: WC.panelBorder,
  },
  modeTabFirst: {},
  modeTabLast: { borderRightWidth: 0 },
  modeTabHovered: { backgroundColor: 'rgba(255,255,255,0.04)' },
  modeTabActive: { backgroundColor: WC.primaryDim },
  modeTabText: { color: WC.textMuted, fontSize: 12, fontWeight: '600' },
  modeTabTextActive: { color: WC.primary, fontWeight: '700' },

  // Period navigator
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WC.panelBg,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    borderRadius: 10,
    paddingHorizontal: 2,
    minWidth: 220,
    maxWidth: 360,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  navBtnHovered: { backgroundColor: WC.primaryDim },
  periodLabel: {
    flex: 1,
    color: WC.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize',
  },

  // Session count badge
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WC.panelBg,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countBadgeText: { color: WC.textMuted, fontSize: 11, fontWeight: '600' },

  // ── Body ─────────────────────────────────────────────────────────────────
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
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: WC.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  headerCell: {
    fontSize: 9,
    color: WC.textFaint,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'transparent',
  },
  tableRowHovered: { backgroundColor: 'rgba(196,159,255,0.04)' },
  rowDivider: { height: 1, marginHorizontal: 16, backgroundColor: WC.sep },
  cell: { fontSize: 13 },

  // Date cell with dot indicator
  cellDateWrap: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dateDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: WC.primary,
    opacity: 0.45,
  },
  cellDateText: {
    color: WC.text,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
  },

  // Column widths
  cellLevel: { width: 192, color: WC.textDim, fontWeight: '500', fontSize: 13 },
  cellLevelPct: { fontSize: 10, color: WC.textMuted },
  cellExp:   { width: 90,  fontWeight: '800', letterSpacing: -0.5, textAlign: 'right', color: WC.exp },
  cellMesos: { width: 80,  fontWeight: '700', textAlign: 'right', fontSize: 12, color: WC.mesos },
  cellFrags: { width: 70,  fontWeight: '700', textAlign: 'right', fontSize: 12, color: WC.frags },
  cellNodes: { width: 70,  fontWeight: '700', textAlign: 'right', fontSize: 12, color: WC.nodes },
  cellArrow: { width: 28,  alignItems: 'center' },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: WC.panelBg,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: WC.textDim, fontSize: 15, fontWeight: '700' },
  emptyHint:  { color: WC.textMuted, fontSize: 12 },

  // ── Stats panel ──────────────────────────────────────────────────────────
  statsCol: { width: 282, padding: 14 },
  statsPanel: {
    flex: 1,
    backgroundColor: WC.cardBg,
    borderWidth: 1,
    borderColor: WC.panelBorderStrong,
    borderRadius: 16,
    padding: 18,
  },

  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
  },
  panelAccentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: WC.primary,
  },
  panelTitle: {
    fontSize: 9,
    color: WC.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    flex: 1,
  },

  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WC.primaryDim,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: WC.primaryBorder,
  },
  levelBadgeText: { fontSize: 10, color: WC.textDim, flex: 1, flexWrap: 'wrap' },

  expBlock: {
    backgroundColor: WC.expBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(217,70,239,0.20)',
  },
  expBlockLabel: {
    fontSize: 8,
    color: WC.expDim,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
    opacity: 0.8,
  },
  expBlockValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    color: WC.exp,
  },

  sep: { height: 1, backgroundColor: WC.sep, marginBottom: 10 },

  panelStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
    gap: 8,
  },
  panelStatIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelStatIconPlaceholder: { width: 22 },
  panelStatLabel: { color: WC.textMuted, fontSize: 12, flex: 1 },
  panelStatValue: { fontSize: 13, fontWeight: '700' },

  sessionCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  sessionCount: { color: WC.textMuted, fontSize: 10 },

  emptyStatsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyStats: { color: WC.textMuted, fontSize: 12, textAlign: 'center' },
});
