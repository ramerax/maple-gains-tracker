/**
 * One-time migration: moves data from AsyncStorage (v1) → Supabase (v2).
 * Uses flag @maple_migrated_v3 to force a clean re-run after race-condition fix.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, Profile, OpenSession } from '../types';

const MIGRATION_FLAG = '@maple_migrated_v3';
const ACTIVE_PROFILE_KEY = '@maple_active_profile';

function sessionToRow(s: Session) {
  return {
    id: s.id,
    profile_id: s.profileId ?? null,
    date: s.date,
    created_at: s.createdAt,
    lv_start: s.lvStart,
    exp_start: s.expStart,
    lv_end: s.lvEnd,
    exp_end: s.expEnd,
    exp_gained_actual: s.expGainedActual,
    frags_start: s.fragsStart,
    frags_end: s.fragsEnd,
    frags_gained: s.fragsGained,
    nodes_start: s.nodesStart,
    nodes_end: s.nodesEnd,
    nodes_gained: s.nodesGained,
    mesos_start: s.mesosStart,
    mesos_end: s.mesosEnd,
    mesos_gained: s.mesosGained,
    common_familiars_start: s.commonFamiliarsStart ?? 0,
    common_familiars_end: s.commonFamiliarsEnd ?? 0,
    common_familiars_gained: s.commonFamiliarsGained ?? 0,
    rare_familiars_start: s.rareFamiliarsStart ?? 0,
    rare_familiars_end: s.rareFamiliarsEnd ?? 0,
    rare_familiars_gained: s.rareFamiliarsGained ?? 0,
    notes: s.notes ?? null,
  };
}

function profileToRow(p: Profile) {
  return {
    id: p.id,
    name: p.name,
    game_class: p.gameClass ?? null,
    server: p.server ?? null,
    color: p.color,
    created_at: p.createdAt,
  };
}

function openSessionToRow(o: OpenSession) {
  return {
    id: o.id,
    profile_id: o.profileId,
    date: o.date,
    started_at: o.startedAt,
    lv_start: o.lvStart,
    exp_start: o.expStart,
    frags_start: o.fragsStart,
    nodes_start: o.nodesStart,
    mesos_start: o.mesosStart,
    common_familiars_start: o.commonFamiliarsStart ?? 0,
    rare_familiars_start: o.rareFamiliarsStart ?? 0,
    notes: o.notes ?? null,
  };
}

export async function runMigrationIfNeeded(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_FLAG);
    if (done === 'true') return;

    // Migration v3 starting

    // 1. Profiles
    const rawProfiles = await AsyncStorage.getItem('@maple_profiles');
    const profiles: Profile[] = rawProfiles ? JSON.parse(rawProfiles) : [];
    if (profiles.length > 0) {
      const { error } = await supabase.from('profiles').upsert(profiles.map(profileToRow));
      if (error) if (__DEV__) console.warn('[Migration] profiles:', error.message);
      // profiles migrated
    }

    // 2. Sessions
    const rawSessions = await AsyncStorage.getItem('@maple_sessions');
    const sessions: Session[] = rawSessions ? JSON.parse(rawSessions) : [];
    if (sessions.length > 0) {
      const { error } = await supabase.from('sessions').upsert(sessions.map(sessionToRow));
      if (error) if (__DEV__) console.warn('[Migration] sessions:', error.message);
      // sessions migrated
    }

    // 3. Open session
    const rawOpen = await AsyncStorage.getItem('@maple_open_session');
    if (rawOpen) {
      const open: OpenSession = JSON.parse(rawOpen);
      await supabase.from('open_sessions').delete().eq('profile_id', open.profileId);
      const { error } = await supabase.from('open_sessions').insert(openSessionToRow(open));
      if (error) if (__DEV__) console.warn('[Migration] open_session:', error.message);
    }

    // 4. Fix activeProfileId: point to the first MIGRATED profile (not any auto-created one)
    if (profiles.length > 0) {
      const correctId = profiles[0].id;
      await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, correctId);
      // activeProfileId updated
    }

    // 5. Clean up auto-created duplicate profiles (profiles in Supabase not in migrated list)
    const migratedIds = new Set(profiles.map((p) => p.id));
    const { data: allDbProfiles } = await supabase.from('profiles').select('id');
    if (allDbProfiles) {
      for (const row of allDbProfiles) {
        if (!migratedIds.has(row.id)) {
          // Auto-created profile — delete if it has no sessions
          const { data: linked } = await supabase
            .from('sessions')
            .select('id')
            .eq('profile_id', row.id)
            .limit(1);
          if (!linked || linked.length === 0) {
            await supabase.from('profiles').delete().eq('id', row.id);
            // orphan profile removed
          }
        }
      }
    }

    await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
    // Migration v3 complete
  } catch (e) {
    if (__DEV__) console.warn('[Migration] Error:', e);
  }
}
