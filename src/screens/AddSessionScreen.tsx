import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Session } from '../types';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { WC } from '../constants/themeWeb';
import { calculateExpGained, calculateTotalExpPercent } from '../utils/expCalculator';
import { addSession, updateSession, getSessionById, generateId } from '../utils/storage';
import { getTodayString, formatExp, formatNumber, formatPercent, formatDateShort } from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddSession'>;

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

function CalcBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.calcBadge, { borderColor: color + '40' }]}>
      <Text style={styles.calcBadgeLabel}>{label}</Text>
      <Text style={[styles.calcBadgeValue, { color }]}>{value}</Text>
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

export default function AddSessionScreen({ route, navigation }: Props) {
  const { activeProfile } = useProfile();
  const editId = route.params?.sessionId;
  const isEdit = Boolean(editId);

  const today = getTodayString();
  const [date, setDate] = useState(today);
  const [lvStart, setLvStart] = useState('');
  const [expStart, setExpStart] = useState('');
  const [lvEnd, setLvEnd] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [fragsStart, setFragsStart] = useState('');
  const [fragsEnd, setFragsEnd] = useState('');
  const [nodesStart, setNodesStart] = useState('');
  const [nodesEnd, setNodesEnd] = useState('');
  const [mesosStart, setMesosStart] = useState('');
  const [mesosEnd, setMesosEnd] = useState('');
  const [commonStart, setCommonStart] = useState('');
  const [commonEnd, setCommonEnd] = useState('');
  const [rareStart, setRareStart] = useState('');
  const [rareEnd, setRareEnd] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editId) {
      getSessionById(editId).then((s) => {
        if (!s) return;
        setDate(s.date);
        setLvStart(String(s.lvStart));
        setExpStart(String(s.expStart));
        setLvEnd(String(s.lvEnd));
        setExpEnd(String(s.expEnd));
        setFragsStart(String(s.fragsStart));
        setFragsEnd(String(s.fragsEnd));
        setNodesStart(String(s.nodesStart));
        setNodesEnd(String(s.nodesEnd));
        setMesosStart(String(s.mesosStart));
        setMesosEnd(String(s.mesosEnd));
        setCommonStart(String(s.commonFamiliarsStart));
        setCommonEnd(String(s.commonFamiliarsEnd));
        setRareStart(String(s.rareFamiliarsStart));
        setRareEnd(String(s.rareFamiliarsEnd));
        setNotes(s.notes ?? '');
      });
    }
  }, [editId]);

  const p = (v: string, fallback = 0) => parseFloat(v.replace(',', '.')) || fallback;
  const pi = (v: string, fallback = 0) => parseInt(v) || fallback;

  const expGained = calculateExpGained(
    pi(lvStart, 260), p(expStart),
    pi(lvEnd, pi(lvStart, 260)), p(expEnd)
  );
  const totalExpPct = calculateTotalExpPercent(
    pi(lvStart, 260), p(expStart),
    pi(lvEnd, pi(lvStart, 260)), p(expEnd)
  );
  const fragsGained = pi(fragsEnd) - pi(fragsStart);
  const nodesGained = pi(nodesEnd) - pi(nodesStart);
  const mesosGained = (Number(mesosEnd) || 0) - (Number(mesosStart) || 0);
  const commonGained = pi(commonEnd) - pi(commonStart);
  const rareGained = pi(rareEnd) - pi(rareStart);

  const handleSave = useCallback(async () => {
    if (!activeProfile) {
      Alert.alert('Sin perfil', 'Selecciona un perfil antes de guardar una sesión.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Fecha inválida', 'El formato debe ser YYYY-MM-DD.');
      return;
    }
    const [dy, dm, dd] = date.split('-').map(Number);
    const parsedDate = new Date(dy, dm - 1, dd);
    if (isNaN(parsedDate.getTime()) || parsedDate.getMonth() !== dm - 1) {
      Alert.alert('Fecha inválida', 'La fecha ingresada no existe.');
      return;
    }
    if (!lvStart || !expStart || !lvEnd || !expEnd) {
      Alert.alert('Datos incompletos', 'Ingresa nivel y % de EXP de inicio y fin.');
      return;
    }
    const lvS = pi(lvStart, 260);
    const lvE = pi(lvEnd, pi(lvStart, 260));
    if (lvS > lvE) {
      Alert.alert('Error', 'El nivel final no puede ser menor al inicial.');
      return;
    }
    if (lvS === lvE && p(expStart) > p(expEnd)) {
      Alert.alert('Error', 'El % final no puede ser menor al inicial en el mismo nivel.');
      return;
    }

    const session: Session = {
      id: editId ?? generateId(),
      date,
      createdAt: Date.now(),
      profileId: activeProfile.id,
      lvStart: lvS,
      expStart: p(expStart),
      lvEnd: lvE,
      expEnd: p(expEnd),
      expGainedActual: expGained,
      fragsStart: pi(fragsStart),
      fragsEnd: pi(fragsEnd),
      fragsGained,
      nodesStart: pi(nodesStart),
      nodesEnd: pi(nodesEnd),
      nodesGained,
      mesosStart: Number(mesosStart) || 0,
      mesosEnd: Number(mesosEnd) || 0,
      mesosGained,
      commonFamiliarsStart: pi(commonStart),
      commonFamiliarsEnd: pi(commonEnd),
      commonFamiliarsGained: commonGained,
      rareFamiliarsStart: pi(rareStart),
      rareFamiliarsEnd: pi(rareEnd),
      rareFamiliarsGained: rareGained,
      notes: notes.trim() || undefined,
    };

    if (isEdit) {
      await updateSession(session);
    } else {
      await addSession(session);
    }
    navigation.goBack();
  }, [
    date, lvStart, expStart, lvEnd, expEnd,
    fragsStart, fragsEnd, nodesStart, nodesEnd,
    mesosStart, mesosEnd, commonStart, commonEnd,
    rareStart, rareEnd, notes,
    expGained, fragsGained, nodesGained, mesosGained, commonGained, rareGained,
    isEdit, editId, activeProfile,
  ]);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Editar Sesión' : 'Nueva Sesión',
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} style={styles.headerSaveBtn}>
          <Text style={styles.headerSaveBtnText}>Guardar</Text>
        </TouchableOpacity>
      ),
    });
  }, [handleSave, isEdit]);

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
        {/* ── FECHA ─────────────────────────────── */}
        <SectionHeader color={WC.primary} title="📅  Fecha" />
        <View style={styles.section}>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateBtn, date === today && styles.dateBtnActive]}
              onPress={() => setDate(today)}
            >
              <Text style={[styles.dateBtnText, date === today && styles.dateBtnTextActive]}>Hoy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-03-24"
              placeholderTextColor={WC.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.inputHint}>{formatDateShort(date)}</Text>
          </View>
        </View>

        {/* ── NIVEL Y EXP ───────────────────────── */}
        <SectionHeader color={WC.exp} title="⚔️  Nivel y Experiencia" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Nivel Inicio" value={lvStart} onChange={setLvStart} placeholder="265" />
            <View style={styles.rowGap} />
            <NumInput label="Nivel Fin" value={lvEnd} onChange={setLvEnd} placeholder="265" />
          </View>
          <View style={styles.row}>
            <NumInput label="% EXP Inicio" value={expStart} onChange={setExpStart} placeholder="0.00" decimal />
            <View style={styles.rowGap} />
            <NumInput label="% EXP Fin" value={expEnd} onChange={setExpEnd} placeholder="0.00" decimal />
          </View>
          {(lvStart || lvEnd) && (expStart || expEnd) ? (
            <View style={styles.calcRow}>
              <CalcBadge label="EXP Ganada" value={formatExp(expGained)} color={WC.exp} />
              <CalcBadge label="% Total" value={`${formatPercent(totalExpPct)}%`} color={WC.primary} />
            </View>
          ) : null}
        </View>

        {/* ── FRAGMENTOS ────────────────────────── */}
        <SectionHeader color={WC.frags} title="💎  Fragmentos" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Inicio" value={fragsStart} onChange={setFragsStart} />
            <View style={styles.rowGap} />
            <NumInput label="Fin" value={fragsEnd} onChange={setFragsEnd} />
          </View>
          {(fragsStart || fragsEnd) ? (
            <View style={styles.calcRow}>
              <CalcBadge label="Ganados" value={`+${formatNumber(fragsGained)}`} color={WC.frags} />
            </View>
          ) : null}
        </View>

        {/* ── NODOS ─────────────────────────────── */}
        <SectionHeader color={WC.nodes} title="🔮  Nodos" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Inicio" value={nodesStart} onChange={setNodesStart} />
            <View style={styles.rowGap} />
            <NumInput label="Fin" value={nodesEnd} onChange={setNodesEnd} />
          </View>
          {(nodesStart || nodesEnd) ? (
            <View style={styles.calcRow}>
              <CalcBadge label="Ganados" value={`+${formatNumber(nodesGained)}`} color={WC.nodes} />
            </View>
          ) : null}
        </View>

        {/* ── MESOS ─────────────────────────────── */}
        <SectionHeader color={WC.mesos} title="💰  Mesos" />
        <View style={styles.section}>
          <NumInput label="Mesos Inicio" value={mesosStart} onChange={setMesosStart} />
          <NumInput label="Mesos Fin" value={mesosEnd} onChange={setMesosEnd} />
          {(mesosStart || mesosEnd) ? (
            <View style={styles.calcRow}>
              <CalcBadge label="Ganados" value={`+${formatExp(mesosGained)}`} color={WC.mesos} />
              <CalcBadge label="Exacto" value={formatNumber(mesosGained)} color={WC.textDim} />
            </View>
          ) : null}
        </View>

        {/* ── FAMILIARES COMUNES ────────────────── */}
        <SectionHeader color={WC.common} title="👾  Familiares Comunes" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Inicio" value={commonStart} onChange={setCommonStart} />
            <View style={styles.rowGap} />
            <NumInput label="Fin" value={commonEnd} onChange={setCommonEnd} />
          </View>
          {(commonStart || commonEnd) ? (
            <View style={styles.calcRow}>
              <CalcBadge label="Ganados" value={`+${formatNumber(commonGained)}`} color={WC.common} />
            </View>
          ) : null}
        </View>

        {/* ── FAMILIARES RAROS ──────────────────── */}
        <SectionHeader color={WC.rare} title="✨  Familiares Raros" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Inicio" value={rareStart} onChange={setRareStart} />
            <View style={styles.rowGap} />
            <NumInput label="Fin" value={rareEnd} onChange={setRareEnd} />
          </View>
          {(rareStart || rareEnd) ? (
            <View style={styles.calcRow}>
              <CalcBadge label="Ganados" value={`+${formatNumber(rareGained)}`} color={WC.rare} />
            </View>
          ) : null}
        </View>

        {/* ── NOTAS ─────────────────────────────── */}
        <SectionHeader color={WC.textMuted} title="📝  Notas (opcional)" />
        <View style={styles.section}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agrega notas..."
            placeholderTextColor={WC.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* ── GUARDAR ───────────────────────────── */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>
            {isEdit ? '✏️  Guardar Cambios' : '✅  Guardar Sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: WC.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center' as const,
  },

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
  inputHint: { color: WC.textMuted, fontSize: FONTS.xs, marginTop: 4 },
  notesInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },

  calcRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  calcBadge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  calcBadgeLabel: { color: WC.textMuted, fontSize: FONTS.xs, marginBottom: 2 },
  calcBadgeValue: { fontSize: FONTS.lg, fontWeight: '800' },

  dateRow: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.md },
  dateBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 44,
  },
  dateBtnActive: { borderColor: WC.primaryBorder, backgroundColor: WC.primaryDim },
  dateBtnText: { color: WC.textDim, fontSize: FONTS.md, fontWeight: '600' },
  dateBtnTextActive: { color: WC.primary },

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

  headerSaveBtn: { marginRight: 4, padding: SPACING.sm },
  headerSaveBtnText: { color: WC.primary, fontSize: FONTS.lg, fontWeight: '700' },
});
