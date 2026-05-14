export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  clear(): void;
}

const noopStorage: KeyValueStore = {
  get: () => null,
  set: () => undefined,
  clear: () => undefined,
};

export function createBrowserStorage(
  storage?: Pick<Storage, "getItem" | "setItem" | "clear">,
): KeyValueStore {
  const source =
    storage ?? (typeof window === "undefined" ? undefined : window.localStorage);

  if (!source) {
    return noopStorage;
  }

  return {
    get: (key) => source.getItem(key),
    set: (key, value) => source.setItem(key, value),
    clear: () => source.clear(),
  };
}
