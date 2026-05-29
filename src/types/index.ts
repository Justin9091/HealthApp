// ─── Nutrition Types ─────────────────────────────────────────────────────────

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  mealType: MealType;
  timestamp: string; // ISO
  servingSize: number;
  servingUnit: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: FoodEntry[];
}

// ─── Fitness Types ────────────────────────────────────────────────────────────

export interface WorkoutEntry {
  id: string;
  name: string;
  type: WorkoutType;
  durationMinutes: number;
  caloriesBurned: number;
  timestamp: string; // ISO
  notes?: string;
  heartRateAvg?: number;
  steps?: number;
  distance?: number; // meters
}

export type WorkoutType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'swimming'
  | 'strength'
  | 'yoga'
  | 'hiit'
  | 'other';

export interface FitnessSummary {
  totalCaloriesBurned: number;
  totalDurationMinutes: number;
  totalSteps: number;
  totalDistance: number;
  workouts: WorkoutEntry[];
}

// ─── Health Connect (Google Health) Types ─────────────────────────────────────

export interface HealthConnectRecord {
  recordType: string;
  startTime: string;
  endTime: string;
  value: number;
  unit: string;
}

export interface DailyHealthSummary {
  date: string;
  steps: number;
  caloriesActive: number;
  caloriesTotal: number;
  heartRateAvg: number | null;
  sleepHours: number | null;
}

// ─── Goal Types ───────────────────────────────────────────────────────────────

export interface UserGoals {
  dailyCaloriesTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  dailyStepsTarget: number;
  dailyActiveMinutesTarget: number;
  dailyWaterTarget: number; // ml
}

export const DEFAULT_GOALS: UserGoals = {
  dailyCaloriesTarget: 2000,
  dailyProteinTarget: 150,
  dailyCarbsTarget: 250,
  dailyFatTarget: 65,
  dailyStepsTarget: 10000,
  dailyActiveMinutesTarget: 30,
  dailyWaterTarget: 2500,
};

// ─── Water Types ──────────────────────────────────────────────────────────────

export interface WaterEntry {
  id: string;
  amountMl: number;
  timestamp: string;
}
