import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, PeriodStats, Profile, OpenSession } from '../types';

// ── Mappers ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>;

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

function sessionToRow(session: Session): Record<string, unknown> {
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
    common_familiars_start: session.commonFamiliarsStart,
    common_familiars_end: session.commonFamiliarsEnd,
    common_familiars_gained: session.commonFamiliarsGained,
    rare_familiars_start: session.rareFamiliarsStart,
    rare_familiars_end: session.rareFamiliarsEnd,
    rare_familiars_gained: session.rareFamiliarsGained,
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

function profileToRow(profile: Profile): Record<string, unknown> {
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

function openSessionToRow(session: OpenSession): Record<string, unknown> {
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
    common_familiars_start: session.commonFamiliarsStart,
    rare_familiars_start: session.rareFamiliarsStart,
    notes: session.notes ?? null,
  };
}

// ── Session CRUD ───────────────────────────────────────────────────────────────

export async function getAllSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getAllSessions:', error.message); return []; }
  return (data ?? []).map(rowToSession);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('getSessionById:', error.message); return null; }
  return data ? rowToSession(data) : null;
}

export async function addSession(session: Session): Promise<void> {
  const { error } = await supabase.from('sessions').insert(sessionToRow(session));
  if (error) console.error('addSession:', error.message);
}

export async function updateSession(updated: Session): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update(sessionToRow(updated))
    .eq('id', updated.id);
  if (error) console.error('updateSession:', error.message);
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) console.error('deleteSession:', error.message);
}

export async function getSessionsByDate(date: string, profileId?: string): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query;
  if (error) { console.error('getSessionsByDate:', error.message); return []; }
  return (data ?? []).map(rowToSession);
}

export async function getSessionsByDateRange(
  startDate: string,
  endDate: string,
  profileId?: string
): Promise<Session[]> {
  let query = supabase
    .from('sessions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query;
  if (error) { console.error('getSessionsByDateRange:', error.message); return []; }
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

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('getProfiles:', error.message); return []; }
  return (data ?? []).map(rowToProfile);
}

/** @deprecated Use addProfile / updateProfile individually */
export async function saveProfiles(profiles: Profile[]): Promise<void> {
  for (const p of profiles) {
    const { error } = await supabase.from('profiles').upsert(profileToRow(p));
    if (error) console.error('saveProfiles upsert:', error.message);
  }
}

export async function addProfile(profile: Profile): Promise<void> {
  const { error } = await supabase.from('profiles').insert(profileToRow(profile));
  if (error) console.error('addProfile:', error.message);
}

export async function updateProfile(profile: Profile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(profileToRow(profile))
    .eq('id', profile.id);
  if (error) console.error('updateProfile:', error.message);
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) console.error('deleteProfile:', error.message);
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
  let query = supabase.from('open_sessions').select('*');
  if (profileId) query = query.eq('profile_id', profileId);
  const { data, error } = await query.limit(1);
  if (error) { console.error('getOpenSession:', error.message); return null; }
  return data && data.length > 0 ? rowToOpenSession(data[0]) : null;
}

export async function saveOpenSession(session: OpenSession): Promise<void> {
  // Upsert: delete existing for this profile then insert fresh
  await supabase.from('open_sessions').delete().eq('profile_id', session.profileId);
  const { error } = await supabase.from('open_sessions').insert(openSessionToRow(session));
  if (error) console.error('saveOpenSession:', error.message);
}

export async function deleteOpenSession(profileId?: string): Promise<void> {
  let query = supabase.from('open_sessions').delete();
  if (profileId) {
    const { error } = await query.eq('profile_id', profileId);
    if (error) console.error('deleteOpenSession:', error.message);
  } else {
    // Delete all (fallback)
    const { error } = await query.gte('started_at', 0);
    if (error) console.error('deleteOpenSession:', error.message);
  }
}
