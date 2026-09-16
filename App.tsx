import React from 'react';
import { View, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS } from './src/constants/theme';
import { WC } from './src/constants/themeWeb';
import { RootStackParamList, TabParamList } from './src/types';
import { ProfileProvider } from './src/context/ProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useIsDesktopWeb } from './src/hooks/useIsDesktopWeb';
import WebLayout from './src/components/WebLayout';
import WebScreenWrapper from './src/components/WebScreenWrapper';
import LoginScreen from './src/screens/LoginScreen';

import HomeScreen from './src/screens/HomeScreen';
import AddSessionScreen from './src/screens/AddSessionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';
import ProfilesScreen from './src/screens/ProfilesScreen';
import StartSessionScreen from './src/screens/StartSessionScreen';
import FinishSessionScreen from './src/screens/FinishSessionScreen';

// ── Wrapped screens for desktop web (sidebar + content) ──────────────────────
function AddSessionWrapped(props: NativeStackScreenProps<RootStackParamList, 'AddSession'>) {
  return <WebScreenWrapper><AddSessionScreen {...props} /></WebScreenWrapper>;
}
function SessionDetailWrapped(props: NativeStackScreenProps<RootStackParamList, 'SessionDetail'>) {
  return <WebScreenWrapper><SessionDetailScreen {...props} /></WebScreenWrapper>;
}
function ProfilesWrapped() {
  return <WebScreenWrapper><ProfilesScreen /></WebScreenWrapper>;
}
function StartSessionWrapped(props: NativeStackScreenProps<RootStackParamList, 'StartSession'>) {
  return <WebScreenWrapper><StartSessionScreen {...props} /></WebScreenWrapper>;
}
function FinishSessionWrapped(props: NativeStackScreenProps<RootStackParamList, 'FinishSession'>) {
  return <WebScreenWrapper><FinishSessionScreen {...props} /></WebScreenWrapper>;
}

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const NAV_HEADER = {
  headerStyle: { backgroundColor: WC.bg },
  headerTintColor: WC.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: FONTS.lg, color: WC.text },
  headerShadowVisible: false,
};

// ── Error Boundary ─────────────────────────────────────────────────────────────
interface ErrorState { hasError: boolean }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorState> {
  state: ErrorState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    if (__DEV__) console.error('ErrorBoundary caught:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: WC.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            ⚠️ Error al cargar
          </Text>
          <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center' }}>
            Algo salió mal. Intenta recargar la página.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
function Tabs() {
  const isDesktopWeb = useIsDesktopWeb();
  const insets = useSafeAreaInsets();

  // Desktop web: sidebar layout instead of bottom tabs
  if (isDesktopWeb) {
    return <WebLayout />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        ...NAV_HEADER,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 54 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: FONTS.xs, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Historial',
          headerTitle: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Estadísticas',
          headerTitle: 'Estadísticas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
function AppContent() {
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = useIsDesktopWeb();

  // Desktop web: full viewport, no centering — WebLayout handles its own structure
  // Mobile web (<768px): centered 480px container (mobile-in-browser look)
  // Native: plain flex: 1
  const outerStyle = isWeb && !isDesktopWeb
    ? { flex: 1, backgroundColor: '#050505', alignItems: 'center' as const }
    : { flex: 1 };
  const innerStyle = isWeb && !isDesktopWeb
    ? { flex: 1, width: '100%' as const, maxWidth: 480, backgroundColor: COLORS.bg, overflow: 'hidden' as const }
    : { flex: 1 };

  return (
    <View style={outerStyle}>
      <View style={innerStyle}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              ...NAV_HEADER,
              contentStyle: { backgroundColor: WC.bg },
            }}
          >
            <Stack.Screen
              name="MainTabs"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddSession"
              component={isDesktopWeb ? AddSessionWrapped : AddSessionScreen}
              options={{ title: 'Nueva Sesión', presentation: 'modal', headerShown: !isDesktopWeb }}
            />
            <Stack.Screen
              name="SessionDetail"
              component={isDesktopWeb ? SessionDetailWrapped : SessionDetailScreen}
              options={{ title: 'Detalle', headerShown: !isDesktopWeb }}
            />
            <Stack.Screen
              name="Profiles"
              component={isDesktopWeb ? ProfilesWrapped : ProfilesScreen}
              options={{ title: 'Perfiles', headerShown: !isDesktopWeb }}
            />
            <Stack.Screen
              name="StartSession"
              component={isDesktopWeb ? StartSessionWrapped : StartSessionScreen}
              options={({ route }) => ({
                title: route.params?.editing ? 'Editar Sesión' : 'Iniciar Sesión',
                presentation: 'modal',
                headerShown: !isDesktopWeb,
              })}
            />
            <Stack.Screen
              name="FinishSession"
              component={isDesktopWeb ? FinishSessionWrapped : FinishSessionScreen}
              options={{ title: 'Finalizar Sesión', presentation: 'modal', headerShown: !isDesktopWeb }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

// ── AuthGate — shows Login until user is authenticated ────────────────────────
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: WC.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: WC.textMuted, fontSize: FONTS.md }}>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGate>
            <ProfileProvider>
              <AppContent />
            </ProfileProvider>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
