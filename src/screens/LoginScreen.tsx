import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { WC } from '../constants/themeWeb';
import { FONTS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa email y contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'login') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
      } else {
        const err = await signUp(email.trim(), password);
        if (err) {
          setError(err);
        } else {
          setInfo('Cuenta creada. Revisa tu email para confirmar, luego inicia sesión.');
          setMode('login');
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.logo}>🍁</Text>
          <Text style={styles.title}>MapleGains</Text>
          <Text style={styles.subtitle}>Tu tracker de sesiones MapleStory</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={WC.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor={WC.textMuted}
            secureTextEntry
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}
          {info && <Text style={styles.infoText}>{info}</Text>}

          <TouchableOpacity
            style={styles.btn}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null); }}
          >
            <Text style={styles.switchText}>
              {mode === 'login'
                ? '¿Primera vez? Crear cuenta'
                : '¿Ya tienes cuenta? Iniciar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: WC.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    minHeight: 500,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: WC.cardBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: WC.panelBorderStrong,
    padding: SPACING.xxl,
    alignItems: 'center',
    shadowColor: WC.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
  },
  logo: { fontSize: 52, marginBottom: SPACING.sm },
  title: {
    fontSize: FONTS.title,
    fontWeight: '900',
    color: WC.primary,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sm,
    color: WC.textMuted,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WC.panelBorder,
    color: WC.text,
    fontSize: FONTS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#FF4444',
    fontSize: FONTS.sm,
    marginBottom: SPACING.md,
    textAlign: 'center',
    width: '100%',
  },
  infoText: {
    color: WC.nodes,
    fontSize: FONTS.sm,
    marginBottom: SPACING.md,
    textAlign: 'center',
    width: '100%',
  },
  btn: {
    width: '100%',
    backgroundColor: WC.btn,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: WC.btnGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  btnText: { color: '#fff', fontSize: FONTS.lg, fontWeight: '800' },
  switchBtn: { marginTop: SPACING.lg, padding: SPACING.sm },
  switchText: { color: WC.textMuted, fontSize: FONTS.sm },
});
