import { format } from 'date-fns';
import { FitnessSummary, WorkoutEntry, WorkoutType } from '../types';
import { storageService } from './StorageService';
import { generateId } from '../utils/helpers';

const WORKOUT_KEY = (date: string) => `fitness:workout:${date}`;

/**
 * FitnessService — manages workout & activity logging.
 *
 * Responsibilities:
 *  - CRUD for WorkoutEntry per day
 *  - Computing FitnessSummary for a given date
 *  - Weekly stats aggregation
 */
export class FitnessService {
  private static instance: FitnessService;

  private constructor() {}

  static getInstance(): FitnessService {
    if (!FitnessService.instance) {
      FitnessService.instance = new FitnessService();
    }
    return FitnessService.instance;
  }

  // ─── Workouts ──────────────────────────────────────────────────────────────

  async getWorkouts(date: string): Promise<WorkoutEntry[]> {
    return storageService.getList<WorkoutEntry>(WORKOUT_KEY(date));
  }

  async addWorkout(
    date: string,
    data: Omit<WorkoutEntry, 'id' | 'timestamp'>,
  ): Promise<WorkoutEntry> {
    const entry: WorkoutEntry = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    await storageService.appendToList(WORKOUT_KEY(date), entry);
    return entry;
  }

  async removeWorkout(date: string, id: string): Promise<void> {
    await storageService.removeFromList<WorkoutEntry>(WORKOUT_KEY(date), id);
  }

  async updateWorkout(
    date: string,
    id: string,
    patch: Partial<WorkoutEntry>,
  ): Promise<WorkoutEntry[]> {
    const workouts = await this.getWorkouts(date);
    const updated = workouts.map(w => (w.id === id ? { ...w, ...patch } : w));
    await storageService.set(WORKOUT_KEY(date), updated);
    return updated;
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  async getSummary(date: string): Promise<FitnessSummary> {
    const workouts = await this.getWorkouts(date);
    return {
      totalCaloriesBurned: workouts.reduce(
        (sum, w) => sum + w.caloriesBurned,
        0,
      ),
      totalDurationMinutes: workouts.reduce(
        (sum, w) => sum + w.durationMinutes,
        0,
      ),
      totalSteps: workouts.reduce((sum, w) => sum + (w.steps ?? 0), 0),
      totalDistance: workouts.reduce((sum, w) => sum + (w.distance ?? 0), 0),
      workouts,
    };
  }

  /** Returns summaries for the last N days (newest first) */
  async getWeeklySummaries(
    days = 7,
  ): Promise<Array<FitnessSummary & { date: string }>> {
    return Promise.all(
      Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        return this.getSummary(dateStr).then(s => ({ ...s, date: dateStr }));
      }),
    );
  }

  // ─── Workout Type Helpers ──────────────────────────────────────────────────

  getWorkoutTypeLabel(type: WorkoutType): string {
    const labels: Record<WorkoutType, string> = {
      running: '🏃 Hardlopen',
      walking: '🚶 Wandelen',
      cycling: '🚴 Fietsen',
      swimming: '🏊 Zwemmen',
      strength: '💪 Krachttraining',
      yoga: '🧘 Yoga',
      hiit: '🔥 HIIT',
      other: '⚡ Overig',
    };
    return labels[type] ?? type;
  }

  /** Estimate calories burned using MET values (per kg per minute) */
  estimateCalories(
    type: WorkoutType,
    durationMinutes: number,
    weightKg = 75,
  ): number {
    const metValues: Record<WorkoutType, number> = {
      running: 9.8,
      walking: 3.5,
      cycling: 7.5,
      swimming: 7.0,
      strength: 5.0,
      yoga: 2.5,
      hiit: 10.0,
      other: 5.0,
    };
    const met = metValues[type] ?? 5.0;
    return Math.round((met * weightKg * durationMinutes) / 60);
  }
}

export const fitnessService = FitnessService.getInstance();
