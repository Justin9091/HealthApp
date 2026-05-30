// ─── Design System ────────────────────────────────────────────────────────────
// Palette: Vibrant lavender-violet primary + emerald wellness accent

export const colors = {
  // Brand
  primary: '#7C3AED', // deep violet
  primaryLight: '#EDE9FE',
  primaryDark: '#5B21B6',
  secondary: '#059669', // emerald green
  secondaryLight: '#D1FAE5',
  accent: '#F59E0B', // amber
  accentLight: '#FEF3C7',

  // Danger / error
  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  // Macros
  protein: '#3B82F6', // blue
  carbs: '#F59E0B',   // amber
  fat: '#A855F7',     // purple
  calories: '#7C3AED', // alias primary

  // Surfaces — lavender-tinted neutral
  background: '#F5F3FF',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF8FF',
  surfaceWarm: '#FDFCFF',

  // Text
  text: '#1E1B4B',
  textSecondary: '#6D6899',
  textMuted: '#A5A3C0',

  // Borders
  border: '#DDD6FE',
  borderLight: '#EDE9FE',
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
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const gradients = {
  hero: ['#7C3AED', '#5B21B6'],
  sage: ['#059669', '#047857'],
  warm: ['#F5F3FF', '#EDE9FE'],
  golden: ['#F59E0B', '#D97706'],
};
