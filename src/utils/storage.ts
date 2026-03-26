import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, PeriodStats, Profile, OpenSession } from '../types';

const SESSIONS_KEY = '@maple_sessions';
const PROFILES_KEY = '@maple_profiles';
const ACTIVE_PROFILE_KEY = '@maple_active_profile';

async function loadAll(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

async function saveAll(sessions: Session[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function getAllSessions(): Promise<Session[]> {
  const sessions = await loadAll();
  return sessions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const sessions = await loadAll();
  return sessions.find((s) => s.id === id) ?? null;
}

export async function addSession(session: Session): Promise<void> {
  const sessions = await loadAll();
  sessions.push(session);
  await saveAll(sessions);
}

export async function updateSession(updated: Session): Promise<void> {
  const sessions = await loadAll();
  const idx = sessions.findIndex((s) => s.id === updated.id);
  if (idx !== -1) {
    sessions[idx] = updated;
    await saveAll(sessions);
  }
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadAll();
  await saveAll(sessions.filter((s) => s.id !== id));
}

export async function getSessionsByDate(date: string, profileId?: string): Promise<Session[]> {
  const sessions = await loadAll();
  return sessions
    .filter((s) => s.date === date && (profileId == null || s.profileId === profileId))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getSessionsByDateRange(
  startDate: string,
  endDate: string,
  profileId?: string
): Promise<Session[]> {
  const sessions = await loadAll();
  return sessions
    .filter(
      (s) =>
        s.date >= startDate &&
        s.date <= endDate &&
        (profileId == null || s.profileId === profileId)
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

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
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Profile storage ────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

export async function saveProfiles(profiles: Profile[]): Promise<void> {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function addProfile(profile: Profile): Promise<void> {
  const profiles = await getProfiles();
  profiles.push(profile);
  await saveProfiles(profiles);
}

export async function updateProfile(profile: Profile): Promise<void> {
  const profiles = await getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx !== -1) {
    profiles[idx] = profile;
    await saveProfiles(profiles);
  }
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getProfiles();
  await saveProfiles(profiles.filter((p) => p.id !== id));
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

// ── Open Session (sesión en progreso) ──────────────────────────────────────────

const OPEN_SESSION_KEY = '@maple_open_session';

export async function getOpenSession(): Promise<OpenSession | null> {
  try {
    const raw = await AsyncStorage.getItem(OPEN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OpenSession;
  } catch {
    return null;
  }
}

export async function saveOpenSession(session: OpenSession): Promise<void> {
  await AsyncStorage.setItem(OPEN_SESSION_KEY, JSON.stringify(session));
}

export async function deleteOpenSession(): Promise<void> {
  await AsyncStorage.removeItem(OPEN_SESSION_KEY);
}
