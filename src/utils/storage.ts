import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, PeriodStats, Profile, OpenSession } from '../types';

// ── Mappers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>;

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const SESSION_COLUMNS =
  'id, profile_id, date, created_at, lv_start, exp_start, lv_end, exp_end, ' +
  'exp_gained_actual, frags_start, frags_end, frags_gained, nodes_start, nodes_end, ' +
  'nodes_gained, mesos_start, mesos_end, mesos_gained, common_familiars_start, ' +
  'common_familiars_end, common_familiars_gained, rare_familiars_start, ' +
  'rare_familiars_end, rare_familiars_gained, notes';

const PROFILE_COLUMNS = 'id, name, game_class, server, color, created_at';

const OPEN_SESSION_COLUMNS =
  'id, profile_id, date, started_at, lv_start, exp_start, frags_start, nodes_start, ' +
  'mesos_start, common_familiars_start, rare_familiars_start, notes';

// Guards against unbounded growth for a single-user tracker (~150 sessions/year of daily use)
const MAX_SESSIONS = 3000;

function rowToSession(row: DbRow): Session {
  return {
    id: row.id,
    date: row.date,
    createdAt: row.created_at,
    profileId: row.profile_id ?? undefined,
    lvStart: row.lv_start,
    expStart: row.exp_start,
    lvEnd: row.lv_end,
    expEnd: row.exp_end,
    expGainedActual: row.exp_gained_actual,
    fragsStart: row.frags_start,
    fragsEnd: row.frags_end,
    fragsGained: row.frags_gained,
    nodesStart: row.nodes_start,
    nodesEnd: row.nodes_end,
    nodesGained: row.nodes_gained,
    mesosStart: row.mesos_start,
    mesosEnd: row.mesos_end,
    mesosGained: row.mesos_gained,
    commonFamiliarsStart: row.common_familiars_start,
    commonFamiliarsEnd: row.common_familiars_end,
    commonFamiliarsGained: row.common_familiars_gained,
    rareFamiliarsStart: row.rare_familiars_start,
    rareFamiliarsEnd: row.rare_familiars_end,
    rareFamiliarsGained: row.rare_familiars_gained,
    notes: row.notes ?? undefined,
  };
}

export function sessionToRow(session: Session): Record<string, unknown> {
  return {
    id: session.id,
    profile_id: session.profileId ?? null,
    date: session.date,
    created_at: session.createdAt,
    lv_start: session.lvStart,
    exp_start: session.expStart,
    lv_end: session.lvEnd,
    exp_end: session.expEnd,
    exp_gained_actual: session.expGainedActual,
    frags_start: session.fragsStart,
    frags_end: session.fragsEnd,
    frags_gained: session.fragsGained,
    nodes_start: session.nodesStart,
    nodes_end: session.nodesEnd,
    nodes_gained: session.nodesGained,
    mesos_start: session.mesosStart,
    mesos_end: session.mesosEnd,
    mesos_gained: session.mesosGained,
    common_familiars_start: session.commonFamiliarsStart ?? 0,
    common_familiars_end: session.commonFamiliarsEnd ?? 0,
    common_familiars_gained: session.commonFamiliarsGained ?? 0,
    rare_familiars_start: session.rareFamiliarsStart ?? 0,
    rare_familiars_end: session.rareFamiliarsEnd ?? 0,
    rare_familiars_gained: session.rareFamiliarsGained ?? 0,
    notes: session.notes ?? null,
  };
}

function rowToProfile(row: DbRow): Profile {
  return {
    id: row.id,
    name: row.name,
    gameClass: row.game_class ?? undefined,
    server: row.server ?? undefined,
    color: row.color,
    createdAt: row.created_at,
  };
}

export function profileToRow(profile: Profile): Record<string, unknown> {
  return {
    id: profile.id,
    name: profile.name,
    game_class: profile.gameClass ?? null,
    server: profile.server ?? null,
    color: profile.color,
    created_at: profile.createdAt,
  };
}

function rowToOpenSession(row: DbRow): OpenSession {
  return {
    id: row.id,
    date: row.date,
    startedAt: row.started_at,
    profileId: row.profile_id,
    lvStart: row.lv_start,
    expStart: row.exp_start,
    fragsStart: row.frags_start,
    nodesStart: row.nodes_start,
    mesosStart: row.mesos_start,
    commonFamiliarsStart: row.common_familiars_start,
    rareFamiliarsStart: row.rare_familiars_start,
    notes: row.notes ?? undefined,
  };
}

