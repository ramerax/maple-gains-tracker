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
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={(state: any) => [
                  styles.navItem,
                  state.hovered && !isActive && styles.navItemHovered,
                  isActive && styles.navItemActive,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                {/* Active left-border accent */}
                <View style={[styles.navAccent, isActive && styles.navAccentActive]} />
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={18}
                  color={isActive ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.divider} />

        {/* Profile footer */}
        <Pressable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={(state: any) => [styles.profileFooter, state.hovered && styles.navItemHovered]}
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

const SIDEBAR_WIDTH = 220;

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
  logoLeaf: { fontSize: 30 },
  logoTitle: {
    color: COLORS.text,
    fontSize: FONTS.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoSub: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.9,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  navList: {
    gap: 2,
    paddingHorizontal: SPACING.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  navAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  navAccentActive: {
    backgroundColor: COLORS.primary,
  },
  navItemHovered: {
    backgroundColor: COLORS.card,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryDim,
  },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.md,
    fontWeight: '500',
    flex: 1,
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    color: COLORS.text,
    fontSize: FONTS.sm,
    fontWeight: '600',
  },

  // ── Content ────────────────────────────────────────────────────
  content: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenVisible: { flex: 1 },
  screenHidden:  { display: 'none' },
});
