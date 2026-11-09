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