export function openSessionToRow(session: OpenSession): Record<string, unknown> {
  return {
    id: session.id,
    profile_id: session.profileId,
    date: session.date,
    started_at: session.startedAt,
    lv_start: session.lvStart,
    exp_start: session.expStart,
    frags_start: session.fragsStart,
    nodes_start: session.nodesStart,
    mesos_start: session.mesosStart,
    common_familiars_start: session.commonFamiliarsStart ?? 0,
    rare_familiars_start: session.rareFamiliarsStart ?? 0,
    notes: session.notes ?? null,
  };
}

// ── Session CRUD ───────────────────────────────────────────────────────────────

export async function getAllSessions(profileId?: string): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(MAX_SESSIONS);
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query;
  if (error) { if (__DEV__) console.error('getAllSessions:', error.message); return []; }
  return (data ?? []).map(rowToSession);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .eq('id', id)
    .single();
  if (error) { if (__DEV__) console.error('getSessionById:', error.message); return null; }
  return data ? rowToSession(data) : null;
}

export async function addSession(session: Session): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sessions').insert(sessionToRow(session));
  if (error) { if (__DEV__) console.error('addSession:', error.message); return { error: error.message }; }
  return { error: null };
}

export async function updateSession(updated: Session): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('sessions')
    .update(sessionToRow(updated))
    .eq('id', updated.id);
  if (error) { if (__DEV__) console.error('updateSession:', error.message); return { error: error.message }; }
  return { error: null };
}

export async function deleteSession(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) { if (__DEV__) console.error('deleteSession:', error.message); return { error: error.message }; }
  return { error: null };
}

export async function getSessionsByDate(date: string, profileId?: string): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query;
  if (error) { if (__DEV__) console.error('getSessionsByDate:', error.message); return []; }
  return (data ?? []).map(rowToSession);
}

export async function getSessionsByDateRange(
  startDate: string,
  endDate: string,
  profileId?: string
): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select(SESSION_COLUMNS)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query;
  if (error) { if (__DEV__) console.error('getSessionsByDateRange:', error.message); return []; }
  return (data ?? []).map(rowToSession);
}

// ── Aggregate (pure function, unchanged) ──────────────────────────────────────

