import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { googleHealthService } from '../services/GoogleHealthService';
import { queryKeys } from '../utils/queryKeys';
import { todayStr } from '../utils/helpers';

export function useHealthPermissions() {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await googleHealthService.requestPermissions();
        if (!cancelled) setGranted(ok);
      } catch {
        if (!cancelled) setGranted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return granted;
}

export function useDailyHealthSummary(date = todayStr()) {
  return useQuery({
    queryKey: queryKeys.health.daily(date),
    queryFn: () => googleHealthService.getDailySummary(date),
    staleTime: 60_000,
    retry: 1,
  });
}
