/**
 * WebScreenWrapper — wraps Stack screens with the sidebar on desktop web.
 * On mobile/non-desktop, renders children directly.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WC } from '../constants/themeWeb';
import { RootStackParamList } from '../types';
import { useProfile } from '../context/ProfileContext';
import { useIsDesktopWeb } from '../hooks/useIsDesktopWeb';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  children: React.ReactNode;
}

export default function WebScreenWrapper({ children }: Props) {
  const isDesktopWeb = useIsDesktopWeb();
  const { activeProfile } = useProfile();
  const navigation = useNavigation<Nav>();

  if (!isDesktopWeb) return <>{children}</>;

  const goHome = () => navigation.navigate('MainTabs');

  return (
    <View style={styles.root}>
      {/* Sidebar (read-only nav) */}
      <View style={styles.sidebar}>
        {/* Logo */}
        <Pressable style={styles.logoArea} onPress={goHome}>
          <Text style={styles.logoLeaf}>🍁</Text>
          <View style={styles.logoTextBlock}>
            <Text style={styles.logoTitle}>MapleGains</Text>
            {activeProfile && (
              <Text style={styles.logoSub} numberOfLines={1}>
                {activeProfile.gameClass ?? activeProfile.name}
              </Text>
            )}
          </View>
        </Pressable>

        <View style={styles.divider} />

        {/* Nav items — click navigates back to MainTabs */}
        <View style={styles.navList}>
          {(['Inicio', 'Historial', 'Estadísticas'] as const).map((label) => {
            const icon = label === 'Inicio' ? 'home-outline'
              : label === 'Historial' ? 'time-outline'
              : 'stats-chart-outline';
            return (
              <Pressable
                key={label}
                // @ts-ignore: web-only hover state
                style={(state: { hovered?: boolean }) => [
                  styles.navItem,
                  state.hovered && styles.navItemHovered,
                ]}
                onPress={goHome}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={WC.textMuted} />
                <Text style={styles.navLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.divider} />

        {/* Profile footer */}
        <Pressable
          // @ts-ignore: web-only hover state
          style={(state: { hovered?: boolean }) => [styles.profileFooter, state.hovered && styles.profileFooterHovered]}
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

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const SIDEBAR_W = 180;

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: WC.bg },

  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: WC.bg,
    borderRightWidth: 1,
    borderRightColor: WC.panelBorder,
    paddingVertical: 16,
    paddingHorizontal: 10,
  },

  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, marginBottom: 8 },
  logoLeaf: { fontSize: 20 },
  logoTextBlock: { flex: 1 },
  logoTitle: { color: WC.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  logoSub: { color: WC.textMuted, fontSize: 10, marginTop: 1 },

  divider: { height: 1, backgroundColor: WC.sep, marginVertical: 10, marginHorizontal: 6 },

  navList: { gap: 2 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: 8,
  },
  navItemHovered: { backgroundColor: 'rgba(255,255,255,0.04)' },
  navLabel: { color: WC.textMuted, fontSize: 13, fontWeight: '600' },

  profileFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 6,
    borderRadius: 8,
  },
  profileFooterHovered: { backgroundColor: 'rgba(255,255,255,0.04)' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarLetter: { fontSize: 12, fontWeight: '800' },
  profileName: { flex: 1, color: WC.textDim, fontSize: 12, fontWeight: '600' },

  content: { flex: 1 },
});
