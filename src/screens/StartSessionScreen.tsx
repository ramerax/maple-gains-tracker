import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, OpenSession } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { saveOpenSession, generateId } from '../utils/storage';
import { getTodayString, formatDateShort } from '../utils/formatters';
import { useProfile } from '../context/ProfileContext';

type Props = NativeStackScreenProps<RootStackParamList, 'StartSession'>;

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

export default function StartSessionScreen({ navigation }: Props) {
  const { activeProfile } = useProfile();

  const [date] = useState(getTodayString());
  const [lvStart, setLvStart] = useState('');
  const [expStart, setExpStart] = useState('');
  const [fragsStart, setFragsStart] = useState('');
  const [nodesStart, setNodesStart] = useState('');
  const [mesosStart, setMesosStart] = useState('');
  const [commonStart, setCommonStart] = useState('');
  const [rareStart, setRareStart] = useState('');
  const [notes, setNotes] = useState('');

  const pi = (v: string) => parseInt(v) || 0;
  const pf = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const handleStart = useCallback(async () => {
    if (!lvStart || !expStart) {
      Alert.alert('Datos incompletos', 'Ingresa al menos el nivel y % de EXP inicial.');
      return;
    }

    const open: OpenSession = {
      id: generateId(),
      date,
      startedAt: Date.now(),
      profileId: activeProfile?.id ?? 'default',
      lvStart: pi(lvStart),
      expStart: pf(expStart),
      fragsStart: pi(fragsStart),
      nodesStart: pi(nodesStart),
      mesosStart: Number(mesosStart) || 0,
      commonFamiliarsStart: pi(commonStart),
      rareFamiliarsStart: pi(rareStart),
      notes: notes.trim() || undefined,
    };

    await saveOpenSession(open);
    navigation.goBack();
  }, [
    date, lvStart, expStart, fragsStart, nodesStart,
    mesosStart, commonStart, rareStart, notes, activeProfile,
  ]);

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
        {/* Date banner */}
        <View style={styles.dateBanner}>
          <Text style={styles.dateBannerLabel}>Fecha</Text>
          <Text style={styles.dateBannerValue}>{formatDateShort(date)}</Text>
        </View>

        {/* EXP */}
        <SectionHeader color={COLORS.exp} title="⚔️  Nivel y EXP — Inicio" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Nivel" value={lvStart} onChange={setLvStart} placeholder="265" />
            <View style={styles.rowGap} />
            <NumInput label="% EXP" value={expStart} onChange={setExpStart} placeholder="0.00" decimal />
          </View>
        </View>

        {/* Frags */}
        <SectionHeader color={COLORS.frags} title="💎  Fragmentos — Inicio" />
        <View style={styles.section}>
          <NumInput label="Fragmentos" value={fragsStart} onChange={setFragsStart} />
        </View>

        {/* Nodes */}
        <SectionHeader color={COLORS.nodes} title="🔮  Nodos — Inicio" />
        <View style={styles.section}>
          <NumInput label="Nodos" value={nodesStart} onChange={setNodesStart} />
        </View>

        {/* Mesos */}
        <SectionHeader color={COLORS.mesos} title="💰  Mesos — Inicio" />
        <View style={styles.section}>
          <NumInput label="Mesos" value={mesosStart} onChange={setMesosStart} />
        </View>

        {/* Familiares Comunes */}
        <SectionHeader color={COLORS.common} title="👾  Fam. Comunes — Inicio" />
        <View style={styles.section}>
          <NumInput label="Familiares Comunes" value={commonStart} onChange={setCommonStart} />
        </View>

        {/* Familiares Raros */}
        <SectionHeader color={COLORS.rare} title="✨  Fam. Raros — Inicio" />
        <View style={styles.section}>
          <NumInput label="Familiares Raros" value={rareStart} onChange={setRareStart} />
        </View>

        {/* Notas */}
        <SectionHeader color={COLORS.textMuted} title="📝  Notas (opcional)" />
        <View style={styles.section}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agrega notas..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Start button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startButtonText}>⚡  Iniciar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 48 },

  dateBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateBannerLabel: { color: COLORS.textMuted, fontSize: FONTS.sm },
  dateBannerValue: { color: COLORS.primary, fontSize: FONTS.md, fontWeight: '700' },

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
  notesInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.sm },

  startButton: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  startButtonText: { color: '#000', fontSize: FONTS.xl, fontWeight: '800' },
});
