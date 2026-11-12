import { getUserDb } from "./userDb";
import { getRecentDays } from "./settings";
import { toSavedWord, type SavedWord, type SavedWordRow } from "./saved";
import type { QuizModeId } from "../quiz/types";

export type QuizSource =
  | { kind: "recent" }
  | { kind: "all" }
  | { kind: "collection"; id: number };

// A word with no schedule row for this mode has cs.due_at = NULL: it's new, so it's due.
const FROM = "FROM saved_words w LEFT JOIN card_states cs ON cs.word_id = w.id AND cs.mode = ?";
const DUE = "(cs.due_at IS NULL OR cs.due_at <= ?)";
// Reviews first (oldest due first), then new words.
const ORDER = "ORDER BY cs.due_at IS NULL, cs.due_at, w.saved_at";

export async function getDueWords(
  source: QuizSource,
  mode: QuizModeId,
  limit = 20
): Promise<SavedWord[]> {
  const db = await getUserDb();
  const now = Date.now();
  let rows: SavedWordRow[];

  // The values in each array must follow the order of the ? in the SQL.
  if (source.kind === "collection") {
    rows = await db.getAllAsync<SavedWordRow>(
      `SELECT w.* ${FROM}
       JOIN collection_words cw ON cw.word_id = w.id
       WHERE cw.collection_id = ? AND ${DUE} ${ORDER} LIMIT ?`,
      [mode, source.id, now, limit]
    );
  } else if (source.kind === "recent") {
    const since = now - (await getRecentDays()) * 24 * 60 * 60 * 1000;
    rows = await db.getAllAsync<SavedWordRow>(
      `SELECT w.* ${FROM} WHERE w.saved_at >= ? AND ${DUE} ${ORDER} LIMIT ?`,
      [mode, since, now, limit]
    );
  } else {
    rows = await db.getAllAsync<SavedWordRow>(
      `SELECT w.* ${FROM} WHERE ${DUE} ${ORDER} LIMIT ?`,
      [mode, now, limit]
    );
  }
  return rows.map(toSavedWord);
}