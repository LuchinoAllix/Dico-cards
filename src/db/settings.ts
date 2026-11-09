import Storage from "expo-sqlite/kv-store";

const DEFAULT_RECENT_DAYS = 7;

export async function getRecentDays(): Promise<number> {
  const value = Number(await Storage.getItem("recentDays"));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RECENT_DAYS;
}

export async function setRecentDays(days: number): Promise<void> {
  await Storage.setItem("recentDays", String(days));
}