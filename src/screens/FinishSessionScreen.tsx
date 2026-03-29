import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Session, OpenSession } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { calculateExpGained } from '../utils/expCalculator';
import { addSession, getOpenSession, deleteOpenSession, generateId } from '../utils/storage';
import { useProfile } from '../context/ProfileContext';
import { formatExp, formatNumber, formatPercent } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'FinishSession'>;

function NumInput({ label, value, onChange, placeholder, decimal }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; decimal?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? '0'}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
      />
    </View>
  );
}

function SectionHeader({ color, title }: { color: string; title: string }) {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function GainBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.gainBadge, { borderColor: color + '30' }]}>
      <Text style={styles.gainBadgeLabel}>{label}</Text>
      <Text style={[styles.gainBadgeValue, { color }]}>{value}</Text>
    </View>
  );
}

function StartRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.startRow}>
      <Text style={styles.startRowLabel}>{label}</Text>
      <Text style={styles.startRowValue}>{value}</Text>
    </View>
  );
}

export default function FinishSessionScreen({ navigation }: Props) {
  const { activeProfileId } = useProfile();
  const [open, setOpen] = useState<OpenSession | null>(null);

  const [lvEnd, setLvEnd] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [fragsEnd, setFragsEnd] = useState('');
  const [nodesEnd, setNodesEnd] = useState('');
  const [mesosEnd, setMesosEnd] = useState('');
  const [commonEnd, setCommonEnd] = useState('');
  const [rareEnd, setRareEnd] = useState('');

  useEffect(() => {
    getOpenSession(activeProfileId ?? undefined).then((s) => {
      if (!s) {
        Alert.alert('Sin sesión activa', 'No hay ninguna sesión en progreso.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setOpen(s);
      // Leave end fields empty — placeholders show start values as reference
    });
  }, []);

  const pi = (v: string) => parseInt(v) || 0;
  const pf = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const lvEndN = pi(lvEnd) || open?.lvStart || 260;
  const expEndN = pf(expEnd);
  const expGained = open
    ? calculateExpGained(open.lvStart, open.expStart, lvEndN, expEndN)
    : 0;
  const fragsGained  = fragsEnd  ? pi(fragsEnd)  - (open?.fragsStart  ?? 0) : 0;
  const nodesGained  = nodesEnd  ? pi(nodesEnd)  - (open?.nodesStart  ?? 0) : 0;
  const mesosGained  = mesosEnd  ? (Number(mesosEnd) || 0) - (open?.mesosStart  ?? 0) : 0;
  const commonGained = commonEnd ? pi(commonEnd) - (open?.commonFamiliarsStart ?? 0) : 0;
  const rareGained   = rareEnd   ? pi(rareEnd)   - (open?.rareFamiliarsStart  ?? 0) : 0;

  const handleSave = useCallback(async () => {
    if (!open) return;
    if (!expEnd) {
      Alert.alert('Datos incompletos', 'Ingresa el % de EXP al finalizar la sesión.');
      return;
    }
    const lvS = open.lvStart;
    const lvE = lvEndN;
    if (lvS > lvE) {
      Alert.alert('Error', 'El nivel final no puede ser menor al inicial.');
      return;
    }
    if (lvS === lvE && open.expStart > expEndN) {
      Alert.alert('Error', 'El % final no puede ser menor al inicial en el mismo nivel.');
      return;
    }

    const session: Session = {
      id: generateId(),
      date: open.date,
      createdAt: open.startedAt,
      profileId: open.profileId,
      lvStart: open.lvStart,
      expStart: open.expStart,
      lvEnd: lvE,
      expEnd: expEndN,
      expGainedActual: expGained,
      fragsStart: open.fragsStart,
      fragsEnd: fragsEnd ? pi(fragsEnd) : open.fragsStart,
      fragsGained,
      nodesStart: open.nodesStart,
      nodesEnd: nodesEnd ? pi(nodesEnd) : open.nodesStart,
      nodesGained,
      mesosStart: open.mesosStart,
      mesosEnd: mesosEnd ? (Number(mesosEnd) || 0) : open.mesosStart,
      mesosGained,
      commonFamiliarsStart: open.commonFamiliarsStart,
      commonFamiliarsEnd: commonEnd ? pi(commonEnd) : open.commonFamiliarsStart,
      commonFamiliarsGained: commonGained,
      rareFamiliarsStart: open.rareFamiliarsStart,
      rareFamiliarsEnd: rareEnd ? pi(rareEnd) : open.rareFamiliarsStart,
      rareFamiliarsGained: rareGained,
      notes: open.notes,
    };

    await addSession(session);
    await deleteOpenSession(open.profileId);
    navigation.goBack();
  }, [
    open, lvEnd, expEnd, fragsEnd, nodesEnd, mesosEnd,
    commonEnd, rareEnd, expGained, fragsGained, nodesGained,
    mesosGained, commonGained, rareGained,
  ]);

  if (!open) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: COLORS.textMuted }}>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Start data summary */}
        <View style={styles.startSummary}>
          <Text style={styles.startSummaryTitle}>📌 Datos de Inicio</Text>
          <StartRow label="Nivel" value={`${open.lvStart}  (${formatPercent(open.expStart)}%)`} />
          <StartRow label="Fragmentos" value={formatNumber(open.fragsStart)} />
          <StartRow label="Nodos" value={formatNumber(open.nodesStart)} />
          <StartRow label="Mesos" value={formatExp(open.mesosStart)} />
          <StartRow label="Fam. Comunes" value={formatNumber(open.commonFamiliarsStart)} />
          <StartRow label="Fam. Raros" value={formatNumber(open.rareFamiliarsStart)} />
        </View>

        {/* EXP end */}
        <SectionHeader color={COLORS.exp} title="⚔️  Nivel y EXP — Fin" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Nivel" value={lvEnd} onChange={setLvEnd} placeholder={String(open.lvStart)} />
            <View style={styles.rowGap} />
            <NumInput label="% EXP" value={expEnd} onChange={setExpEnd} placeholder={String(open.expStart)} decimal />
          </View>
          <View style={styles.gainRow}>
            <GainBadge label="EXP Ganada" value={formatExp(expGained)} color={COLORS.exp} />
            {lvEndN > open.lvStart && (
              <GainBadge label="Niveles" value={`+${lvEndN - open.lvStart}`} color={COLORS.primary} />
            )}
          </View>
        </View>

        {/* Frags end */}
        <SectionHeader color={COLORS.frags} title="💎  Fragmentos — Fin" />
        <View style={styles.section}>
          <NumInput label="Fragmentos" value={fragsEnd} onChange={setFragsEnd} placeholder={String(open.fragsStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${formatNumber(fragsGained)}`} color={COLORS.frags} />
          </View>
        </View>

        {/* Nodes end */}
        <SectionHeader color={COLORS.nodes} title="🔮  Nodos — Fin" />
        <View style={styles.section}>
          <NumInput label="Nodos" value={nodesEnd} onChange={setNodesEnd} placeholder={String(open.nodesStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${formatNumber(nodesGained)}`} color={COLORS.nodes} />
          </View>
        </View>

        {/* Mesos end */}
        <SectionHeader color={COLORS.mesos} title="💰  Mesos — Fin" />
        <View style={styles.section}>
          <NumInput label="Mesos" value={mesosEnd} onChange={setMesosEnd} placeholder={String(open.mesosStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${formatExp(mesosGained)}`} color={COLORS.mesos} />
          </View>
        </View>

        {/* Common familiars end */}
        <SectionHeader color={COLORS.common} title="👾  Fam. Comunes — Fin" />
        <View style={styles.section}>
          <NumInput label="Familiares Comunes" value={commonEnd} onChange={setCommonEnd} placeholder={String(open.commonFamiliarsStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${commonGained}`} color={COLORS.common} />
          </View>
        </View>

        {/* Rare familiars end */}
        <SectionHeader color={COLORS.rare} title="✨  Fam. Raros — Fin" />
        <View style={styles.section}>
          <NumInput label="Familiares Raros" value={rareEnd} onChange={setRareEnd} placeholder={String(open.rareFamiliarsStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${rareGained}`} color={COLORS.rare} />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>✅  Guardar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  startSummary: {
    backgroundColor: COLORS.card,
    marginBottom: 0,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  startSummaryTitle: {
    color: COLORS.primary,
    fontSize: FONTS.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  startRowLabel: { color: COLORS.textMuted, fontSize: FONTS.sm },
  startRowValue: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: '600' },

  sectionHeader: {
    borderLeftWidth: 3,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.md,
  },
  sectionHeaderText: { color: COLORS.text, fontSize: FONTS.md, fontWeight: '700' },

  section: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  row: { flexDirection: 'row', paddingTop: SPACING.md },
  rowGap: { width: SPACING.md },

  inputGroup: { flex: 1, paddingTop: SPACING.md },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginBottom: 5 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: FONTS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },

  gainRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  gainBadge: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  gainBadgeLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, marginBottom: 2 },
  gainBadgeValue: { fontSize: FONTS.lg, fontWeight: '800' },

  saveButton: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  saveButtonText: { color: '#000', fontSize: FONTS.xl, fontWeight: '800' },
});
