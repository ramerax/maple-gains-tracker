import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import { WC } from '../constants/themeWeb';
import { RootStackParamList } from '../types';
import { useProfile } from '../context/ProfileContext';
import { getOpenSession } from '../utils/storage';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabId = 'home' | 'history' | 'stats';

const TABS: {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'home',    label: 'Inicio',       icon: 'home-outline',        activeIcon: 'home' },
  { id: 'history', label: 'Historial',    icon: 'time-outline',        activeIcon: 'time' },
  { id: 'stats',   label: 'Estadísticas', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
];

// Pulsing dot component for active session indicator
function PulsingDot() {
  const opacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.pulsingDot, { opacity }]} />
  );
}

export default function WebLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set(['home']));
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasOpenSession, setHasOpenSession] = useState(false);
  const { activeProfile, activeProfileId } = useProfile();
  const navigation = useNavigation<Nav>();

  // Lazy mount: only mount a tab the first time it's visited
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setMountedTabs((prev) => new Set([...prev, tab]));
  }, []);

  // Re-mount active screen & check session on focus
  useFocusEffect(useCallback(() => {
    setRefreshKey((k) => k + 1);
    getOpenSession(activeProfileId ?? undefined).then((s) => setHasOpenSession(!!s));
  }, [activeProfileId]));

  // Poll for open session changes (e.g. when returning from StartSession modal)
  useEffect(() => {
    const interval = setInterval(() => {
      getOpenSession(activeProfileId ?? undefined).then((s) => setHasOpenSession(!!s));
    }, 3000);
    return () => clearInterval(interval);
  }, [activeProfileId]);

  return (
    <View style={styles.root}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <View style={styles.sidebar}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoLeaf}>🍁</Text>
          <View style={styles.logoTextBlock}>
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
            const showDot = tab.id === 'home' && hasOpenSession;
            return (
              <Pressable
                key={tab.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={(state: any) => [
                  styles.navItem,
                  state.hovered && !isActive && styles.navItemHovered,
                  isActive && styles.navItemActive,
                ]}
                onPress={() => handleTabChange(tab.id)}
              >
                <View style={[styles.navAccent, isActive && styles.navAccentActive]} />
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={18}
                  color={isActive ? WC.primary : WC.textMuted}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
                {showDot && <PulsingDot />}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* Nueva Sesión CTA in sidebar */}
        {!hasOpenSession && (
          <Pressable
            style={styles.sidebarNewBtn}
            onPress={() => navigation.navigate('StartSession')}
          >
            <Ionicons name="add-circle" size={15} color="#fff" />
            <Text style={styles.sidebarNewBtnText}>Nueva Sesión</Text>
          </Pressable>
        )}

        {/* Active session pill in sidebar */}
        {hasOpenSession && (
          <Pressable
            style={styles.sidebarSessionPill}
            onPress={() => { handleTabChange('home'); }}
          >
            <View style={styles.sidebarSessionDot} />
            <Text style={styles.sidebarSessionText}>Sesión activa</Text>
            <Ionicons name="chevron-forward" size={11} color={WC.primary} />
          </Pressable>
        )}

        <View style={styles.divider} />

        {/* Profile footer */}
        <Pressable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={(state: any) => [styles.profileFooter, state.hovered && styles.profileFooterHovered]}
          onPress={() => navigation.navigate('Profiles')}
        >
          {activeProfile ? (
            <View style={[styles.avatar, { backgroundColor: activeProfile.color + '22', borderColor: activeProfile.color + '80' }]}>
              <Text style={[styles.avatarLetter, { color: activeProfile.color }]}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Ionicons name="person-circle-outline" size={30} color={WC.textMuted} />
          )}
          <Text style={styles.profileName} numberOfLines={1}>
            {activeProfile ? activeProfile.name : 'Perfiles'}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={WC.textMuted} />
        </Pressable>
      </View>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <View style={styles.content}>
        {mountedTabs.has('home') && (
          <View style={activeTab === 'home' ? styles.screenVisible : styles.screenHidden}>
            <HomeScreen key={activeTab === 'home' ? `home-${refreshKey}` : 'home'} />
          </View>
        )}
        {mountedTabs.has('history') && (
          <View style={activeTab === 'history' ? styles.screenVisible : styles.screenHidden}>
            <HistoryScreen key={activeTab === 'history' ? `history-${refreshKey}` : 'history'} />
          </View>
        )}
        {mountedTabs.has('stats') && (
          <View style={activeTab === 'stats' ? styles.screenVisible : styles.screenHidden}>
            <StatsScreen key={activeTab === 'stats' ? `stats-${refreshKey}` : 'stats'} />
          </View>
        )}
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 220;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: WC.bg,
  },

  // ── Sidebar ──────────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRightWidth: 1,
    borderRightColor: WC.panelBorder,
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
  logoTextBlock: { flex: 1 },
  logoLeaf: { fontSize: 28 },
  logoTitle: {
    color: WC.text,
    fontSize: FONTS.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoSub: {
    color: WC.primary,
    fontSize: FONTS.xs,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.85,
  },

  divider: {
    height: 1,
    backgroundColor: WC.sep,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },

  navList: {
    gap: 2,
    paddingHorizontal: SPACING.xs,
    paddingTop: SPACING.xs,
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
  navAccentActive: { backgroundColor: WC.primary },
  navItemHovered: { backgroundColor: 'rgba(255,255,255,0.05)' },
  navItemActive: { backgroundColor: WC.primaryDim },
  navLabel: {
    color: WC.textMuted,
    fontSize: FONTS.md,
    fontWeight: '500',
    flex: 1,
  },
  navLabelActive: { color: WC.primary, fontWeight: '700' },

  // Pulsing dot
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: WC.exp,
    shadowColor: WC.exp,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  // Sidebar CTA button
  sidebarNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: WC.btn,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    shadowColor: WC.btnGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  sidebarNewBtnText: {
    color: '#fff',
    fontSize: FONTS.sm,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Active session pill in sidebar
  sidebarSessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: WC.primaryDim,
    borderWidth: 1,
    borderColor: WC.primaryBorder,
    borderRadius: RADIUS.lg,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  sidebarSessionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: WC.primary,
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  sidebarSessionText: {
    flex: 1,
    color: WC.primary,
    fontSize: FONTS.xs,
    fontWeight: '700',
  },

  // Profile footer
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
    borderColor: WC.panelBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  profileFooterHovered: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: WC.primaryBorder,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: FONTS.md, fontWeight: '800' },
  profileName: {
    flex: 1,
    color: WC.textDim,
    fontSize: FONTS.sm,
    fontWeight: '600',
  },

  // ── Content ───────────────────────────────────────────────────────
  content: {
    flex: 1,
    backgroundColor: WC.bg,
  },
  screenVisible: { flex: 1 },
  screenHidden: { display: 'none' },
});
