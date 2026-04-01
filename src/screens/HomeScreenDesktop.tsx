/**
 * HomeScreenDesktop — nueva UI dashboard para web desktop
 * Layout: panel izquierdo (ring + char + best day) + área derecha (6 tiles + tabla recursos + sesiones)
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Session, PeriodStats, OpenSession } from '../types';
import { formatExp, formatNumber } from '../utils/formatters';
import XPRing from '../components/XPRing';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Web color palette (Glass Cosmos × orange accent) ──────────────────
const WC = {
  bg: '#040215',
  panelBg: 'rgba(255,255,255,0.05)',
  panelBorder: 'rgba(255,255,255,0.08)',
  panelBgStrong: 'rgba(255,255,255,0.07)',
  panelBorderStrong: 'rgba(255,255,255,0.10)',
  primary: '#C49FFF',
  primaryDim: 'rgba(180,127,255,0.15)',
  primaryBorder: 'rgba(180,127,255,0.28)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.28)',
  sep: 'rgba(255,255,255,0.05)',
  headerSep: 'rgba(255,255,255,0.055)',
  // Resource colors
  exp: '#4ADE80',
  expDim: '#86EFAC',
  mesos: '#FCD34D',
  mesosDim: '#FDE68A',
  frags: '#A78BFA',
  nodes: '#67E8F9',
  common: '#38BDF8',
  rare: '#F472B6',
};

// ── Helpers ───────────────────────────────────────────────────────────
function sectionHdr(label: string) {
  return (
    <Text style={styles.colHdr}>{label}</Text>
  );
}

// Compute best day stats: max per resource across all sessions
function computeBestDay(sessions: Session[]) {
  let best = {
    exp: 0, mesos: 0, frags: 0, nodes: 0, common: 0, rare: 0, date: '',
  };
  for (const s of sessions) {
    if (s.expGainedActual > best.exp) { best.exp = s.expGainedActual; best.date = s.date; }
    if (s.mesosGained > best.mesos) best.mesos = s.mesosGained;
    if (s.fragsGained > best.frags) best.frags = s.fragsGained;
    if (s.nodesGained > best.nodes) best.nodes = s.nodesGained;
    if (s.commonFamiliarsGained > best.common) best.common = s.commonFamiliarsGained;
    if (s.rareFamiliarsGained > best.rare) best.rare = s.rareFamiliarsGained;
  }
  return best;
}

// ── Sub-components ────────────────────────────────────────────────────

function Tile({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileVal, { color }]}>{value}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </View>
  );
}

function ResRow({ label, week, month, total, color }: {
  label: string; week: string; month: string; total?: string; color: string;
}) {
  return (
    <View style={styles.resRow}>
      <Text style={styles.resRowLabel}>{label}</Text>
      <Text style={[styles.resRowVal, { color }]}>{week}</Text>
      <Text style={[styles.resRowVal, { color }]}>{month}</Text>
      <Text style={[styles.resRowVal, { color: total ? WC.expDim : WC.textMuted }]}>
        {total ?? '—'}
      </Text>
    </View>
  );
}

function SessCard({ session }: { session: Session }) {
  const navigation = useNavigation<Nav>();
  const dateLabel = session.date.slice(5).replace('-', ' ').replace(/^0/, '');
  const lvStr = session.lvEnd > session.lvStart
    ? `LV ${session.lvStart} → ${session.lvEnd}`
    : `LV ${session.lvStart}`;
  return (
    <TouchableOpacity
      style={styles.sessCard}
      onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
      activeOpacity={0.7}
    >
      <View style={styles.sessTop}>
        <View>
          <Text style={styles.sessDate}>{dateLabel}</Text>
          <Text style={styles.sessLv}>{lvStr}</Text>
        </View>
        <Text style={[styles.sessExp, { color: WC.exp }]}>{formatExp(session.expGainedActual)}</Text>
      </View>
      <View style={styles.sessChips}>
        <View style={styles.chip}>
          <Text style={styles.chipKey}>Mesos</Text>
          <Text style={[styles.chipVal, { color: WC.mesos }]}>{formatExp(session.mesosGained)}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipKey}>Frags</Text>
          <Text style={[styles.chipVal, { color: WC.frags }]}>+{formatNumber(session.fragsGained)}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipKey}>Nodos</Text>
          <Text style={[styles.chipVal, { color: WC.nodes }]}>+{formatNumber(session.nodesGained)}</Text>
        </View>
        {session.commonFamiliarsGained > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipKey}>Fam.C</Text>
            <Text style={[styles.chipVal, { color: WC.common }]}>+{session.commonFamiliarsGained}</Text>
          </View>
        )}
        {session.rareFamiliarsGained > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipKey}>Fam.R</Text>
            <Text style={[styles.chipVal, { color: WC.rare }]}>+{session.rareFamiliarsGained}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main export ───────────────────────────────────────────────────────
interface Props {
  profileName: string;
  profileClass: string;
  profileLevel: number;
  profileXpPct: number;
  weekStats: PeriodStats | null;
  monthStats: PeriodStats | null;
  allTimeStats: PeriodStats | null;
  allSessions: Session[];
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
  monthStats,
  allTimeStats,
  allSessions,
  recentSessions,
  openSession,
  onFinishSession,
  onCancelSession,
  onNewSession,
}: Props) {
  const best = computeBestDay(allSessions);

  const w = weekStats;
  const m = monthStats;
  const at = allTimeStats;

  return (
    <View style={styles.root}>
      {/* ── LEFT PANEL ──────────────────────────────────────────── */}
      <View style={styles.leftPanel}>
        {/* XP Ring */}
        <XPRing level={profileLevel} xpPercent={profileXpPct} size={148} strokeWidth={9} />

        {/* XP Progress */}
        <View style={styles.xpBlock}>
          <Text style={styles.xpSub}>XP PROGRESS</Text>
          <Text style={styles.xpPct}>{profileXpPct.toFixed(1)}%</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${profileXpPct}%` as `${number}%` }]} />
          </View>
          <Text style={styles.xpNext}>→ Nivel {profileLevel + 1}</Text>
        </View>

        {/* Character */}
        <Text style={styles.charName}>{profileName}</Text>
        {profileClass ? <Text style={styles.charClass}>{profileClass}</Text> : null}

        <View style={styles.leftSep} />

        {/* Best day per resource */}
        <View style={styles.bestDaySection}>
          <Text style={styles.bestDayHdr}>
            MEJOR DÍA{best.date ? (
              <Text style={styles.bestDayDate}> · {best.date.slice(5).replace('-', ' ')}</Text>
            ) : null}
          </Text>
          <View style={styles.bestDayGrid}>
            <View style={styles.bdCell}>
              <Text style={styles.bdKey}>EXP</Text>
              <Text style={[styles.bdVal, { color: WC.exp }]}>{formatExp(best.exp)}</Text>
            </View>
            <View style={styles.bdCell}>
              <Text style={styles.bdKey}>Mesos</Text>
              <Text style={[styles.bdVal, { color: WC.mesos }]}>{formatExp(best.mesos)}</Text>
            </View>
            <View style={styles.bdCell}>
              <Text style={styles.bdKey}>Frags</Text>
              <Text style={[styles.bdVal, { color: WC.frags }]}>+{formatNumber(best.frags)}</Text>
            </View>
            <View style={styles.bdCell}>
              <Text style={styles.bdKey}>Nodos</Text>
              <Text style={[styles.bdVal, { color: WC.nodes }]}>+{formatNumber(best.nodes)}</Text>
            </View>
            <View style={styles.bdCell}>
              <Text style={styles.bdKey}>Fam.C</Text>
              <Text style={[styles.bdVal, { color: WC.common }]}>+{best.common}</Text>
            </View>
            <View style={styles.bdCell}>
              <Text style={styles.bdKey}>Fam.R</Text>
              <Text style={[styles.bdVal, { color: WC.rare }]}>+{best.rare}</Text>
            </View>
          </View>
        </View>

        {/* Sessions count */}
        <View style={styles.sessionsCount}>
          <Text style={styles.sessCountLabel}>SESIONES ESTE MES</Text>
          <Text style={[styles.sessCountVal, { color: WC.primary }]}>
            {m?.sessionCount ?? 0}
          </Text>
        </View>

        {/* Action button */}
        {openSession ? (
          <TouchableOpacity style={styles.actionBtn} onPress={onFinishSession} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>◎ Finalizar Sesión</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnNew]} onPress={onNewSession} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>▶ Nueva Sesión</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── RIGHT AREA ──────────────────────────────────────────── */}
      <View style={styles.rightArea}>

        {/* 6 TILES — 2×3 grid */}
        <View style={styles.tilesGrid}>
          <Tile
            label="EXP SEMANA" color={WC.exp}
            value={w ? formatExp(w.totalExpGained) : '—'}
            sub={m ? `${formatExp(m.totalExpGained)} mes` : '—'}
          />
          <Tile
            label="MESOS SEMANA" color={WC.mesos}
            value={w ? formatExp(w.totalMesosGained) : '—'}
            sub={m ? `${formatExp(m.totalMesosGained)} mes` : '—'}
          />
          <Tile
            label="FRAGS SEMANA" color={WC.frags}
            value={w ? `+${formatNumber(w.totalFragsGained)}` : '—'}
            sub={m ? `+${formatNumber(m.totalFragsGained)} mes` : '—'}
          />
          <Tile
            label="NODOS SEMANA" color={WC.nodes}
            value={w ? `+${formatNumber(w.totalNodesGained)}` : '—'}
            sub={m ? `+${formatNumber(m.totalNodesGained)} mes` : '—'}
          />
          <Tile
            label="FAM. COMUNES SEM." color={WC.common}
            value={w ? `+${w.totalCommonFamiliarsGained}` : '—'}
            sub={m ? `+${m.totalCommonFamiliarsGained} mes` : '—'}
          />
          <Tile
            label="FAM. RAROS SEM." color={WC.rare}
            value={w ? `+${w.totalRareFamiliarsGained}` : '—'}
            sub={m ? `+${m.totalRareFamiliarsGained} mes` : '—'}
          />
        </View>

        {/* DATA COLUMNS */}
        <View style={styles.dataCols}>

          {/* LEFT COL: Resources table */}
          <View style={[styles.dataCol, styles.dataColPanel]}>
            {sectionHdr('RECURSOS · TOTALES')}

            {/* Table header */}
            <View style={styles.resTableHdr}>
              <Text style={[styles.resTableHdrCell, { flex: 2, textAlign: 'left' }]}> </Text>
              <Text style={styles.resTableHdrCell}>Semana</Text>
              <Text style={styles.resTableHdrCell}>Mes</Text>
              <Text style={styles.resTableHdrCell}>Total</Text>
            </View>

            <ResRow
              label="EXP" color={WC.exp}
              week={w ? formatExp(w.totalExpGained) : '—'}
              month={m ? formatExp(m.totalExpGained) : '—'}
              total={at ? formatExp(at.totalExpGained) : undefined}
            />
            <ResRow
              label="Mesos" color={WC.mesos}
              week={w ? formatExp(w.totalMesosGained) : '—'}
              month={m ? formatExp(m.totalMesosGained) : '—'}
              total={at ? formatExp(at.totalMesosGained) : undefined}
            />

            <View style={styles.resTableSep} />

            <ResRow
              label="Fragmentos" color={WC.frags}
              week={w ? `+${formatNumber(w.totalFragsGained)}` : '—'}
              month={m ? `+${formatNumber(m.totalFragsGained)}` : '—'}
            />
            <ResRow
              label="Nodos" color={WC.nodes}
              week={w ? `+${formatNumber(w.totalNodesGained)}` : '—'}
              month={m ? `+${formatNumber(m.totalNodesGained)}` : '—'}
            />
            <ResRow
              label="Fam. Comunes" color={WC.common}
              week={w ? `+${w.totalCommonFamiliarsGained}` : '—'}
              month={m ? `+${m.totalCommonFamiliarsGained}` : '—'}
            />
            <ResRow
              label="Fam. Raros" color={WC.rare}
              week={w ? `+${w.totalRareFamiliarsGained}` : '—'}
              month={m ? `+${m.totalRareFamiliarsGained}` : '—'}
            />
          </View>

          {/* RIGHT COL: Recent sessions */}
          <View style={[styles.dataCol, styles.dataColPanel]}>
            {sectionHdr('SESIONES RECIENTES')}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {recentSessions.length === 0 ? (
                <Text style={styles.emptyText}>Sin sesiones registradas</Text>
              ) : (
                recentSessions.map((s, i) => (
                  <View key={s.id}>
                    {i > 0 && <View style={styles.sessDivider} />}
                    <SessCard session={s} />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* ── SESSION PILL (bottom) ─────────────────────────────── */}
      {openSession && (
        <View style={styles.sessionPill}>
          <View style={styles.pillLeft}>
            <View style={styles.pillDot} />
            <View>
              <Text style={styles.pillTitle}>Sesión en Progreso</Text>
              <Text style={styles.pillSub}>
                Lv {openSession.lvStart} · {formatNumber(openSession.fragsStart)} frags · {formatExp(openSession.mesosStart)} mesos
              </Text>
            </View>
          </View>
          <View style={styles.pillActions}>
            <TouchableOpacity style={styles.pillCancelBtn} onPress={onCancelSession} activeOpacity={0.7}>
              <Text style={styles.pillCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillFinishBtn} onPress={onFinishSession} activeOpacity={0.8}>
              <Text style={styles.pillFinishText}>◎ Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WC.bg,
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    paddingBottom: 0,
  },

  // ─ Left panel ─
  leftPanel: {
    width: 232,
    flexShrink: 0,
    backgroundColor: WC.panelBgStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WC.panelBorderStrong,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 10,
  },

  xpBlock: { width: '100%', alignItems: 'center', gap: 2 },
  xpSub: { fontSize: 9, color: WC.textMuted, letterSpacing: 1.5, fontWeight: '700' },
  xpPct: {
    fontSize: 24, fontWeight: '900', color: '#B47FFF', letterSpacing: -1.5,
    textShadowColor: 'rgba(180,127,255,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  xpTrack: {
    height: 3, width: '90%', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, overflow: 'hidden', marginTop: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#C47FFF',
    shadowColor: '#C47FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  xpNext: { fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 3 },

  charName: { fontSize: 14, fontWeight: '800', color: WC.text, textAlign: 'center' },
  charClass: { fontSize: 10, fontWeight: '700', color: WC.primary, marginTop: -4, letterSpacing: 0.5 },

  leftSep: { width: '100%', height: 1, backgroundColor: WC.sep },

  // Best day grid 2×3
  bestDaySection: { width: '100%', gap: 6 },
  bestDayHdr: { fontSize: 8, fontWeight: '700', color: WC.textMuted, letterSpacing: 2 },
  bestDayDate: { color: 'rgba(180,127,255,0.5)', fontWeight: '700' },
  bestDayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bdCell: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.055)',
    borderRadius: 8, padding: 6,
  },
  bdKey: { fontSize: 8, color: WC.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  bdVal: { fontSize: 13, fontWeight: '900', letterSpacing: -0.5, marginTop: 1 },

  // Sessions count
  sessionsCount: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  sessCountLabel: { fontSize: 9, color: WC.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  sessCountVal: { fontSize: 16, fontWeight: '900' },

  // Action button
  actionBtn: {
    width: '100%', marginTop: 'auto',
    backgroundColor: '#5A18CC',
    borderRadius: 50, paddingVertical: 11, alignItems: 'center',
    shadowColor: '#5A18CC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12,
  },
  actionBtnNew: { backgroundColor: '#3A1090' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // ─ Right area ─
  rightArea: { flex: 1, flexDirection: 'column', gap: 10 },

  // Tiles grid 2×3
  tilesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, flexShrink: 0,
  },
  tile: {
    flex: 1, minWidth: '30%',
    backgroundColor: WC.panelBg, borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10,
  },
  tileLabel: { fontSize: 8, color: WC.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, fontWeight: '700' },
  tileVal: { fontSize: 20, fontWeight: '900', letterSpacing: -0.8, lineHeight: 22 },
  tileSub: { fontSize: 9, color: WC.textMuted, marginTop: 3 },

  // Data columns
  dataCols: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 0 },
  dataCol: { flex: 1, overflow: 'hidden' },
  dataColPanel: {
    backgroundColor: WC.panelBg, borderWidth: 1, borderColor: WC.panelBorder,
    borderRadius: 12, padding: 13,
  },

  colHdr: {
    fontSize: 9, color: WC.textMuted, letterSpacing: 2.5, textTransform: 'uppercase',
    fontWeight: '700', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: WC.headerSep,
    marginBottom: 4,
  },

  // Resources table
  resTableHdr: { flexDirection: 'row', marginBottom: 2 },
  resTableHdrCell: { flex: 1, fontSize: 8, color: WC.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', textAlign: 'right' },
  resRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: WC.sep },
  resRowLabel: { flex: 2, fontSize: 10, color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  resRowVal: { flex: 1, fontSize: 14, fontWeight: '900', letterSpacing: -0.5, textAlign: 'right' },
  resTableSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 6 },

  // Session cards
  sessDivider: { height: 1, backgroundColor: WC.sep },
  emptyText: { color: WC.textMuted, fontSize: 12, marginTop: 12, textAlign: 'center' },
  sessCard: { paddingVertical: 8 },
  sessTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  sessDate: { fontSize: 11, color: 'rgba(255,255,255,0.82)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  sessLv: { fontSize: 9, color: 'rgba(180,127,255,0.75)', marginTop: 1, letterSpacing: 0.3 },
  sessExp: { fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
  sessChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  chipKey: { fontSize: 8, color: WC.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipVal: { fontSize: 11, fontWeight: '800', letterSpacing: -0.3 },

  // Session pill
  sessionPill: {
    position: 'absolute',
    bottom: 10, left: 14, right: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: WC.primaryBorder,
    borderRadius: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 10,
    zIndex: 20,
  },
  pillLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: WC.primary,
    shadowColor: WC.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
  },
  pillTitle: { fontSize: 13, fontWeight: '700', color: WC.primary },
  pillSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  pillActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pillCancelBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  pillCancelText: { fontSize: 11, color: WC.textMuted, fontWeight: '600' },
  pillFinishBtn: {
    backgroundColor: '#5A18CC', borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 7,
    shadowColor: '#5A18CC', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  pillFinishText: { fontSize: 12, color: '#fff', fontWeight: '800' },
});
