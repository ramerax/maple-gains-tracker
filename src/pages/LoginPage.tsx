import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    <div className="flex h-full items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-strong bg-panel p-8 text-center shadow-glow">
        <p className="text-5xl">🍁</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-primary">MapleGains</h1>
        <p className="mt-1 text-sm text-text-muted">Tu tracker de sesiones MapleStory</p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="rounded-xl border border-border bg-white/[0.06] px-4 py-3 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="rounded-xl border border-border bg-white/[0.06] px-4 py-3 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          />

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex min-h-[52px] items-center justify-center rounded-xl bg-primary text-base font-extrabold text-bg-deep shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-bg-deep border-t-transparent" />
            ) : mode === 'login' ? (
              'Iniciar Sesión'
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null); }}
          className="mt-5 text-sm text-text-muted hover:text-text-dim"
        >
          {mode === 'login' ? '¿Primera vez? Crear cuenta' : '¿Ya tienes cuenta? Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
