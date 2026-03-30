import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useProfile } from '../context/ProfileContext';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabId = 'home' | 'history' | 'stats';

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home',    label: 'Inicio',         icon: 'home-outline',        activeIcon: 'home' },
  { id: 'history', label: 'Historial',      icon: 'time-outline',        activeIcon: 'time' },
  { id: 'stats',   label: 'Estadísticas',   icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
];

export default function WebLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [refreshKey, setRefreshKey] = useState(0);
  const { activeProfile } = useProfile();
  const navigation = useNavigation<Nav>();

  // Re-mount the active screen when returning from modals so data refreshes
  useFocusEffect(useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []));

  return (
    <View style={styles.root}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <View style={styles.sidebar}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoLeaf}>🍁</Text>
          <View>
            <Text style={styles.logoTitle}>MapleGains</Text>
            {activeProfile && (
              <Text style={styles.logoSub} numberOfLines={1}>
                {activeProfile.gameClass ?? activeProfile.name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Nav items */}
        <View style={styles.navList}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              style={({ hovered }: { hovered?: boolean }) => [
                styles.navItem,
                hovered && styles.navItemHovered,
                activeTab === tab.id && styles.navItemActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={activeTab === tab.id ? tab.activeIcon : tab.icon}
                size={19}
                color={activeTab === tab.id ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.divider} />

        {/* Profile footer */}
        <Pressable
          style={({ hovered }: { hovered?: boolean }) => [styles.profileFooter, hovered && styles.navItemHovered]}
          onPress={() => navigation.navigate('Profiles')}
        >
          {activeProfile ? (
            <View style={[styles.avatar, { backgroundColor: activeProfile.color + '30', borderColor: activeProfile.color }]}>
              <Text style={[styles.avatarLetter, { color: activeProfile.color }]}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Ionicons name="person-circle-outline" size={30} color={COLORS.textMuted} />
          )}
          <Text style={styles.profileName} numberOfLines={1}>
            {activeProfile ? activeProfile.name : 'Perfiles'}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* ── Content area ────────────────────────────────────────── */}
      <View style={styles.content}>
        <View style={activeTab === 'home' ? styles.screenVisible : styles.screenHidden}>
          <HomeScreen key={activeTab === 'home' ? `home-${refreshKey}` : 'home'} />
        </View>
        <View style={activeTab === 'history' ? styles.screenVisible : styles.screenHidden}>
          <HistoryScreen key={activeTab === 'history' ? `history-${refreshKey}` : 'history'} />
        </View>
        <View style={activeTab === 'stats' ? styles.screenVisible : styles.screenHidden}>
          <StatsScreen key={activeTab === 'stats' ? `stats-${refreshKey}` : 'stats'} />
        </View>
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 210;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
  },

  // ── Sidebar ────────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: SPACING.lg,
    flexDirection: 'column',
  },

  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  logoLeaf: { fontSize: 28 },
  logoTitle: {
    color: COLORS.text,
    fontSize: FONTS.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  logoSub: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: '600',
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  navList: {
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemHovered: {
    backgroundColor: COLORS.card,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primaryBorder,
  },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    fontWeight: '500',
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  profileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: FONTS.md,
    fontWeight: '800',
  },
  profileName: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sm,
    fontWeight: '500',
  },

  // ── Content ────────────────────────────────────────────────────
  content: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenVisible: { flex: 1 },
  screenHidden:  { display: 'none' },
});
