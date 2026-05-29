import { format, isToday, isYesterday } from 'date-fns';
import { nl } from 'date-fns/locale';

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'Vandaag';
  if (isYesterday(d)) return 'Gisteren';
  return format(d, 'd MMMM', { locale: nl });
};

export const formatTime = (iso: string): string =>
  format(new Date(iso), 'HH:mm');

export const todayStr = (): string => format(new Date(), 'yyyy-MM-dd');

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const pct = (value: number, total: number): number =>
  total === 0 ? 0 : clamp(Math.round((value / total) * 100), 0, 100);
