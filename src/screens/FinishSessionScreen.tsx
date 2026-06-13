import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Session, OpenSession } from '../types';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { WC } from '../constants/themeWeb';
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
        placeholderTextColor={WC.textMuted}
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
    <View style={[styles.gainBadge, { borderColor: color + '40' }]}>
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

  const [notes, setNotes] = useState('');

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
    });
  }, [activeProfileId, navigation]);

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
      notes: notes.trim() || open.notes || undefined,
    };

    await addSession(session);
    await deleteOpenSession(open.profileId);
    navigation.goBack();
  }, [
    open, lvEnd, expEnd, fragsEnd, nodesEnd, mesosEnd,
    commonEnd, rareEnd, expGained, fragsGained, nodesGained,
    mesosGained, commonGained, rareGained, notes,
  ]);

  if (!open) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
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
        <SectionHeader color={WC.exp} title="⚔️  Nivel y EXP — Fin" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Nivel" value={lvEnd} onChange={setLvEnd} placeholder={String(open.lvStart)} />
            <View style={styles.rowGap} />
            <NumInput label="% EXP" value={expEnd} onChange={setExpEnd} placeholder={String(open.expStart)} decimal />
          </View>
          <View style={styles.gainRow}>
            <GainBadge label="EXP Ganada" value={formatExp(expGained)} color={WC.exp} />
            {lvEndN > open.lvStart && (
              <GainBadge label="Niveles" value={`+${lvEndN - open.lvStart}`} color={WC.primary} />
            )}
          </View>
        </View>

        {/* Frags end */}
        <SectionHeader color={WC.frags} title="💎  Fragmentos — Fin" />
        <View style={styles.section}>
          <NumInput label="Fragmentos" value={fragsEnd} onChange={setFragsEnd} placeholder={String(open.fragsStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${formatNumber(fragsGained)}`} color={WC.frags} />
          </View>
        </View>

        {/* Nodes end */}
        <SectionHeader color={WC.nodes} title="🔮  Nodos — Fin" />
        <View style={styles.section}>
          <NumInput label="Nodos" value={nodesEnd} onChange={setNodesEnd} placeholder={String(open.nodesStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${formatNumber(nodesGained)}`} color={WC.nodes} />
          </View>
        </View>

        {/* Mesos end */}
        <SectionHeader color={WC.mesos} title="💰  Mesos — Fin" />
        <View style={styles.section}>
          <NumInput label="Mesos" value={mesosEnd} onChange={setMesosEnd} placeholder={String(open.mesosStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${formatExp(mesosGained)}`} color={WC.mesos} />
          </View>
        </View>

        {/* Common familiars end */}
        <SectionHeader color={WC.common} title="👾  Fam. Comunes — Fin" />
        <View style={styles.section}>
          <NumInput label="Familiares Comunes" value={commonEnd} onChange={setCommonEnd} placeholder={String(open.commonFamiliarsStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${commonGained}`} color={WC.common} />
          </View>
        </View>

        {/* Rare familiars end */}
        <SectionHeader color={WC.rare} title="✨  Fam. Raros — Fin" />
        <View style={styles.section}>
          <NumInput label="Familiares Raros" value={rareEnd} onChange={setRareEnd} placeholder={String(open.rareFamiliarsStart)} />
          <View style={styles.gainRow}>
            <GainBadge label="Ganados" value={`+${rareGained}`} color={WC.rare} />
          </View>
        </View>

        {/* Notas */}
        <SectionHeader color={WC.textMuted} title="📝  Notas (opcional)" />
        <View style={styles.section}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agrega notas sobre la sesión..."
            placeholderTextColor={WC.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: WC.bg },
  loadingText: { color: WC.textMuted, fontSize: FONTS.md },
  keyboardView: { flex: 1, backgroundColor: WC.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center' as const,
  },

  startSummary: {
    backgroundColor: WC.primaryDim,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
    borderLeftWidth: 3,
    borderLeftColor: WC.primary,
  },
  startSummaryTitle: {
    color: WC.primary,
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
    borderBottomColor: WC.sep,
  },
  startRowLabel: { color: WC.textDim, fontSize: FONTS.sm },
  startRowValue: { color: WC.textDim, fontSize: FONTS.sm, fontWeight: '600' },

  sectionHeader: {
    borderLeftWidth: 3,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: SPACING.lg,
  },
  sectionHeaderText: { color: WC.text, fontSize: FONTS.md, fontWeight: '700' },

  section: {
    backgroundColor: WC.panelBg,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  row: { flexDirection: 'row', paddingTop: SPACING.md },
  rowGap: { width: SPACING.md },

  inputGroup: { flex: 1, paddingTop: SPACING.md },
  inputLabel: { color: WC.textDim, fontSize: FONTS.sm, marginBottom: 5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    color: WC.text,
    fontSize: FONTS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },

  notesInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },

  gainRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  gainBadge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  gainBadgeLabel: { color: WC.textMuted, fontSize: FONTS.xs, marginBottom: 2 },
  gainBadgeValue: { fontSize: FONTS.lg, fontWeight: '800' },

  saveButton: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
    backgroundColor: WC.btn,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: WC.btnGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  saveButtonText: { color: '#fff', fontSize: FONTS.xl, fontWeight: '800' },
});
