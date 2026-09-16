import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '../types';
import {
  getProfiles,
  addProfile,
  getActiveProfileId,
  setActiveProfileId,
  generateId,
  migrateDataToAuthUser,
} from '../utils/storage';
import { runMigrationIfNeeded } from '../utils/migration';
import { supabase } from '../lib/supabase';

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  loadError: string | null;
  setActiveProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULT_PROFILE_COLOR = '#FF8C00';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshProfiles = useCallback(async () => {
    // Force token refresh so the JWT is always fresh before any DB query
    try { await supabase.auth.refreshSession(); } catch (_) { /* non-fatal */ }

    // Always run migration first — prevents race condition with profile creation
    await runMigrationIfNeeded();
    // Assign user_id to any rows created before auth was added (runs fast if already done)
    try { await migrateDataToAuthUser(); } catch (e) { console.error('[ProfileContext] migrateDataToAuthUser threw:', e); }

    const { profiles: loaded, error: profilesError } = await getProfiles();
    let activeId = await getActiveProfileId();

    if (profilesError) {
      setLoadError(profilesError);
      return;
    }

    if (loaded.length === 0) {
      // Check if user is authenticated — if yes, something is wrong (not first launch)
      const { data: sd } = await supabase.auth.getSession();
      if (sd.session) {
        const uid = sd.session.user.id;
        setLoadError(`getProfiles() returned 0 rows. uid=${uid.slice(0,8)} JWT_exp=${sd.session.expires_at}`);
        return;
      }
      // Not authenticated: genuine first launch → create default
      const defaultProfile: Profile = {
        id: generateId(),
        name: 'Mi Personaje',
        color: DEFAULT_PROFILE_COLOR,
        createdAt: Date.now(),
      };
      await addProfile(defaultProfile);
      await setActiveProfileId(defaultProfile.id);
      setProfiles([defaultProfile]);
      setActiveProfileIdState(defaultProfile.id);
      setLoadError(null);
      return;
    }

    // If stored activeId is not in the list, fall back to first profile
    if (!activeId || !loaded.find((p) => p.id === activeId)) {
      activeId = loaded[0].id;
      await setActiveProfileId(activeId);
    }

    setProfiles(loaded);
    setActiveProfileIdState(activeId);
    setLoadError(null);
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const setActiveProfile = useCallback(async (id: string) => {
    await setActiveProfileId(id);
    setActiveProfileIdState(id);
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  return (
    <ProfileContext.Provider
      value={{ profiles, activeProfile, activeProfileId, loadError, setActiveProfile, refreshProfiles }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
