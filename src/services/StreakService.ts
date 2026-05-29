import { format, subDays } from 'date-fns';
import { nutritionService } from './NutritionService';

/**
 * StreakService — calculates consecutive logging streaks based on food entries.
 * A day counts as "logged" if it has at least one FoodEntry.
 */
export class StreakService {
  private static instance: StreakService;

  private constructor() {}

  static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  /** Returns the current consecutive streak (days ending today or yesterday). */
  async getCurrentStreak(): Promise<number> {
    let streak = 0;
    let offset = 0;

    // Allow today to not be logged yet without breaking the streak
    const todaySummary = await nutritionService.getSummary(
      format(new Date(), 'yyyy-MM-dd'),
    );
    const todayLogged = todaySummary.entries.length > 0;

    if (!todayLogged) {
      // Start checking from yesterday
      offset = 1;
    }

    // Check up to 365 days back
    for (let i = offset; i < 365; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const summary = await nutritionService.getSummary(date);
      if (summary.entries.length > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /** Returns the longest ever streak by scanning all available data (up to 365 days). */
  async getLongestStreak(): Promise<number> {
    let longest = 0;
    let current = 0;

    for (let i = 0; i < 365; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const summary = await nutritionService.getSummary(date);
      if (summary.entries.length > 0) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 0;
      }
    }

    return longest;
  }
}

export const streakService = StreakService.getInstance();
