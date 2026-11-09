import rawWords from "../data/words.fr.json";
import type { DictionaryEntry } from "../types/dictionary";

const entries = rawWords as DictionaryEntry[];
const byId = new Map(entries.map((e) => [e.id, e]));

// Lowercase and strip accents, so "ecole" finds "école".
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Built once, when the app starts: each entry with its normalized key, sorted A-Z.
const index = entries
  .map((entry) => ({ entry, key: normalize(entry.headword) }))
  .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

export async function searchWords(query: string, limit = 20): Promise<DictionaryEntry[]> {
  const q = normalize(query);
  if (!q) return [];
  return index
    .filter((item) => item.key.startsWith(q))
    .slice(0, limit)
    .map((item) => item.entry);
}

export async function getEntry(id: string): Promise<DictionaryEntry | undefined> {
  return byId.get(id);
}