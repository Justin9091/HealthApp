import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fitnessService } from '../services/FitnessService';
import { googleHealthService } from '../services/GoogleHealthService';
import { WorkoutEntry, WorkoutType } from '../types';
import { queryKeys } from '../utils/queryKeys';
import { todayStr } from '../utils/helpers';

const EXERCISE_TYPE_MAP: Record<WorkoutType, number> = {
  running: 8, // RUNNING
  walking: 79, // WALKING
  cycling: 9, // BIKING
  swimming: 74, // SWIMMING_POOL
  strength: 80, // WEIGHTLIFTING
  yoga: 61, // YOGA
  hiit: 26, // HIGH_INTENSITY_INTERVAL_TRAINING
  other: 0, // OTHER
};

export function useFitnessWorkouts(date = todayStr()) {
  return useQuery({
    queryKey: queryKeys.fitness.workouts(date),
    queryFn: () => fitnessService.getWorkouts(date),
    staleTime: 30_000,
  });
}

export function useFitnessSummary(date = todayStr()) {
  return useQuery({
    queryKey: queryKeys.fitness.summary(date),
    queryFn: () => fitnessService.getSummary(date),
    staleTime: 30_000,
  });
}

export function useWeeklyFitness() {
  return useQuery({
    queryKey: queryKeys.fitness.weekly(),
    queryFn: () => fitnessService.getWeeklySummaries(7),
    staleTime: 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddWorkout(date = todayStr()) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<WorkoutEntry, 'id' | 'timestamp'>) =>
      fitnessService.addWorkout(date, data),
    onSuccess: async entry => {
      // Write-through to Google Health Connect
      const startTime = entry.timestamp;
      const endTime = new Date(
        new Date(startTime).getTime() + entry.durationMinutes * 60_000,
      ).toISOString();

      await googleHealthService.writeExerciseSession({
        name: entry.name,
        exerciseType: EXERCISE_TYPE_MAP[entry.type] ?? 0,
        startTime,
        endTime,
      });

      qc.invalidateQueries({ queryKey: queryKeys.fitness.workouts(date) });
      qc.invalidateQueries({ queryKey: queryKeys.fitness.summary(date) });
    },
  });
}

export function useRemoveWorkout(date = todayStr()) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fitnessService.removeWorkout(date, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fitness.workouts(date) });
      qc.invalidateQueries({ queryKey: queryKeys.fitness.summary(date) });
    },
  });
}
