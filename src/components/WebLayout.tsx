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

function PulsingDot() {
  const opacity = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);
  return <Animated.View style={[styles.pulsingDot, { opacity }]} />;
}

export default function WebLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set(['home']));
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasOpenSession, setHasOpenSession] = useState(false);
  const { activeProfile, activeProfileId } = useProfile();
  const navigation = useNavigation<Nav>();

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setMountedTabs((prev) => new Set([...prev, tab]));
  }, []);

  useFocusEffect(useCallback(() => {
    setRefreshKey((k) => k + 1);
    getOpenSession(activeProfileId ?? undefined).then((s) => setHasOpenSession(!!s));
  }, [activeProfileId]));

  useEffect(() => {
    const interval = setInterval(() => {
      getOpenSession(activeProfileId ?? undefined).then((s) => setHasOpenSession(!!s));
    }, 3000);
    return () => clearInterval(interval);
  }, [activeProfileId]);

  return (
    <View style={styles.root}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <View style={styles.sidebar}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIconWrap}>
            <Text style={styles.logoLeaf}>🍁</Text>
          </View>
          <View style={styles.logoTextBlock}>
            <Text style={styles.logoTitle}>MapleGains</Text>
            {activeProfile && (
              <Text style={styles.logoSub} numberOfLines={1}>
                {activeProfile.gameClass ?? activeProfile.server ?? 'Tracker'}
              </Text>
            )}
          </View>
        </View>

        {/* Nav section label */}
        <Text style={styles.navSectionLabel}>MENÚ</Text>

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
                {isActive && <View style={styles.navAccentBar} />}
                <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={16}
                    color={isActive ? WC.primary : WC.textMuted}
                  />
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
                {showDot && <PulsingDot />}
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* Nueva Sesión CTA */}
        {!hasOpenSession && (
          <Pressable
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={(state: any) => [styles.sidebarNewBtn, state.hovered && styles.sidebarNewBtnHover]}
            onPress={() => navigation.navigate('StartSession')}
          >
            <View style={styles.sidebarNewBtnInner}>
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.sidebarNewBtnText}>Nueva Sesión</Text>
            </View>
          </Pressable>
        )}

        {/* Active session pill */}
        {hasOpenSession && (
          <Pressable
            style={styles.sidebarSessionPill}
            onPress={() => handleTabChange('home')}
          >
            <PulsingDot />
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
            <View style={[styles.avatar, { backgroundColor: activeProfile.color + '28', borderColor: activeProfile.color + '90' }]}>
              <Text style={[styles.avatarLetter, { color: activeProfile.color }]}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Ionicons name="person-circle-outline" size={30} color={WC.textMuted} />
          )}
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName} numberOfLines={1}>
              {activeProfile ? activeProfile.name : 'Perfiles'}
            </Text>
            {activeProfile?.server && (
              <Text style={styles.profileServer} numberOfLines={1}>{activeProfile.server}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={12} color={WC.textFaint} />
        </Pressable>
      </View>

      {/* ── Content ──────────────────────────────────────────── */}
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

const SIDEBAR_W = 212;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: WC.bg,
  },

  // ── Sidebar ──────────────────────────────────────────────────────────
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: WC.bgDeep,
    borderRightWidth: 1,
    borderRightColor: WC.panelBorder,
    paddingVertical: SPACING.lg,
    flexDirection: 'column',
  },

  // Logo
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(196,159,255,0.12)',
    borderWidth: 1,
    borderColor: WC.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLeaf: { fontSize: 20 },
  logoTextBlock: { flex: 1 },
  logoTitle: {
    color: WC.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  logoSub: {
    color: WC.primary,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 1,
  },

  // Nav section label
  navSectionLabel: {
    color: WC.textFaint,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 18,
    marginBottom: 6,
  },

  // Nav list
  navList: {
    gap: 1,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  navAccentBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: WC.primary,
  },
  navIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navIconWrapActive: {
    backgroundColor: WC.primaryDim,
  },
  navItemHovered: { backgroundColor: 'rgba(255,255,255,0.04)' },
  navItemActive: { backgroundColor: 'rgba(196,159,255,0.08)' },
  navLabel: {
    color: WC.textMuted,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  navLabelActive: { color: WC.primary, fontWeight: '700' },

  // Pulsing dot
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: WC.exp,
    shadowColor: WC.exp,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: WC.sep,
    marginHorizontal: 12,
    marginVertical: 10,
  },

  // CTA button
  sidebarNewBtn: {
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: WC.btn,
    shadowColor: WC.btnGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    overflow: 'hidden',
  },
  sidebarNewBtnHover: {
    backgroundColor: WC.btnHover,
  },
  sidebarNewBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sidebarNewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Active session pill
  sidebarSessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 10,
    marginBottom: 8,
    backgroundColor: WC.primaryDim,
    borderWidth: 1,
    borderColor: WC.primaryBorder,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  sidebarSessionText: {
    flex: 1,
    color: WC.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // Profile footer
  profileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  profileFooterHovered: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '900' },
  profileTextBlock: { flex: 1 },
  profileName: {
    color: WC.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  profileServer: {
    color: WC.textMuted,
    fontSize: 10,
    marginTop: 1,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: WC.bg,
  },
  screenVisible: { flex: 1 },
  screenHidden: { display: 'none' },
});
