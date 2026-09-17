import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllSessions, getSessionsByDateRange, aggregateStats, deleteOpenSession } from '@/utils/storage';
import { getTodayString, getWeekRange } from '@/utils/formatters';
import type { Session, PeriodStats } from '@/types';

export function useHomeData(activeProfileId: string | null) {
  const today = getTodayString();
  const [allTimeStats, setAllTimeStats] = useState<PeriodStats | null>(null);
  const [weekStats, setWeekStats] = useState<PeriodStats | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { start: wS, end: wE } = getWeekRange(today);
    const [all, week] = await Promise.all([
      getAllSessions(activeProfileId ?? undefined),
      getSessionsByDateRange(wS, wE, activeProfileId ?? undefined),
    ]);
    if (!mountedRef.current) return;
    setError(all.error ?? week.error);
    setAllTimeStats(aggregateStats(all.sessions));
    setWeekStats(aggregateStats(week.sessions));
    setAllSessions(all.sessions);
    setLoading(false);
  }, [today, activeProfileId]);

  useEffect(() => { load(); }, [load]);

  const cancelOpenSession = useCallback(async () => {
    if (!activeProfileId) return { error: null };
    return deleteOpenSession(activeProfileId);
  }, [activeProfileId]);

  const latestSession = allSessions.length > 0
    ? allSessions.reduce((a, b) => (b.createdAt > a.createdAt ? b : a))
    : null;

  const recentSessions = [...allSessions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return {
    today, allTimeStats, weekStats, allSessions,
    recentSessions, latestSession, loading, error, reload: load, cancelOpenSession,
  };
}
