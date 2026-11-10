import { getUserDb } from "./userDb";
import { getRecentDays } from "./settings";
import { toSavedWord, type SavedWord, type SavedWordRow } from "./saved";

export type QuizSource =
  | { kind: "recent" }
  | { kind: "all" }
  | { kind: "collection"; id: number };

const DUE = "(w.due_at IS NULL OR w.due_at <= ?)";
// Words already reviewed come first (oldest due first), then new words.
const ORDER = "ORDER BY w.due_at IS NULL, w.due_at, w.saved_at";

export async function getDueWords(source: QuizSource, limit = 20): Promise<SavedWord[]> {
  const db = await getUserDb();
  const now = Date.now();
  let rows: SavedWordRow[];

  if (source.kind === "collection") {
    rows = await db.getAllAsync<SavedWordRow>(
      `SELECT w.* FROM saved_words w
       JOIN collection_words cw ON cw.word_id = w.id
       WHERE cw.collection_id = ? AND ${DUE} ${ORDER} LIMIT ?`,
      [source.id, now, limit]
    );
  } else if (source.kind === "recent") {
    const since = now - (await getRecentDays()) * 24 * 60 * 60 * 1000;
    rows = await db.getAllAsync<SavedWordRow>(
      `SELECT w.* FROM saved_words w
       WHERE w.saved_at >= ? AND ${DUE} ${ORDER} LIMIT ?`,
      [since, now, limit]
    );
  } else {
    rows = await db.getAllAsync<SavedWordRow>(
      `SELECT w.* FROM saved_words w WHERE ${DUE} ${ORDER} LIMIT ?`,
      [now, limit]
    );
  }
  return rows.map(toSavedWord);
}