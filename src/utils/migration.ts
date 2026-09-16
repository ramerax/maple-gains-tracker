/**
 * One-time migration: moves data from AsyncStorage (v1) → Supabase (v2).
 * Uses flag @maple_migrated_v3 to force a clean re-run after race-condition fix.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, Profile, OpenSession } from '../types';
import { sessionToRow, profileToRow, openSessionToRow } from './storage';

const MIGRATION_FLAG = '@maple_migrated_v3';
const ACTIVE_PROFILE_KEY = '@maple_active_profile';

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
