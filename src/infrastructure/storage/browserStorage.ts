export const browserStorage = {
  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);

    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },
};