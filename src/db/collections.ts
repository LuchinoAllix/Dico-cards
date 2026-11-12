import { getUserDb } from "./userDb";
import { toSavedWord, type SavedWord, type SavedWordRow } from "./saved";

export interface Collection {
  id: number;
  name: string;
  createdAt: number;
}

interface CollectionRow {
  id: number;
  name: string;
  created_at: number;
}

const toCollection = (r: CollectionRow): Collection => ({
  id: r.id,
  name: r.name,
  createdAt: r.created_at,
});

export async function renameCollection(id: number, name: string): Promise<void> {
  const clean = name.trim();
  if (!clean) throw new Error("Empty name");
  const db = await getUserDb();
  await db.runAsync("UPDATE collections SET name = ? WHERE id = ?", [clean, id]);
}

export async function deleteCollection(id: number): Promise<void> {
  const db = await getUserDb();
  await db.runAsync("DELETE FROM collections WHERE id = ?", [id]);
}

export async function createCollection(name: string, language: string): Promise<number> {
  const clean = name.trim();
  if (!clean) throw new Error("Empty name");
  const db = await getUserDb();
  const result = await db.runAsync(
    "INSERT INTO collections (name, language, created_at) VALUES (?, ?, ?)",
    [clean, language, Date.now()]
  );
  return result.lastInsertRowId;
}

export async function getCollections(language: string): Promise<Collection[]> {
  const db = await getUserDb();
  const rows = await db.getAllAsync<CollectionRow>(
    "SELECT * FROM collections WHERE language = ? ORDER BY name COLLATE NOCASE",
    [language]
  );
  return rows.map(toCollection);
}

export async function getCollection(id: number): Promise<Collection | undefined> {
  const db = await getUserDb();
  const row = await db.getFirstAsync<CollectionRow>("SELECT * FROM collections WHERE id = ?", [id]);
  return row ? toCollection(row) : undefined;
}

export async function addToCollection(collectionId: number, wordId: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "INSERT OR IGNORE INTO collection_words (collection_id, word_id) VALUES (?, ?)",
    [collectionId, wordId]
  );
}

export async function removeFromCollection(collectionId: number, wordId: string): Promise<void> {
  const db = await getUserDb();
  await db.runAsync(
    "DELETE FROM collection_words WHERE collection_id = ? AND word_id = ?",
    [collectionId, wordId]
  );
}

export async function getCollectionIdsForWord(wordId: string): Promise<number[]> {
  const db = await getUserDb();
  const rows = await db.getAllAsync<{ collection_id: number }>(
    "SELECT collection_id FROM collection_words WHERE word_id = ?",
    [wordId]
  );
  return rows.map((r) => r.collection_id);
}

export async function getWordsInCollection(collectionId: number): Promise<SavedWord[]> {
  const db = await getUserDb();
  const rows = await db.getAllAsync<SavedWordRow>(
    `SELECT w.* FROM saved_words w
     JOIN collection_words cw ON cw.word_id = w.id
     WHERE cw.collection_id = ?
     ORDER BY w.headword COLLATE NOCASE`,
    [collectionId]
  );
  return rows.map(toSavedWord);
}