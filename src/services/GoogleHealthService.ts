import {
  initialize,
  requestPermission,
  readRecords,
  insertRecords,
  Permission,
} from 'react-native-health-connect';
import { DailyHealthSummary } from '../types';

/**
 * GoogleHealthService — bridges with Google Health Connect (Android) / Apple HealthKit (iOS).
 *
 * Responsibilities:
 *  - Permission request & management
 *  - Reading steps, calories, heart rate, sleep from the platform health store
 *  - Writing nutrition & workout records back to the health store
 *
 * Architecture note: this service is a pure integration adapter. All business
 * logic (summaries, goals) lives in NutritionService / FitnessService.
 */
export class GoogleHealthService {
  private static instance: GoogleHealthService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GoogleHealthService {
    if (!GoogleHealthService.instance) {
      GoogleHealthService.instance = new GoogleHealthService();
    }
    return GoogleHealthService.instance;
  }

  // ─── Init & Permissions ───────────────────────────────────────────────────

  async init(): Promise<boolean> {
    try {
      const available = await initialize();
      this.isInitialized = available;
      return available;
    } catch (error) {
      console.warn('[GoogleHealthService] init failed:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isInitialized) {
      const ok = await this.init();
      if (!ok) return false;
    }

    const permissions: Permission[] = [
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'write', recordType: 'Steps' },
      { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'write', recordType: 'Nutrition' },
      { accessType: 'write', recordType: 'ExerciseSession' },
    ];

    try {
      const granted = await requestPermission(permissions);
      return granted.length > 0;
    } catch (error) {
      console.warn('[GoogleHealthService] requestPermissions failed:', error);
      return false;
    }
  }

  // ─── Read Helpers ─────────────────────────────────────────────────────────

  private dayRange(date: string): { startTime: string; endTime: string } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  }

  async getSteps(date: string): Promise<number> {
    try {
      const { records } = await readRecords('Steps', {
        timeRangeFilter: { operator: 'between', ...this.dayRange(date) },
      });
      return records.reduce(
        (sum: number, r) => sum + ((r as { count?: number }).count ?? 0),
        0,
      );
    } catch {
      return 0;
    }
  }

  async getActiveCalories(date: string): Promise<number> {
    try {
      const { records } = await readRecords('ActiveCaloriesBurned', {
        timeRangeFilter: { operator: 'between', ...this.dayRange(date) },
      });
      return records.reduce(
        (sum: number, r) =>
          sum +
          ((r as { energy?: { inKilocalories?: number } }).energy
            ?.inKilocalories ?? 0),
        0,
      );
    } catch {
      return 0;
    }
  }

  async getAverageHeartRate(date: string): Promise<number | null> {
    try {
      const { records } = await readRecords('HeartRate', {
        timeRangeFilter: { operator: 'between', ...this.dayRange(date) },
      });
      if (!records.length) return null;
      type HRSample = { beatsPerMinute: number };
      const allSamples = records.flatMap(
        r => (r as { samples?: HRSample[] }).samples ?? [],
      );
      if (!allSamples.length) return null;
      const avg =
        allSamples.reduce((sum: number, s) => sum + s.beatsPerMinute, 0) /
        allSamples.length;
      return Math.round(avg);
    } catch {
      return null;
    }
  }

  async getSleepHours(date: string): Promise<number | null> {
    try {
      const { records } = await readRecords('SleepSession', {
        timeRangeFilter: { operator: 'between', ...this.dayRange(date) },
      });
      if (!records.length) return null;
      type SleepRecord = { startTime: string; endTime: string };
      const totalMs = records.reduce((sum: number, r) => {
        const rec = r as SleepRecord;
        return (
          sum +
          (new Date(rec.endTime).getTime() - new Date(rec.startTime).getTime())
        );
      }, 0);
      return Math.round((totalMs / 3_600_000) * 10) / 10;
    } catch {
      return null;
    }
  }

  /** Fetches a combined daily summary from Health Connect */
  async getDailySummary(date: string): Promise<DailyHealthSummary> {
    const [steps, caloriesActive, heartRateAvg, sleepHours] = await Promise.all(
      [
        this.getSteps(date),
        this.getActiveCalories(date),
        this.getAverageHeartRate(date),
        this.getSleepHours(date),
      ],
    );

    return {
      date,
      steps,
      caloriesActive,
      caloriesTotal: caloriesActive, // TotalCaloriesBurned includes BMR — keep simple here
      heartRateAvg,
      sleepHours,
    };
  }

  // ─── Write Helpers ────────────────────────────────────────────────────────

  async writeNutrition(params: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: string;
  }): Promise<void> {
    try {
      await insertRecords([
        {
          recordType: 'Nutrition',
          startTime: params.timestamp,
          endTime: params.timestamp,
          name: params.name,
          energy: { value: params.calories, unit: 'kilocalories' },
          protein: { value: params.protein, unit: 'grams' },
          totalCarbohydrate: { value: params.carbs, unit: 'grams' },
          totalFat: { value: params.fat, unit: 'grams' },
        } as any,
      ]);
    } catch (error) {
      console.warn('[GoogleHealthService] writeNutrition failed:', error);
    }
  }

  async writeExerciseSession(params: {
    name: string;
    exerciseType: number; // Health Connect ExerciseSessionRecord type code
    startTime: string;
    endTime: string;
  }): Promise<void> {
    try {
      await insertRecords([
        {
          recordType: 'ExerciseSession',
          title: params.name,
          exerciseType: params.exerciseType,
          startTime: params.startTime,
          endTime: params.endTime,
        } as any,
      ]);
    } catch (error) {
      console.warn('[GoogleHealthService] writeExerciseSession failed:', error);
    }
  }
}

export const googleHealthService = GoogleHealthService.getInstance();
