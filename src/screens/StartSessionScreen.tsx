import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, OpenSession } from '../types';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { WC } from '../constants/themeWeb';
import { saveOpenSession, generateId, getOpenSession } from '../utils/storage';
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

export default function StartSessionScreen({ navigation, route }: Props) {
  const editing = route.params?.editing ?? false;
  const { activeProfile } = useProfile();

  const [existingSession, setExistingSession] = useState<OpenSession | null>(null);
  const [date, setDate] = useState(getTodayString());
  const [lvStart, setLvStart] = useState('');
  const [expStart, setExpStart] = useState('');
  const [fragsStart, setFragsStart] = useState('');
  const [nodesStart, setNodesStart] = useState('');
  const [mesosStart, setMesosStart] = useState('');
  const [commonStart, setCommonStart] = useState('');
  const [rareStart, setRareStart] = useState('');
  useEffect(() => {
    if (!editing) return;
    getOpenSession(activeProfile?.id).then((open) => {
      if (!open) return;
      setExistingSession(open);
      setDate(open.date);
      setLvStart(String(open.lvStart));
      setExpStart(String(open.expStart));
      setFragsStart(open.fragsStart > 0 ? String(open.fragsStart) : '');
      setNodesStart(open.nodesStart > 0 ? String(open.nodesStart) : '');
      setMesosStart(open.mesosStart > 0 ? String(open.mesosStart) : '');
      setCommonStart(open.commonFamiliarsStart > 0 ? String(open.commonFamiliarsStart) : '');
      setRareStart(open.rareFamiliarsStart > 0 ? String(open.rareFamiliarsStart) : '');
    });
  }, [editing, activeProfile?.id]);

  const pi = (v: string) => parseInt(v) || 0;
  const pf = (v: string) => parseFloat(v.replace(',', '.')) || 0;

  const handleSave = useCallback(async () => {
    if (!activeProfile) {
      Alert.alert('Sin perfil', 'Selecciona un perfil antes de iniciar una sesión.');
      return;
    }
    if (!lvStart || !expStart) {
      Alert.alert('Datos incompletos', 'Ingresa al menos el nivel y % de EXP inicial.');
      return;
    }

    const open: OpenSession = {
      id: existingSession?.id ?? generateId(),
      startedAt: existingSession?.startedAt ?? Date.now(),
      date,
      profileId: activeProfile.id,
      lvStart: pi(lvStart),
      expStart: pf(expStart),
      fragsStart: pi(fragsStart),
      nodesStart: pi(nodesStart),
      mesosStart: Number(mesosStart) || 0,
      commonFamiliarsStart: pi(commonStart),
      rareFamiliarsStart: pi(rareStart),
      notes: existingSession?.notes,
    };

    await saveOpenSession(open);
    navigation.goBack();
  }, [
    date, lvStart, expStart, fragsStart, nodesStart,
    mesosStart, commonStart, rareStart, activeProfile,
    existingSession,
  ]);

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
        {/* Date banner */}
        <View style={styles.dateBanner}>
          <Text style={styles.dateBannerLabel}>Fecha</Text>
          <Text style={styles.dateBannerValue}>{formatDateShort(date)}</Text>
        </View>

        {/* EXP */}
        <SectionHeader color={WC.exp} title="⚔️  Nivel y EXP — Inicio" />
        <View style={styles.section}>
          <View style={styles.row}>
            <NumInput label="Nivel" value={lvStart} onChange={setLvStart} placeholder="265" />
            <View style={styles.rowGap} />
            <NumInput label="% EXP" value={expStart} onChange={setExpStart} placeholder="0.00" decimal />
          </View>
        </View>

        {/* Frags */}
        <SectionHeader color={WC.frags} title="💎  Fragmentos — Inicio" />
        <View style={styles.section}>
          <NumInput label="Fragmentos" value={fragsStart} onChange={setFragsStart} />
        </View>

        {/* Nodes */}
        <SectionHeader color={WC.nodes} title="🔮  Nodos — Inicio" />
        <View style={styles.section}>
          <NumInput label="Nodos" value={nodesStart} onChange={setNodesStart} />
        </View>

        {/* Mesos */}
        <SectionHeader color={WC.mesos} title="💰  Mesos — Inicio" />
        <View style={styles.section}>
          <NumInput label="Mesos" value={mesosStart} onChange={setMesosStart} />
        </View>

        {/* Familiares Comunes */}
        <SectionHeader color={WC.common} title="👾  Fam. Comunes — Inicio" />
        <View style={styles.section}>
          <NumInput label="Familiares Comunes" value={commonStart} onChange={setCommonStart} />
        </View>

        {/* Familiares Raros */}
        <SectionHeader color={WC.rare} title="✨  Fam. Raros — Inicio" />
        <View style={styles.section}>
          <NumInput label="Familiares Raros" value={rareStart} onChange={setRareStart} />
        </View>

        {/* Action button */}
        <TouchableOpacity style={styles.startButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.startButtonText}>
            {editing ? '💾  Guardar Cambios' : '⚡  Iniciar Sesión'}
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
    paddingTop: 8,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center' as const,
  },

  dateBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WC.panelBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: WC.sep,
  },
  dateBannerLabel: { color: WC.textDim, fontSize: FONTS.sm },
  dateBannerValue: { color: WC.primary, fontSize: FONTS.md, fontWeight: '700' },

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
  startButton: {
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
  startButtonText: { color: '#fff', fontSize: FONTS.xl, fontWeight: '800' },
});
