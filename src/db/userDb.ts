import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Every other file calls this to get the database.
export function getUserDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

async function init() {
  const db = await SQLite.openDatabaseAsync("user.db");
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE saved_words (
          id TEXT PRIMARY KEY NOT NULL,
          language TEXT NOT NULL,
          headword TEXT NOT NULL,
          saved_at INTEGER NOT NULL
        );
        CREATE TABLE collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE collection_words (
          collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
          word_id TEXT NOT NULL REFERENCES saved_words(id) ON DELETE CASCADE,
          PRIMARY KEY (collection_id, word_id)
        );
        PRAGMA user_version = 1;
      `);
    });
  }

  if (version < 2) {
    await db.withTransactionAsync(async () => {
    await db.execAsync(`
      ALTER TABLE saved_words ADD COLUMN due_at INTEGER;
      ALTER TABLE saved_words ADD COLUMN card TEXT;
      CREATE INDEX idx_saved_words_due ON saved_words(due_at);
      PRAGMA user_version = 2;
      `);
    });
  }

  if (version < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE card_states (
            word_id TEXT NOT NULL REFERENCES saved_words(id) ON DELETE CASCADE,
            mode TEXT NOT NULL,
            card TEXT NOT NULL,
            due_at INTEGER NOT NULL,
            PRIMARY KEY (word_id, mode)
        );
        CREATE INDEX idx_card_states_due ON card_states(mode, due_at);
        INSERT INTO card_states (word_id, mode, card, due_at)
            SELECT id, 'flashcard', card, due_at FROM saved_words
            WHERE card IS NOT NULL AND due_at IS NOT NULL;
        PRAGMA user_version = 3;
        `);
      });
    }
}