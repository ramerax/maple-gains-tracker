import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { getAllSessions } from './utils/storage';

export default function App() {
  const [status, setStatus] = useState('Checking Supabase connection…');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus('No hay sesión activa — iniciá sesión para probar la query real.');
        return;
      }
      const sessions = await getAllSessions();
      setStatus(`✓ Conectado. ${sessions.length} sesiones cargadas de Supabase.`);
    })();
  }, []);

  return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="rounded-2xl border border-border bg-panel px-8 py-6 text-center shadow-glow">
        <h1 className="text-2xl font-black text-primary">🍁 MapleGains</h1>
        <p className="mt-2 text-sm text-text-muted">{status}</p>
      </div>
    </div>
  );
}
