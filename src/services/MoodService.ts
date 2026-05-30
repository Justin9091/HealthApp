import AsyncStorage from '@react-native-async-storage/async-storage';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  date: string;    // 'YYYY-MM-DD'
  energy: EnergyLevel;
  note?: string;
  timestamp: string;
}

const KEY = 'mood:entries';

async function load(): Promise<MoodEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function save(entries: MoodEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export const moodService = {
  async logEnergy(date: string, energy: EnergyLevel, note?: string): Promise<void> {
    const entries = await load();
    const idx = entries.findIndex(e => e.date === date);
    const entry: MoodEntry = { date, energy, note, timestamp: new Date().toISOString() };
    if (idx >= 0) entries[idx] = entry;
    else entries.push(entry);
    await save(entries);
  },

  async getEntry(date: string): Promise<MoodEntry | null> {
    const entries = await load();
    return entries.find(e => e.date === date) ?? null;
  },

  async getLast7Days(today: string): Promise<(MoodEntry | null)[]> {
    const entries = await load();
    const map = new Map(entries.map(e => [e.date, e]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return map.get(key) ?? null;
    });
  },
};
