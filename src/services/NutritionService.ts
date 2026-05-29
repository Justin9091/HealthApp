import { format } from 'date-fns';
import { FoodEntry, NutritionSummary, WaterEntry } from '../types';
import { storageService } from './StorageService';
import { generateId } from '../utils/helpers';

const FOOD_KEY = (date: string) => `nutrition:food:${date}`;
const WATER_KEY = (date: string) => `nutrition:water:${date}`;

/**
 * NutritionService — manages all food & water logging.
 *
 * Responsibilities:
 *  - CRUD for FoodEntry per day
 *  - CRUD for WaterEntry per day
 *  - Computing NutritionSummary for a given date
 */
export class NutritionService {
  private static instance: NutritionService;

  private constructor() {}

  static getInstance(): NutritionService {
    if (!NutritionService.instance) {
      NutritionService.instance = new NutritionService();
    }
    return NutritionService.instance;
  }

  // ─── Food ──────────────────────────────────────────────────────────────────

  async getFoodEntries(date: string): Promise<FoodEntry[]> {
    return storageService.getList<FoodEntry>(FOOD_KEY(date));
  }

  async addFoodEntry(
    date: string,
    data: Omit<FoodEntry, 'id' | 'timestamp'>,
  ): Promise<FoodEntry> {
    const entry: FoodEntry = {
      ...data,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    await storageService.appendToList(FOOD_KEY(date), entry);
    return entry;
  }

  async removeFoodEntry(date: string, id: string): Promise<void> {
    await storageService.removeFromList<FoodEntry>(FOOD_KEY(date), id);
  }

  async updateFoodEntry(
    date: string,
    id: string,
    patch: Partial<FoodEntry>,
  ): Promise<FoodEntry[]> {
    const entries = await this.getFoodEntries(date);
    const updated = entries.map(e => (e.id === id ? { ...e, ...patch } : e));
    await storageService.set(FOOD_KEY(date), updated);
    return updated;
  }

  // ─── Water ─────────────────────────────────────────────────────────────────

  async getWaterEntries(date: string): Promise<WaterEntry[]> {
    return storageService.getList<WaterEntry>(WATER_KEY(date));
  }

  async addWaterEntry(date: string, amountMl: number): Promise<WaterEntry> {
    const entry: WaterEntry = {
      id: generateId(),
      amountMl,
      timestamp: new Date().toISOString(),
    };
    await storageService.appendToList(WATER_KEY(date), entry);
    return entry;
  }

  async removeWaterEntry(date: string, id: string): Promise<void> {
    await storageService.removeFromList<WaterEntry>(WATER_KEY(date), id);
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  async getSummary(date: string): Promise<NutritionSummary> {
    const entries = await this.getFoodEntries(date);
    return {
      totalCalories: entries.reduce((sum, e) => sum + e.calories, 0),
      totalProtein: entries.reduce((sum, e) => sum + e.protein, 0),
      totalCarbs: entries.reduce((sum, e) => sum + e.carbs, 0),
      totalFat: entries.reduce((sum, e) => sum + e.fat, 0),
      entries,
    };
  }

  async getTotalWaterMl(date: string): Promise<number> {
    const entries = await this.getWaterEntries(date);
    return entries.reduce((sum, e) => sum + e.amountMl, 0);
  }

  /** Returns unique recent food items across the last N days, newest first, deduped by name */
  async getRecentFoods(days = 14): Promise<FoodEntry[]> {
    const seen = new Set<string>();
    const result: FoodEntry[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const entries = await this.getFoodEntries(dateStr);
      for (const entry of [...entries].reverse()) {
        const key = entry.name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(entry);
        }
      }
    }
    return result;
  }

  /** Returns summaries for the last N days (newest first) */
  async getWeeklySummaries(
    days = 7,
  ): Promise<Array<NutritionSummary & { date: string }>> {
    const summaries = await Promise.all(
      Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        return this.getSummary(dateStr).then(s => ({ ...s, date: dateStr }));
      }),
    );
    return summaries;
  }
}

export const nutritionService = NutritionService.getInstance();
