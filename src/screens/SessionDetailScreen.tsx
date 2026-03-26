import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Session } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { getSessionById, deleteSession } from '../utils/storage';
import { formatDateLong, formatExp, formatNumber, formatPercent } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

function Row({ label, value, color, big }: {
  label: string; value: string; color?: string; big?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : null, big ? styles.rowValueBig : null]}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, color, children }: {
  title: string; color: string; children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderLeftColor: color }]}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<Session | null>(null);

  const load = useCallback(async () => {
    const s = await getSessionById(sessionId);
    setSession(s);
    if (s) navigation.setOptions({ title: `Sesión — ${s.date}` });
  }, [sessionId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = () => {
    Alert.alert('Eliminar sesión', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await deleteSession(sessionId); navigation.goBack(); },
      },
    ]);
  };

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.textMuted }}>Cargando...</Text>
      </View>
    );
  }

  const levelsGained = session.lvEnd - session.lvStart;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date */}
      <View style={styles.dateCard}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
        <Text style={styles.dateText}>{'  '}{formatDateLong(session.date)}</Text>
      </View>

      {/* EXP */}
      <Section title="⚔️  Nivel y Experiencia" color={COLORS.exp}>
        <Row label="Nivel inicio" value={`${session.lvStart}  (${formatPercent(session.expStart)}%)`} />
        <Row label="Nivel fin"    value={`${session.lvEnd}  (${formatPercent(session.expEnd)}%)`} />
        {levelsGained > 0 && (
          <Row label="Niveles ganados" value={`+${levelsGained}`} color={COLORS.primary} />
        )}
        <Row label="EXP ganada" value={formatExp(session.expGainedActual)} color={COLORS.exp} big />
        <Row label="EXP exacta"  value={formatNumber(session.expGainedActual)} color={COLORS.textSecondary} />
      </Section>

      {/* Fragments */}
      <Section title="💎  Fragmentos" color={COLORS.frags}>
        <Row label="Inicio"   value={formatNumber(session.fragsStart)} />
        <Row label="Fin"      value={formatNumber(session.fragsEnd)} />
        <Row label="Ganados"  value={`+${formatNumber(session.fragsGained)}`} color={COLORS.frags} big />
      </Section>

      {/* Nodes */}
      <Section title="🔮  Nodos" color={COLORS.nodes}>
        <Row label="Inicio"  value={formatNumber(session.nodesStart)} />
        <Row label="Fin"     value={formatNumber(session.nodesEnd)} />
        <Row label="Ganados" value={`+${formatNumber(session.nodesGained)}`} color={COLORS.nodes} big />
      </Section>

      {/* Mesos */}
      <Section title="💰  Mesos" color={COLORS.mesos}>
        <Row label="Inicio"        value={formatExp(session.mesosStart)} />
        <Row label="Fin"           value={formatExp(session.mesosEnd)} />
        <Row label="Ganados"       value={`+${formatExp(session.mesosGained)}`} color={COLORS.mesos} big />
        <Row label="Mesos exactos" value={formatNumber(session.mesosGained)} color={COLORS.textSecondary} />
      </Section>

      {/* Common Familiars */}
      <Section title="👾  Familiares Comunes" color={COLORS.common}>
        <Row label="Inicio"  value={formatNumber(session.commonFamiliarsStart)} />
        <Row label="Fin"     value={formatNumber(session.commonFamiliarsEnd)} />
        <Row label="Ganados" value={`+${formatNumber(session.commonFamiliarsGained)}`} color={COLORS.common} big />
      </Section>

      {/* Rare Familiars */}
      <Section title="✨  Familiares Raros" color={COLORS.rare}>
        <Row label="Inicio"  value={formatNumber(session.rareFamiliarsStart)} />
        <Row label="Fin"     value={formatNumber(session.rareFamiliarsEnd)} />
        <Row label="Ganados" value={`+${formatNumber(session.rareFamiliarsGained)}`} color={COLORS.rare} big />
      </Section>

      {/* Notes */}
      {session.notes ? (
        <Section title="📝  Notas" color={COLORS.textMuted}>
          <Text style={styles.notesText}>{session.notes}</Text>
        </Section>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => navigation.navigate('AddSession', { sessionId: session.id })}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={16} color={COLORS.error} />
          <Text style={styles.deleteBtnText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },

  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '600', textTransform: 'capitalize' },

  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: FONTS.md, fontWeight: '700', marginBottom: SPACING.md },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.textSecondary, fontSize: FONTS.md },
  rowValue: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '600' },
  rowValueBig: { fontSize: FONTS.xl, fontWeight: '800' },

  notesText: { color: COLORS.textSecondary, fontSize: FONTS.md, lineHeight: 22 },

  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: SPACING.md, borderRadius: RADIUS.lg, gap: SPACING.sm, borderWidth: 1,
  },
  editBtn: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryBorder },
  editBtnText: { color: COLORS.primary, fontSize: FONTS.lg, fontWeight: '700' },
  deleteBtn: { backgroundColor: COLORS.error + '18', borderColor: COLORS.error + '40' },
  deleteBtnText: { color: COLORS.error, fontSize: FONTS.lg, fontWeight: '700' },
});
