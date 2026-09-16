import { useCallback, useEffect, useRef, useState } from 'react';
import { getSessionsByDate, getSessionsByDateRange, aggregateStats } from '@/utils/storage';
import { getTodayString, getWeekRange, getMonthRange, addDays } from '@/utils/formatters';
import type { Session, PeriodStats } from '@/types';

export type HistoryMode = 'day' | 'week' | 'month';

export function periodRange(mode: HistoryMode, cursor: string): { start: string; end: string } {
  if (mode === 'day') return { start: cursor, end: cursor };
  if (mode === 'week') return getWeekRange(cursor);
  return getMonthRange(cursor);
}

export function shiftCursor(mode: HistoryMode, cursor: string, dir: 1 | -1): string {
  if (mode === 'day') return addDays(cursor, dir);
  if (mode === 'week') return addDays(cursor, dir * 7);
  const [y, m] = cursor.split('-').map(Number);
  const next = new Date(y, m - 1 + dir, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
}

export function useHistoryData(mode: HistoryMode, cursor: string, profileId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const loaded = mode === 'day'
      ? await getSessionsByDate(cursor, profileId ?? undefined)
      : await getSessionsByDateRange(periodRange(mode, cursor).start, periodRange(mode, cursor).end, profileId ?? undefined);
    if (!mountedRef.current) return;
    setSessions(loaded);
    setStats(aggregateStats(loaded));
    setLoading(false);
  }, [mode, cursor, profileId]);

  useEffect(() => { load(); }, [load]);

  return { sessions, stats, loading, reload: load };
}

export function useTodayCursor() {
  const [cursor, setCursor] = useState(getTodayString());
  return { cursor, setCursor, today: getTodayString() };
}
