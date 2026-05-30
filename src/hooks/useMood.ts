import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moodService, EnergyLevel } from '../services/MoodService';

const KEYS = {
  entry: (date: string) => ['mood', 'entry', date] as const,
  history: (today: string) => ['mood', 'history', today] as const,
};

export function useMoodEntry(date: string) {
  return useQuery({
    queryKey: KEYS.entry(date),
    queryFn: () => moodService.getEntry(date),
    staleTime: 60_000,
  });
}

export function useMoodHistory(today: string) {
  return useQuery({
    queryKey: KEYS.history(today),
    queryFn: () => moodService.getLast7Days(today),
    staleTime: 60_000,
  });
}

export function useLogMood(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ energy, note }: { energy: EnergyLevel; note?: string }) =>
      moodService.logEnergy(date, energy, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood'] });
    },
  });
}
