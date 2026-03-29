import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile } from '../types';
import {
  getProfiles,
  addProfile,
  getActiveProfileId,
  setActiveProfileId,
  generateId,
} from '../utils/storage';
import { runMigrationIfNeeded } from '../utils/migration';

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  setActiveProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const DEFAULT_PROFILE_COLOR = '#FF8C00';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);

  const refreshProfiles = useCallback(async () => {
    // Always run migration first — prevents race condition with profile creation
    await runMigrationIfNeeded();
    let loaded = await getProfiles();
    let activeId = await getActiveProfileId();

    // First launch: create a default profile
    if (loaded.length === 0) {
      const defaultProfile: Profile = {
        id: generateId(),
        name: 'Mi Personaje',
        color: DEFAULT_PROFILE_COLOR,
        createdAt: Date.now(),
      };
      await addProfile(defaultProfile);
      await setActiveProfileId(defaultProfile.id);
      loaded = [defaultProfile];
      activeId = defaultProfile.id;
    }

    // If stored activeId is not in the list, fall back to first profile
    if (!activeId || !loaded.find((p) => p.id === activeId)) {
      activeId = loaded[0].id;
      await setActiveProfileId(activeId);
    }

    setProfiles(loaded);
    setActiveProfileIdState(activeId);
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
      value={{ profiles, activeProfile, activeProfileId, setActiveProfile, refreshProfiles }}
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
