// ─── Design System ────────────────────────────────────────────────────────────
// Palette: Clean white & light grey, with a vibrant coral + green accent

export const colors = {
  // Brand
  primary: '#FF6B6B', // vivid coral
  primaryLight: '#FFF0F0',
  primaryDark: '#E04E4E',
  secondary: '#4CAF82', // fresh green
  secondaryLight: '#E8F8F0',
  accent: '#F5A623', // warm orange
  accentLight: '#FEF6E7',

  // Danger / error
  danger: '#E53935',
  dangerLight: '#FFEBEE',

  // Macros
  protein: '#4A90D9', // clear blue
  carbs: '#F5A623', // orange
  fat: '#B06FD4', // purple
  calories: '#FF6B6B', // alias primary

  // Surfaces — crisp white/grey (no yellow tint)
  background: '#F2F4F7', // neutral light grey
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FC', // very subtle grey
  surfaceWarm: '#FAFBFD',

  // Text — neutral near-black
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 32,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const gradients = {
  hero: ['#FF6B6B', '#E04E4E'],
  sage: ['#4CAF82', '#2E8B5A'],
  warm: ['#F2F4F7', '#E5E7EB'],
  golden: ['#F5A623', '#E09010'],
};
