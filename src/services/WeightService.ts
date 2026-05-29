import { storageService } from './StorageService';
import { generateId } from '../utils/helpers';

const WEIGHT_KEY = 'weight:entries';

export interface WeightEntry {
  id: string;
  weightKg: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface WeightTrend {
  avgLast7: number | null;
  avgPrev7: number | null;
  /** Positive = gained, negative = lost, null = not enough data */
  delta: number | null;
}

export class WeightService {
  private static instance: WeightService;

  private constructor() {}

  static getInstance(): WeightService {
    if (!WeightService.instance) {
      WeightService.instance = new WeightService();
    }
    return WeightService.instance;
  }

  async addEntry(
    weightKg: number,
    date: string,
    note?: string,
  ): Promise<WeightEntry> {
    const entry: WeightEntry = {
      id: generateId(),
      weightKg,
      date,
      note,
    };
    await storageService.appendToList<WeightEntry>(WEIGHT_KEY, entry);
    return entry;
  }

  async getEntries(): Promise<WeightEntry[]> {
    const entries = await storageService.getList<WeightEntry>(WEIGHT_KEY);
    // Sort newest first
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getRecentEntries(n: number): Promise<WeightEntry[]> {
    const entries = await this.getEntries();
    return entries.slice(0, n);
  }

  async removeEntry(id: string): Promise<void> {
    await storageService.removeFromList<WeightEntry>(WEIGHT_KEY, id);
  }

  async getTrend(): Promise<WeightTrend> {
    const entries = await this.getEntries(); // newest first
    if (entries.length === 0)
      return { avgLast7: null, avgPrev7: null, delta: null };

    const last7 = entries.slice(0, 7);
    const prev7 = entries.slice(7, 14);

    const avg = (arr: WeightEntry[]) =>
      arr.length === 0
        ? null
        : arr.reduce((s, e) => s + e.weightKg, 0) / arr.length;

    const avgLast7 = avg(last7);
    const avgPrev7 = avg(prev7);
    const delta =
      avgLast7 !== null && avgPrev7 !== null
        ? Math.round((avgLast7 - avgPrev7) * 10) / 10
        : null;

    return { avgLast7, avgPrev7, delta };
  }
}

export const weightService = WeightService.getInstance();
