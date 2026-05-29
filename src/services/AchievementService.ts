import { storageService } from './StorageService';
import { nutritionService } from './NutritionService';
import { fitnessService } from './FitnessService';
import { weightService } from './WeightService';
import { streakService } from './StreakService';

export type AchievementCategory =
  | 'streak'
  | 'nutrition'
  | 'fitness'
  | 'weight'
  | 'milestone';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  /** null = locked, ISO string = date unlocked */
  unlockedAt: string | null;
  /** 0–100, shown when locked */
  progress: number;
  /** target value for progress bar */
  target: number;
  /** current value */
  current: number;
}

const UNLOCKED_KEY = 'achievements:unlocked'; // Record<id, ISO string>

// ─── Achievement definitions ──────────────────────────────────────────────────

const DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress' | 'current'>[] =
  [
    // Streak
    {
      id: 'streak_3',
      title: 'Op rolletjes',
      description: '3 dagen op rij gelogd',
      icon: '🔥',
      category: 'streak',
      target: 3,
    },
    {
      id: 'streak_7',
      title: 'Weekkampioen',
      description: '7 dagen op rij gelogd',
      icon: '🏆',
      category: 'streak',
      target: 7,
    },
    {
      id: 'streak_14',
      title: 'Twee weken sterk',
      description: '14 dagen op rij gelogd',
      icon: '💎',
      category: 'streak',
      target: 14,
    },
    {
      id: 'streak_30',
      title: 'Maandmachtig',
      description: '30 dagen op rij gelogd',
      icon: '🌟',
      category: 'streak',
      target: 30,
    },
    // Nutrition
    {
      id: 'food_10',
      title: 'Beginnerkok',
      description: '10 maaltijden gelogd',
      icon: '🍽️',
      category: 'nutrition',
      target: 10,
    },
    {
      id: 'food_50',
      title: 'Voedingsgoeroe',
      description: '50 maaltijden gelogd',
      icon: '🥗',
      category: 'nutrition',
      target: 50,
    },
    {
      id: 'food_100',
      title: 'Macro-meester',
      description: '100 maaltijden gelogd',
      icon: '👨‍🍳',
      category: 'nutrition',
      target: 100,
    },
    {
      id: 'water_7',
      title: 'Waterwachter',
      description: '7 dagen waterdoel gehaald',
      icon: '💧',
      category: 'nutrition',
      target: 7,
    },
    // Fitness
    {
      id: 'workout_1',
      title: 'Eerste stap',
      description: 'Eerste training gelogd',
      icon: '👟',
      category: 'fitness',
      target: 1,
    },
    {
      id: 'workout_10',
      title: 'Sportief bezig',
      description: '10 trainingen gelogd',
      icon: '💪',
      category: 'fitness',
      target: 10,
    },
    {
      id: 'workout_25',
      title: 'Fitnessfreak',
      description: '25 trainingen gelogd',
      icon: '🏋️',
      category: 'fitness',
      target: 25,
    },
    {
      id: 'workout_50',
      title: 'Atleet',
      description: '50 trainingen gelogd',
      icon: '🥇',
      category: 'fitness',
      target: 50,
    },
    // Weight
    {
      id: 'weight_1',
      title: 'Weegschaal held',
      description: 'Eerste gewichtsmeting',
      icon: '⚖️',
      category: 'weight',
      target: 1,
    },
    {
      id: 'weight_7',
      title: 'Consistent wegen',
      description: '7 gewichtsmetingen',
      icon: '📉',
      category: 'weight',
      target: 7,
    },
    // Milestone
    {
      id: 'days_7',
      title: 'Een week erin',
      description: '7 dagen app gebruikt',
      icon: '📅',
      category: 'milestone',
      target: 7,
    },
    {
      id: 'days_30',
      title: 'Maandlid',
      description: '30 dagen app gebruikt',
      icon: '🗓️',
      category: 'milestone',
      target: 30,
    },
  ];

export class AchievementService {
  private static instance: AchievementService;
  static getInstance() {
    if (!AchievementService.instance)
      AchievementService.instance = new AchievementService();
    return AchievementService.instance;
  }

  private async getUnlocked(): Promise<Record<string, string>> {
    return (
      (await storageService.get<Record<string, string>>(UNLOCKED_KEY)) ?? {}
    );
  }

  private async unlock(
    id: string,
    unlocked: Record<string, string>,
  ): Promise<boolean> {
    if (unlocked[id]) return false;
    unlocked[id] = new Date().toISOString();
    await storageService.set(UNLOCKED_KEY, unlocked);
    return true;
  }

  /** Evaluate all achievements and return the full list with progress. */
  async evaluate(): Promise<Achievement[]> {
    const unlocked = await this.getUnlocked();

    // Gather data
    const [streak, longestStreak, weightEntries] = await Promise.all([
      streakService.getCurrentStreak(),
      streakService.getLongestStreak(),
      weightService.getEntries(),
    ]);

    // Count total food entries over last 90 days
    let totalFood = 0;
    let totalWorkouts = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const [nutSummary, fitSummary] = await Promise.all([
        nutritionService.getSummary(date),
        fitnessService.getSummary(date),
      ]);
      totalFood += nutSummary.entries.length;
      totalWorkouts += fitSummary.workouts.length;
    }

    // Days since first food entry (approximate app usage)
    const daysUsed = longestStreak > 0 ? longestStreak : totalFood > 0 ? 1 : 0;

    const currentValues: Record<string, number> = {
      streak_3: streak,
      streak_7: streak,
      streak_14: streak,
      streak_30: streak,
      food_10: totalFood,
      food_50: totalFood,
      food_100: totalFood,
      water_7: 0, // simplified
      workout_1: totalWorkouts,
      workout_10: totalWorkouts,
      workout_25: totalWorkouts,
      workout_50: totalWorkouts,
      weight_1: weightEntries.length,
      weight_7: weightEntries.length,
      days_7: daysUsed,
      days_30: daysUsed,
    };

    // Auto-unlock achievements based on current values
    for (const def of DEFINITIONS) {
      const current = currentValues[def.id] ?? 0;
      if (current >= def.target) {
        await this.unlock(def.id, unlocked);
      }
    }

    return DEFINITIONS.map(def => {
      const current = currentValues[def.id] ?? 0;
      return {
        ...def,
        unlockedAt: unlocked[def.id] ?? null,
        current: Math.min(current, def.target),
        progress: Math.min(Math.round((current / def.target) * 100), 100),
      };
    }).sort((a, b) => {
      // Unlocked first, then by progress desc
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      return b.progress - a.progress;
    });
  }

  async getUnlockedCount(): Promise<number> {
    const unlocked = await this.getUnlocked();
    return Object.keys(unlocked).length;
  }
}

export const achievementService = AchievementService.getInstance();
