import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllSessions } from '@/utils/storage';
import { getTodayString, getWeekRange, getMonthRange } from '@/utils/formatters';
import type { Session } from '@/types';

export function useStatsData(profileId: string | null) {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllSessions(profileId ?? undefined);
    if (!mountedRef.current) return;
    setAllSessions(all);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const today = getTodayString();

  const { todaySessions, weekSessions, monthSessions, totals } = useMemo(() => {
    const { start: wS, end: wE } = getWeekRange(today);
    const { start: mS, end: mE } = getMonthRange(today);
    return {
      todaySessions: allSessions.filter((s) => s.date === today),
      weekSessions: allSessions.filter((s) => s.date >= wS && s.date <= wE),
      monthSessions: allSessions.filter((s) => s.date >= mS && s.date <= mE),
      totals: allSessions.reduce(
        (acc, s) => ({
          exp: acc.exp + s.expGainedActual,
          frags: acc.frags + s.fragsGained,
          nodes: acc.nodes + s.nodesGained,
          mesos: acc.mesos + s.mesosGained,
          common: acc.common + s.commonFamiliarsGained,
          rare: acc.rare + s.rareFamiliarsGained,
        }),
        { exp: 0, frags: 0, nodes: 0, mesos: 0, common: 0, rare: 0 }
      ),
    };
  }, [allSessions, today]);

  return { allSessions, todaySessions, weekSessions, monthSessions, totals, loading, reload: load };
}
