import { useEffect, useState } from 'react';
import { getOpenSession } from '@/utils/storage';
import type { OpenSession } from '@/types';

/** Polls for the active/open session every 3s so sidebar indicators stay live. */
export function useOpenSessionPolling(profileId: string | null): OpenSession | null {
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      getOpenSession(profileId ?? undefined).then((s) => {
        if (!cancelled) setOpenSession(s);
      });
    };

    check();
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [profileId]);

  return openSession;
}
