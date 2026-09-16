import { useCallback, useEffect, useState } from 'react';
import {
  getSessionsByDate, getAllSessions, getSessionsByDateRange, aggregateStats, deleteOpenSession,
} from '@/utils/storage';
import { getTodayString, getWeekRange, getMonthRange } from '@/utils/formatters';
import type { Session, PeriodStats } from '@/types';

export function useHomeData(activeProfileId: string | null) {
  const today = getTodayString();
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [todayStats, setTodayStats] = useState<PeriodStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<PeriodStats | null>(null);
  const [weekStats, setWeekStats] = useState<PeriodStats | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { start: wS, end: wE } = getWeekRange(today);
    const { start: mS, end: mE } = getMonthRange(today);
    const [today_, all, weekSessions] = await Promise.all([
      getSessionsByDate(today, activeProfileId ?? undefined),
      getAllSessions(activeProfileId ?? undefined),
      getSessionsByDateRange(wS, wE, activeProfileId ?? undefined),
      getSessionsByDateRange(mS, mE, activeProfileId ?? undefined), // kept for symmetry with the original month calc
    ]);
    setTodaySessions(today_);
    setTodayStats(aggregateStats(today_));
    setAllTimeStats(aggregateStats(all));
    setWeekStats(aggregateStats(weekSessions));
    setAllSessions(all);
    setLoading(false);
  }, [today, activeProfileId]);

  useEffect(() => { load(); }, [load]);

  const cancelOpenSession = useCallback(async () => {
    if (activeProfileId) await deleteOpenSession(activeProfileId);
  }, [activeProfileId]);

  const latestSession = allSessions.length > 0
    ? allSessions.reduce((a, b) => (b.createdAt > a.createdAt ? b : a))
    : null;

  const recentSessions = [...allSessions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return {
    today, todaySessions, todayStats, allTimeStats, weekStats, allSessions,
    recentSessions, latestSession, loading, reload: load, cancelOpenSession,
  };
}
