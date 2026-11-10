import Storage from "expo-sqlite/kv-store";

export const RECENT_DAYS_OPTIONS = [1, 3, 7, 14, 30];
export const RETENTION_OPTIONS = [0.8, 0.85, 0.9, 0.95];
export const SESSION_SIZE_OPTIONS = [10, 20, 30, 50];

async function getNumber(key: string, fallback: number): Promise<number> {
  const value = Number(await Storage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function setNumber(key: string, value: number): Promise<void> {
  await Storage.setItem(key, String(value));
}

export const getRecentDays = () => getNumber("recentDays", 7);
export const setRecentDays = (n: number) => setNumber("recentDays", n);

export const getRetention = () => getNumber("retention", 0.9);
export const setRetention = (n: number) => setNumber("retention", n);

export const getSessionSize = () => getNumber("sessionSize", 20);
export const setSessionSize = (n: number) => setNumber("sessionSize", n);