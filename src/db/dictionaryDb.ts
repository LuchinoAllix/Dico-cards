import * as SQLite from "expo-sqlite";
import Storage from "expo-sqlite/kv-store";
import { DICTIONARIES } from "./dictionaries";

const opened = new Map<string, Promise<SQLite.SQLiteDatabase>>();

export function getDictionaryDb(language: string): Promise<SQLite.SQLiteDatabase> {
  let db = opened.get(language);
  if (!db) {
    db = open(language);
    opened.set(language, db);
  }
  return db;
}

async function open(language: string): Promise<SQLite.SQLiteDatabase> {
  const info = DICTIONARIES.find((d) => d.code === language);
  if (!info) throw new Error(`Unknown language: ${language}`);

  // Copy the bundled file the first time, or again when its version changed.
  const versionKey = `dictionaryVersion:${language}`;
  const installed = Number(await Storage.getItem(versionKey)) || 0;

    await SQLite.importDatabaseFromAssetAsync(info.dbName, {
    assetId: info.asset,
    forceOverwrite: installed !== info.version,
  });

  const db = await SQLite.openDatabaseAsync(info.dbName);
  // Throws if the file isn't a valid dictionary, so a bad copy is never marked as installed.
  await db.getFirstAsync("SELECT 1 FROM entries LIMIT 1");
  await Storage.setItem(versionKey, String(info.version));
  return db;
}