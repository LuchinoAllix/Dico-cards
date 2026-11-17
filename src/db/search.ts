import { DICTIONARIES } from "./dictionaries";
import { getDictionaryDb } from "./dictionaryDb";
import type { DictionaryEntry } from "../types/dictionary";

interface EntryRow {
  id: string;
  headword: string;
  pronunciation: string | null;
  meanings: string; // JSON text
}

const COLUMNS = "id, headword, pronunciation, meanings";

function toEntry(row: EntryRow, language: string): DictionaryEntry {
  return {
    id: row.id,
    headword: row.headword,
    language,
    pronunciation: row.pronunciation ?? undefined,
    meanings: JSON.parse(row.meanings),
  };
}

// Lowercase and strip accents. Must match normalize() in the build script.
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function searchWords(
  language: string,
  query: string,
  limit = 20
): Promise<DictionaryEntry[]> {
  const q = normalize(query);
  if (!q) return [];
  const db = await getDictionaryDb(language);
  // "starts with q" as a range: key >= q AND key < q + a character bigger than any letter.
  // A range can use the index, which is what keeps this fast on a huge dictionary.
  const rows = await db.getAllAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM entries WHERE key >= ? AND key < ? ORDER BY key, rowid LIMIT ?`,
    [q, q + "\uffff", limit]
  );
  return rows.map((row) => toEntry(row, language));
}

// ids look like "fr:gratis": the language is everything before the first colon.
export async function getEntry(id: string): Promise<DictionaryEntry | undefined> {
  const language = id.slice(0, id.indexOf(":"));
  // A saved word from a language that's no longer in the registry: ignore it.
  if (!DICTIONARIES.some((d) => d.code === language)) return undefined;
  const db = await getDictionaryDb(language);
  const row = await db.getFirstAsync<EntryRow>(`SELECT ${COLUMNS} FROM entries WHERE id = ?`, [id]);
  return row ? toEntry(row, language) : undefined;
}

function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33 + text.charCodeAt(i)) % 4294967296;
  }
  // Final mixing, so that similar texts give very different numbers.
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return h >>> 0;
}

// Same word all day, a different one tomorrow.
export async function getWordOfTheDay(
  language: string,
  date = new Date()
): Promise<DictionaryEntry | undefined> {
  const db = await getDictionaryDb(language);
  const meta = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = 'entry_count'"
  );
  const count = Number(meta?.value);
  if (!count) return undefined;

  const key = `${language}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  // The script inserts words one by one, so rowids run from 1 to count with no gaps.
  const row = await db.getFirstAsync<EntryRow>(
    `SELECT ${COLUMNS} FROM entries WHERE rowid = ?`,
    [(hash(key) % count) + 1]
  );
  return row ? toEntry(row, language) : undefined;
}