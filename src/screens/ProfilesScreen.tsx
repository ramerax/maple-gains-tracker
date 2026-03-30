import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import { addProfile, updateProfile, deleteProfile, generateId } from '../utils/storage';
import { Profile } from '../types';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

const PROFILE_COLORS = [
  '#FF8C00',
  '#FFB347',
  '#FFD700',
  '#FF4444',
  '#4A9EFF',
  '#50C878',
];

interface FormState {
  name: string;
  gameClass: string;
  server: string;
  color: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  gameClass: '',
  server: '',
  color: PROFILE_COLORS[0],
};

function ProfileAvatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '30', borderColor: color },
      ]}
    >
      <Text style={[styles.avatarLetter, { color, fontSize: size * 0.45 }]}>{letter}</Text>
    </View>
  );
}

export default function ProfilesScreen() {
  const { profiles, activeProfileId, setActiveProfile, refreshProfiles } = useProfile();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = useCallback(() => {
    setEditingProfile(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((profile: Profile) => {
    setEditingProfile(profile);
    setForm({
      name: profile.name,
      gameClass: profile.gameClass ?? '',
      server: profile.server ?? '',
      color: profile.color,
    });
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = form.name.trim();
    if (!trimmed) {
      Alert.alert('Campo requerido', 'El nombre del personaje es obligatorio.');
      return;
    }

    if (editingProfile) {
      const updated: Profile = {
        ...editingProfile,
        name: trimmed,
        gameClass: form.gameClass.trim() || undefined,
        server: form.server.trim() || undefined,
        color: form.color,
      };
      await updateProfile(updated);
    } else {
      const newProfile: Profile = {
        id: generateId(),
        name: trimmed,
        gameClass: form.gameClass.trim() || undefined,
        server: form.server.trim() || undefined,
        color: form.color,
        createdAt: Date.now(),
      };
      await addProfile(newProfile);
    }

    await refreshProfiles();
    setModalVisible(false);
  }, [form, editingProfile, refreshProfiles]);

  const handleDelete = useCallback(
    (profile: Profile) => {
      if (profiles.length <= 1) {
        Alert.alert('No se puede eliminar', 'Debes tener al menos un perfil.');
        return;
      }
      Alert.alert(
        'Eliminar perfil',
        `¿Eliminar "${profile.name}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await deleteProfile(profile.id);
              // If deleted the active profile, switch to first remaining
              if (profile.id === activeProfileId) {
                const remaining = profiles.filter((p) => p.id !== profile.id);
                if (remaining.length > 0) {
                  await setActiveProfile(remaining[0].id);
                }
              }
              await refreshProfiles();
            },
          },
        ]
      );
    },
    [profiles, activeProfileId, setActiveProfile, refreshProfiles]
  );

  const renderItem = useCallback(
    ({ item }: { item: Profile }) => {
      const isActive = item.id === activeProfileId;
      return (
        <View style={[styles.profileCard, isActive && styles.profileCardActive]}>
          <ProfileAvatar name={item.name} color={item.color} size={46} />
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{item.name}</Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                  <Text style={styles.activeBadgeText}>Activo</Text>
                </View>
              )}
            </View>
            {(item.gameClass || item.server) ? (
              <Text style={styles.profileSub}>
                {[item.gameClass, item.server].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
          <View style={styles.profileActions}>
            {!isActive && (
              <TouchableOpacity
                style={styles.activateBtn}
                onPress={() => setActiveProfile(item.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.activateBtnText}>Activar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => openEdit(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleDelete(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [activeProfileId, setActiveProfile, openEdit, handleDelete]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <FlatList
        data={profiles}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {profiles.length} perfil{profiles.length !== 1 ? 'es' : ''}
          </Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProfile ? 'Editar Perfil' : 'Nuevo Perfil'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBody}
            >
              {/* Name */}
              <Text style={styles.fieldLabel}>Nombre del personaje *</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Ej: MiKain2024"
                placeholderTextColor={COLORS.textMuted}
                maxLength={30}
              />

              {/* Class */}
              <Text style={styles.fieldLabel}>Clase (opcional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.gameClass}
                onChangeText={(v) => setForm((f) => ({ ...f, gameClass: v }))}
                placeholder="Ej: Kain, Adele, Bowmaster..."
                placeholderTextColor={COLORS.textMuted}
                maxLength={30}
              />

              {/* Server */}
              <Text style={styles.fieldLabel}>Servidor (opcional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.server}
                onChangeText={(v) => setForm((f) => ({ ...f, server: v }))}
                placeholder="Ej: Reboot, Bera, Scania..."
                placeholderTextColor={COLORS.textMuted}
                maxLength={30}
              />

              {/* Color picker */}
              <Text style={styles.fieldLabel}>Color del avatar</Text>
              <View style={styles.colorRow}>
                {PROFILE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      form.color === c && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, color: c }))}
                    activeOpacity={0.8}
                  >
                    {form.color === c && (
                      <Ionicons name="checkmark" size={18} color="#000" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              <View style={styles.previewRow}>
                <ProfileAvatar
                  name={form.name || '?'}
                  color={form.color}
                  size={48}
                />
                <View style={styles.previewDetails}>
                  <Text style={[styles.previewName, { color: form.color }]}>
                    {form.name.trim() || 'Nombre del personaje'}
                  </Text>
                  {(form.gameClass || form.server) ? (
                    <Text style={styles.previewSub}>
                      {[form.gameClass, form.server].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>
                  {editingProfile ? 'Guardar Cambios' : 'Crear Perfil'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  listHeader: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  profileCardActive: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.cardHighlight,
  },

  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarLetter: { fontWeight: '800' },

  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  profileName: { color: COLORS.text, fontSize: FONTS.lg, fontWeight: '700' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  activeBadgeText: { color: COLORS.primary, fontSize: FONTS.xs, fontWeight: '700' },
  profileSub: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 2 },

  profileActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  activateBtn: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activateBtnText: { color: COLORS.primary, fontSize: FONTS.xs, fontWeight: '700' },
  iconBtn: {
    padding: SPACING.sm,
  },

  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.text, fontSize: FONTS.xl, fontWeight: '700' },
  modalClose: { padding: SPACING.sm },
  modalBody: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: SPACING.md,
  },
  fieldInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: FONTS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },

  colorRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewDetails: { marginLeft: SPACING.md },
  previewName: { fontSize: FONTS.lg, fontWeight: '700' },
  previewSub: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 2 },

  saveBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  saveBtnText: { color: '#000', fontSize: FONTS.xl, fontWeight: '800' },
});