export function aggregateStats(sessions: Session[]): PeriodStats | null {
  if (sessions.length === 0) return null;
  const sorted = [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return {
    totalExpGained: sessions.reduce((s, r) => s + r.expGainedActual, 0),
    totalFragsGained: sessions.reduce((s, r) => s + r.fragsGained, 0),
    totalNodesGained: sessions.reduce((s, r) => s + r.nodesGained, 0),
    totalMesosGained: sessions.reduce((s, r) => s + r.mesosGained, 0),
    totalCommonFamiliarsGained: sessions.reduce((s, r) => s + r.commonFamiliarsGained, 0),
    totalRareFamiliarsGained: sessions.reduce((s, r) => s + r.rareFamiliarsGained, 0),
    lvStart: first.lvStart,
    expStart: first.expStart,
    lvEnd: last.lvEnd,
    expEnd: last.expEnd,
    sessionCount: sessions.length,
  };
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + cryptographically strong random bytes
  const arr = new Uint32Array(3);
  crypto.getRandomValues(arr);
  return `${Date.now()}-${arr[0].toString(36)}${arr[1].toString(36)}${arr[2].toString(36)}`;
}

// ── Profile CRUD ───────────────────────────────────────────────────────────────

export async function getProfiles(accessToken?: string): Promise<{ profiles: Profile[]; error: string | null }> {
  const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
  const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  let token = accessToken;
  if (!token) {
    const { data: sd } = await supabase.auth.getSession();
    token = sd.session?.access_token;
  }

  const headers: Record<string, string> = { apikey: ANON_KEY, Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=${encodeURIComponent(PROFILE_COLUMNS)}&order=created_at.asc`,
      { headers }
    );
    if (!r.ok) {
      const body = await r.text();
      if (__DEV__) console.error('getProfiles HTTP error:', r.status, body);
      return { profiles: [], error: 'No se pudieron cargar los perfiles. Intenta de nuevo.' };
    }
    const data = await r.json();
    return { profiles: (data ?? []).map(rowToProfile), error: null };
  } catch (e: unknown) {
    if (__DEV__) console.error('getProfiles fetch threw:', errMessage(e));
    return { profiles: [], error: 'No se pudo conectar. Revisa tu conexión e intenta de nuevo.' };
  }
}

export async function addProfile(profile: Profile): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').insert(profileToRow(profile));
  if (error) { if (__DEV__) console.error('addProfile:', error.message); return { error: error.message }; }
  return { error: null };
}

export async function updateProfile(profile: Profile): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .update(profileToRow(profile))
    .eq('id', profile.id);
  if (error) { if (__DEV__) console.error('updateProfile:', error.message); return { error: error.message }; }
  return { error: null };
}

export async function deleteProfile(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) { if (__DEV__) console.error('deleteProfile:', error.message); return { error: error.message }; }
  return { error: null };
}

// ── Active Profile (stays local — device preference) ──────────────────────────

const ACTIVE_PROFILE_KEY = '@maple_active_profile';

export async function getActiveProfileId(): Promise<string | null> {
  try { return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY); }
  catch { return null; }
}

export async function setActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

// ── Open Session ───────────────────────────────────────────────────────────────

export async function getOpenSession(profileId?: string): Promise<OpenSession | null> {
  let query = supabase
    .from('open_sessions')
    .select(OPEN_SESSION_COLUMNS)
    .order('started_at', { ascending: false });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query.limit(1);
  if (error) { if (__DEV__) console.error('getOpenSession:', error.message); return null; }
  return data && data.length > 0 ? rowToOpenSession(data[0]) : null;
}

export async function saveOpenSession(session: OpenSession): Promise<{ error: string | null }> {
  // Step 1: INSERT/UPDATE this session first (safe — data exists before old row removed)
  const { error: upsertErr } = await supabase
    .from('open_sessions')
    .upsert(openSessionToRow(session), { onConflict: 'id' });

  if (upsertErr) {
    // Always surface this — losing an open session silently is unacceptable
    console.error('saveOpenSession upsert error:', upsertErr.message);
    return { error: upsertErr.message }; // Do NOT delete old rows if the write failed
  }

  // Step 2: Only after the new row is confirmed saved, remove any stale
  // open sessions for this profile that have a different id
  const { error: cleanupErr } = await supabase
    .from('open_sessions')
    .delete()
    .eq('profile_id', session.profileId)
    .neq('id', session.id);
  if (cleanupErr && __DEV__) console.error('saveOpenSession cleanup error:', cleanupErr.message);

  return { error: null };
}

export async function deleteOpenSession(profileId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('open_sessions')
    .delete()
    .eq('profile_id', profileId);
  if (error) { if (__DEV__) console.error('deleteOpenSession:', error.message); return { error: error.message }; }
  return { error: null };
}

// ── Auth data migration ────────────────────────────────────────────────────────
// Runs once after first login: assigns user_id to all existing rows that lack it.
const USER_ID_MIGRATION_FLAG = '@maple_user_id_migrated';

export async function migrateDataToAuthUser(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(USER_ID_MIGRATION_FLAG);
    if (done === 'true') return;
  } catch { /* AsyncStorage unavailable — fall through and attempt migration anyway */ }

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user) return;
  const uid = data.user.id;

  const [r1, r2, r3] = await Promise.all([
    supabase.from('profiles').update({ user_id: uid }).is('user_id', null),
    supabase.from('sessions').update({ user_id: uid }).is('user_id', null),
    supabase.from('open_sessions').update({ user_id: uid }).is('user_id', null),
  ]);
  if (__DEV__) {
    if (r1.error) console.error('migrateDataToAuthUser profiles:', r1.error.message);
    if (r2.error) console.error('migrateDataToAuthUser sessions:', r2.error.message);
    if (r3.error) console.error('migrateDataToAuthUser open_sessions:', r3.error.message);
  }
  if (!r1.error && !r2.error && !r3.error) {
    try { await AsyncStorage.setItem(USER_ID_MIGRATION_FLAG, 'true'); } catch { /* non-fatal */ }
  }
}
