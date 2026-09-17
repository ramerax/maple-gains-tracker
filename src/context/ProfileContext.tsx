import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Profile } from '../types';
import {
  getProfiles,
  addProfile,
  getActiveProfileId,
  setActiveProfileId,
  generateId,
  migrateDataToAuthUser,
} from '../utils/storage';
import { supabase } from '../lib/supabase';

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  loadError: string | null;
  loading: boolean;
  setActiveProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULT_PROFILE_COLOR = '#FF8C00';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const refreshProfiles = useCallback(async () => {
    // Snapshot session token before migrations run so auth state stays stable
    const { data: sessionSnapshot } = await supabase.auth.getSession();
    const accessToken = sessionSnapshot.session?.access_token ?? undefined;

    try { await migrateDataToAuthUser(); } catch (e) { if (import.meta.env.DEV) console.error('migrateDataToAuthUser:', e); }

    const { profiles: loaded, error: profilesError } = await getProfiles(accessToken);
    if (!mountedRef.current) return;
    let activeId = await getActiveProfileId();
    if (!mountedRef.current) return;

    if (profilesError) {
      setLoadError(profilesError);
      setLoading(false);
      return;
    }

    if (loaded.length === 0) {
      // ProfileProvider only mounts once authenticated (see AuthGate in App.tsx),
      // so 0 rows here always means a genuinely new account — create the default profile.
      const defaultProfile: Profile = {
        id: generateId(),
        name: 'Mi Personaje',
        color: DEFAULT_PROFILE_COLOR,
        createdAt: Date.now(),
      };
      const { error: createError } = await addProfile(defaultProfile);
      if (createError) {
        setLoadError('No se pudo crear tu perfil inicial. Intenta recargar la página.');
        setLoading(false);
        return;
      }
      await setActiveProfileId(defaultProfile.id);
      setProfiles([defaultProfile]);
      setActiveProfileIdState(defaultProfile.id);
      setLoadError(null);
      setLoading(false);
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
    setLoading(false);
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
      value={{ profiles, activeProfile, activeProfileId, loadError, loading, setActiveProfile, refreshProfiles }}
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
