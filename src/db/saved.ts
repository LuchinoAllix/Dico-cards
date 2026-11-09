import { getUserDb } from "./userDb";

interface WordRef {
  id: string;
  headword: string;
  language: string;
}

export async function saveWord(word: WordRef): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT OR IGNORE INTO saved_words (id, language, headword, saved_at) VALUES (?, ?, ?, ?)",
    [word.id, word.language, word.headword, Date.now()]
  );
}

export async function unsaveWord(id: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync("DELETE FROM saved_words WHERE id = ?", [id]);
}

export async function isSaved(id: string): Promise<boolean> {
  const db = await getUserDb();
  const row = await db.getFirstAsync("SELECT 1 FROM saved_words WHERE id = ?", [id]);
  return row !== null;
}

export interface SavedWord {
  id: string;
  language: string;
  headword: string;
  savedAt: number;
}

export interface SavedWordRow {
  id: string;
  language: string;
  headword: string;
  saved_at: number;
}

// SQL columns are snake_case, our TypeScript is camelCase: convert in one place.
export function toSavedWord(row: SavedWordRow): SavedWord {
  return { id: row.id, language: row.language, headword: row.headword, savedAt: row.saved_at };
}

export async function getSavedWords(): Promise<SavedWord[]> {
  const db = await getUserDb();
  const rows = await db.getAllAsync<SavedWordRow>(
    "SELECT * FROM saved_words ORDER BY saved_at DESC"
  );
  return rows.map(toSavedWord);
}

export async function getRecentWords(days: number): Promise<SavedWord[]> {
  const db = await getUserDb();
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const rows = await db.getAllAsync<SavedWordRow>(
    "SELECT * FROM saved_words WHERE saved_at >= ? ORDER BY saved_at DESC",
    [since]
  );
  return rows.map(toSavedWord);
}