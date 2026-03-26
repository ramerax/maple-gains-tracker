import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS } from './src/constants/theme';
import { RootStackParamList, TabParamList } from './src/types';
import { ProfileProvider } from './src/context/ProfileContext';

import HomeScreen from './src/screens/HomeScreen';
import AddSessionScreen from './src/screens/AddSessionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';
import ProfilesScreen from './src/screens/ProfilesScreen';
import StartSessionScreen from './src/screens/StartSessionScreen';
import FinishSessionScreen from './src/screens/FinishSessionScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const NAV_HEADER = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: FONTS.lg },
  headerShadowVisible: false,
};

function Tabs() {
  const insets = useSafeAreaInsets();
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

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              ...NAV_HEADER,
              contentStyle: { backgroundColor: COLORS.bg },
            }}
          >
            <Stack.Screen
              name="MainTabs"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddSession"
              component={AddSessionScreen}
              options={{ title: 'Nueva Sesión', presentation: 'modal' }}
            />
            <Stack.Screen
              name="SessionDetail"
              component={SessionDetailScreen}
              options={{ title: 'Detalle' }}
            />
            <Stack.Screen
              name="Profiles"
              component={ProfilesScreen}
              options={{ title: 'Perfiles' }}
            />
            <Stack.Screen
              name="StartSession"
              component={StartSessionScreen}
              options={{ title: 'Iniciar Sesión', presentation: 'modal' }}
            />
            <Stack.Screen
              name="FinishSession"
              component={FinishSessionScreen}
              options={{ title: 'Finalizar Sesión', presentation: 'modal' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
