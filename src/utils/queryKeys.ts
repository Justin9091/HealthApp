/**
 * Centralised TanStack Query key factory.
 * Keeps all cache keys co-located and avoids string typos.
 */
export const queryKeys = {
  nutrition: {
    all: ['nutrition'] as const,
    food: (date: string) => ['nutrition', 'food', date] as const,
    water: (date: string) => ['nutrition', 'water', date] as const,
    summary: (date: string) => ['nutrition', 'summary', date] as const,
    weekly: () => ['nutrition', 'weekly'] as const,
  },
  fitness: {
    all: ['fitness'] as const,
    workouts: (date: string) => ['fitness', 'workouts', date] as const,
    summary: (date: string) => ['fitness', 'summary', date] as const,
    weekly: () => ['fitness', 'weekly'] as const,
  },
  health: {
    all: ['health'] as const,
    daily: (date: string) => ['health', 'daily', date] as const,
  },
  goals: ['goals'] as const,
  weight: {
    all: ['weight'] as const,
    entries: () => ['weight', 'entries'] as const,
    trend: () => ['weight', 'trend'] as const,
  },
  streak: {
    current: () => ['streak', 'current'] as const,
    longest: () => ['streak', 'longest'] as const,
  },
  insights: {
    week: () => ['insights', 'week'] as const,
  },
};
