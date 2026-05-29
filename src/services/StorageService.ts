import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * StorageService — thin wrapper around AsyncStorage with typed get/set helpers.
 * All data is keyed by date (YYYY-MM-DD) so daily records are cleanly isolated.
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async update<T extends object>(
    key: string,
    patch: Partial<T>,
  ): Promise<T | null> {
    const existing = await this.get<T>(key);
    const updated = { ...(existing ?? {}), ...patch } as T;
    await this.set(key, updated);
    return updated;
  }

  async getList<T>(key: string): Promise<T[]> {
    return (await this.get<T[]>(key)) ?? [];
  }

  async appendToList<T>(key: string, item: T): Promise<T[]> {
    const list = await this.getList<T>(key);
    const updated = [...list, item];
    await this.set(key, updated);
    return updated;
  }

  async removeFromList<T extends { id: string }>(
    key: string,
    id: string,
  ): Promise<T[]> {
    const list = await this.getList<T>(key);
    const updated = list.filter(item => item.id !== id);
    await this.set(key, updated);
    return updated;
  }

  async removeKey(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  /** Returns all AsyncStorage keys that start with the given prefix */
  async getKeysByPrefix(prefix: string): Promise<string[]> {
    const all = await AsyncStorage.getAllKeys();
    return all.filter(k => k.startsWith(prefix));
  }
}

export const storageService = StorageService.getInstance();
