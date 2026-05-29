import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nutritionService } from '../services/NutritionService';
import { googleHealthService } from '../services/GoogleHealthService';
import { storageService } from '../services/StorageService';
import { FoodEntry, UserGoals, DEFAULT_GOALS } from '../types';
import { queryKeys } from '../utils/queryKeys';
import { todayStr } from '../utils/helpers';

export function useNutritionSummary(date = todayStr()) {
  return useQuery({
    queryKey: queryKeys.nutrition.summary(date),
    queryFn: () => nutritionService.getSummary(date),
    staleTime: 30_000,
  });
}

export function useFoodEntries(date = todayStr()) {
  return useQuery({
    queryKey: queryKeys.nutrition.food(date),
    queryFn: () => nutritionService.getFoodEntries(date),
    staleTime: 30_000,
  });
}

export function useWaterTotal(date = todayStr()) {
  return useQuery({
    queryKey: queryKeys.nutrition.water(date),
    queryFn: () => nutritionService.getTotalWaterMl(date),
    staleTime: 30_000,
  });
}

export function useWeeklyNutrition() {
  return useQuery({
    queryKey: queryKeys.nutrition.weekly(),
    queryFn: () => nutritionService.getWeeklySummaries(7),
    staleTime: 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddFood(date = todayStr()) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<FoodEntry, 'id' | 'timestamp'>) =>
      nutritionService.addFoodEntry(date, data),
    onSuccess: async entry => {
      // Write-through to Google Health Connect
      await googleHealthService.writeNutrition({
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        timestamp: entry.timestamp,
      });

      qc.invalidateQueries({ queryKey: queryKeys.nutrition.food(date) });
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.summary(date) });
    },
  });
}

export function useRemoveFood(date = todayStr()) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => nutritionService.removeFoodEntry(date, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.food(date) });
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.summary(date) });
    },
  });
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export function useGoals() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.goals,
    queryFn: async (): Promise<UserGoals> => {
      const saved = await storageService.get<UserGoals>('user:goals');
      return saved ?? DEFAULT_GOALS;
    },
    staleTime: 60_000,
  });

  const saveGoals = async (goals: UserGoals) => {
    await storageService.set('user:goals', goals);
    qc.invalidateQueries({ queryKey: queryKeys.goals });
  };

  return { ...query, saveGoals };
}

export function useAddWater(date = todayStr()) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (amountMl: number) =>
      nutritionService.addWaterEntry(date, amountMl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.water(date) });
    },
  });
}
