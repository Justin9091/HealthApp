import { nutritionService } from './NutritionService';
import { fitnessService } from './FitnessService';
import { storageService } from './StorageService';
import { UserGoals, DEFAULT_GOALS } from '../types';

const DAYS_OF_WEEK = [
  'zondag',
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
];

/**
 * InsightsService — generates Dutch-language insight strings based on real weekly data.
 */
export class InsightsService {
  private static instance: InsightsService;

  private constructor() {}

  static getInstance(): InsightsService {
    if (!InsightsService.instance) {
      InsightsService.instance = new InsightsService();
    }
    return InsightsService.instance;
  }

  async analyzeWeek(): Promise<string[]> {
    const insights: string[] = [];

    const goals =
      (await storageService.get<UserGoals>('user:goals')) ?? DEFAULT_GOALS;
    const [nutritionWeek, fitnessWeek] = await Promise.all([
      nutritionService.getWeeklySummaries(7),
      fitnessService.getWeeklySummaries(7),
    ]);

    // ─── Nutrition insights ──────────────────────────────────────────────────

    const daysWithFood = nutritionWeek.filter(d => d.entries.length > 0);

    if (daysWithFood.length > 0) {
      // Protein percentage of goal
      const avgProtein =
        daysWithFood.reduce((s, d) => s + d.totalProtein, 0) /
        daysWithFood.length;
      const proteinPct = Math.round(
        (avgProtein / goals.dailyProteinTarget) * 100,
      );
      if (proteinPct > 0) {
        insights.push(`Je haalt gemiddeld ${proteinPct}% van je eiwitdoel`);
      }

      // Calorie adherence
      const avgCalories =
        daysWithFood.reduce((s, d) => s + d.totalCalories, 0) /
        daysWithFood.length;
      const caloriePct = Math.round(
        (avgCalories / goals.dailyCaloriesTarget) * 100,
      );
      if (caloriePct >= 90 && caloriePct <= 110) {
        insights.push('Je zit deze week goed op je caloriedoel, top!');
      } else if (caloriePct < 80) {
        insights.push(
          `Je at gemiddeld ${caloriePct}% van je caloriedoel — zorg voor voldoende energie`,
        );
      } else if (caloriePct > 115) {
        insights.push(
          `Je at gemiddeld ${caloriePct}% van je caloriedoel deze week`,
        );
      }
    }

    // ─── Fitness insights ────────────────────────────────────────────────────

    const daysWithWorkout = fitnessWeek.filter(d => d.workouts.length > 0);

    if (daysWithWorkout.length > 0) {
      // Most active day of the week
      let maxMinutes = 0;
      let busiestDayName = '';
      daysWithWorkout.forEach(d => {
        if (d.totalDurationMinutes > maxMinutes) {
          maxMinutes = d.totalDurationMinutes;
          const dayIndex = new Date(d.date).getDay();
          busiestDayName = DAYS_OF_WEEK[dayIndex];
        }
      });
      if (busiestDayName) {
        insights.push(`Je traint het meest op ${busiestDayName}`);
      }

      // Active minutes vs goal
      const avgActiveMin =
        daysWithWorkout.reduce((s, d) => s + d.totalDurationMinutes, 0) /
        daysWithWorkout.length;
      if (avgActiveMin >= goals.dailyActiveMinutesTarget) {
        insights.push(
          `Je haalt je bewegingsdoel van ${goals.dailyActiveMinutesTarget} minuten op trainingsdagen`,
        );
      }

      // Training frequency
      if (daysWithWorkout.length >= 5) {
        insights.push('Geweldig! Je hebt deze week 5 of meer keer getraind');
      } else if (daysWithWorkout.length === 1) {
        insights.push(
          'Je hebt deze week 1 keer getraind — probeer wat vaker te bewegen',
        );
      }
    } else {
      insights.push(
        'Je hebt deze week nog niet getraind — zet de eerste stap!',
      );
    }

    // ─── Consistency insight ─────────────────────────────────────────────────

    if (daysWithFood.length >= 6) {
      insights.push(
        'Uitstekend! Je hebt je voeding bijna elke dag bijgehouden',
      );
    } else if (daysWithFood.length <= 2 && daysWithFood.length > 0) {
      insights.push(
        'Probeer je voeding vaker bij te houden voor betere inzichten',
      );
    }

    // Return max 3 insights so the dashboard stays clean
    return insights.slice(0, 3);
  }
}

export const insightsService = InsightsService.getInstance();
