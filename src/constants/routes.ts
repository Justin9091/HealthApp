export const Routes = {
  // Tabs
  DASHBOARD: 'Dashboard',
  LOG_FOOD: 'LogFood',
  LOG_WORKOUT: 'LogWorkout',
  PROGRESS: 'Progress',
  PROFILE: 'Profile',
  // Stack
  TABS: 'Tabs',
  CHAT: 'Chat',
  ACHIEVEMENTS: 'Achievements',
  HISTORY: 'History',
  GOALS: 'Goals',
  WEEKLY_REPORT: 'WeeklyReport',
  DAILY_REPORT: 'DailyReport',
} as const;

export type MainStackParamList = {
  [Routes.TABS]: undefined;
  [Routes.CHAT]: undefined;
  [Routes.ACHIEVEMENTS]: undefined;
  [Routes.HISTORY]: undefined;
  [Routes.GOALS]: undefined;
  [Routes.WEEKLY_REPORT]: undefined;
  [Routes.DAILY_REPORT]: undefined;
};

export type TabParamList = {
  [Routes.DASHBOARD]: undefined;
  [Routes.LOG_FOOD]: undefined;
  [Routes.LOG_WORKOUT]: undefined;
  [Routes.PROGRESS]: undefined;
  [Routes.PROFILE]: undefined;
};
